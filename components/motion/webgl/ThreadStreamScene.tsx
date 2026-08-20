'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { BufferAttribute, Color, NormalBlending } from 'three'
import type { Points, ShaderMaterial } from 'three'
import { subscribeThread, threadState } from '@/components/motion/threadStore'
import type { ThreadStreamData } from '@/components/motion/threadStore'
import { currentScroll } from '@/components/motion/useLenis'
import {
  threadFragmentShader,
  threadVertexShader,
} from '@/components/motion/webgl/threadStream.glsl'

/**
 * Base point size in CSS pixels, before the per particle variance. Tuned against the
 * old hairline: the stream has to carry the weight a 1px line carried, and it is
 * doing that with a colour four times darker, so the points are small.
 */
const BASE_SIZE = 2.0

/**
 * The Thread as a particle stream. Particle brief part 2, ADR 0020.
 *
 * A scene, not a canvas. It shares the one canvas with the hero field, which is what
 * lets a particle leave the field and join the stream later in this brief, and what
 * keeps brief 7b.4's one canvas rule true.
 *
 * Geometry arrives from `threadStore`, sampled from the SVG paths by `Thread`. This
 * scene never computes a route.
 */
export function ThreadStream({ onCount }: { onCount?: (value: number) => void }) {
  const points = useRef<Points | null>(null)
  const material = useRef<ShaderMaterial | null>(null)
  const [data, setData] = useState<ThreadStreamData | null>(() => threadState().data)

  useEffect(() => {
    const sync = () => setData(threadState().data)
    sync()
    return subscribeThread(sync)
  }, [])

  useEffect(() => {
    onCount?.(data?.samples.count ?? 0)
  }, [data, onCount])

  const uniforms = useMemo(() => {
    const styles = getComputedStyle(document.documentElement)
    const fallback = getComputedStyle(document.body).color
    const pick = (token: string) => new Color(styles.getPropertyValue(token).trim() || fallback)

    return {
      uPixelRatio: { value: 1 },
      uSize: { value: BASE_SIZE },
      uOpacity: { value: 0 },
      uColourRest: { value: pick('--color-fg-muted') },
    }
  }, [])

  useFrame((state, delta) => {
    const object = points.current
    const shader = material.current
    if (!object || !shader || !data) return

    /*
      Document pixels to world units, on the object's own transform.

      This was three float uniforms and a transform in the vertex shader first, and
      the stream rendered nothing: the object was in the scene, visible, with 16,000
      points and a compiling program, and every particle landed off screen. The
      uniforms read correctly in JavaScript on the same frame they were written, so
      the fault was somewhere between the write and the draw and could not be pinned
      down from the code.

      Placement now rides `matrixWorld`, which Three uploads itself for every object
      it draws, so the mapping travels by the path the camera and the hero field's
      own matrices already travel. It also cannot go stale by construction: there is
      no cache of mine between the number and the vertex.

      The mapping, for the record:
        world.x = (doc.x - halfWidth) * worldPerPx
        world.y = (halfHeight - (doc.y - scroll)) * worldPerPx
      which is a scale of (w, -w, 1) and a translation of
      (-halfWidth * w, (halfHeight + scroll) * w, 0). The negative y scale is the
      flip from document coordinates, where y grows downward, to world coordinates,
      where it grows up. Points have no winding, so a mirrored scale costs nothing.
    */
    const { size, viewport } = state
    const worldPerPx = size.height > 0 ? viewport.height / size.height : 1
    const scroll = currentScroll()

    object.scale.set(worldPerPx, -worldPerPx, 1)
    object.position.set((-size.width / 2) * worldPerPx, (size.height / 2 + scroll) * worldPerPx, 0)

    /*
      Written through the live material, never through the object this component
      memoised.

      This is the fault that hid the whole stream. The hero field animates its
      uniforms through `material.current.uniforms` and works; this scene wrote to its
      own `useMemo` object and the fade-in never left zero, so every fragment fell
      through `alpha < 0.002` and discarded. The vec2 in the same block did reach the
      GPU, because mutating an array in place is visible through any copy that shares
      the array reference, which is what made the failure look like it was about
      placement rather than about alpha.

      `material.uniforms` is by definition the object the renderer uploads. Writing
      there is the fix for the path rather than for the symptom, and it is why the
      pixel ratio moved here too: stale at 1 it would have halved the point size on
      every 2x display, which is a bug that would have shipped looking like a design
      choice.
    */
    const live = shader.uniforms
    live.uPixelRatio!.value = Math.min(window.devicePixelRatio || 1, 2)
    live.uOpacity!.value = Math.min(
      1,
      (live.uOpacity!.value as number) + Math.min(delta, 0.05) * 1.4,
    )
  })

  if (!data) return null
  const { samples } = data

  return (
    // Keyed on the sample version, so a resize replaces the geometry rather than
    // mutating buffers of the wrong length.
    <points key={data.version} ref={points} frustumCulled={false}>
      <bufferGeometry>
        <primitive
          attach="attributes-position"
          object={new BufferAttribute(samples.positions, 3)}
        />
        <primitive attach="attributes-aAlong" object={new BufferAttribute(samples.along, 1)} />
        <primitive attach="attributes-aGroup" object={new BufferAttribute(samples.group, 1)} />
        <primitive attach="attributes-aRandom" object={new BufferAttribute(samples.random, 1)} />
      </bufferGeometry>
      <shaderMaterial
        ref={material}
        vertexShader={threadVertexShader}
        fragmentShader={threadFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        depthTest={false}
        // Normal, with per point alpha. Never additive: additive on white produces
        // nothing. Particle brief 2.4.
        blending={NormalBlending}
      />
    </points>
  )
}
