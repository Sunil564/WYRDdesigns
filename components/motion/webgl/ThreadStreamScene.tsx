'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { BufferAttribute, Color, NormalBlending } from 'three'
import type { Points, ShaderMaterial } from 'three'
import { MAX_BANDS, subscribeThread, threadState } from '@/components/motion/threadStore'
import type { ThreadStreamData } from '@/components/motion/threadStore'
import { HEAD_LENGTH, MAX_TEXT_RECTS } from '@/components/motion/threadGeometry'
import { currentScroll } from '@/components/motion/useLenis'
import {
  threadFragmentShader,
  threadVertexShader,
} from '@/components/motion/webgl/threadStream.glsl'

/**
 * Base point size in CSS pixels, before the per particle variance.
 *
 * Was 2.0, tuned against the old SVG hairline so the stream carried the weight a 1px line
 * carried. That reference is gone: the amending brief replaces the tight line with a
 * spiral trail, and spreading the same particles over a 16px radius thins the apparent
 * line, so they have to be heavier to hold the same presence. 50 percent up, per the
 * brief. Criterion 10 of the parent brief is superseded rather than failed, and ADR 0020
 * records why.
 */
const BASE_SIZE = 3.0

/**
 * Maximum distance a particle rides from the path centre, in CSS pixels. Amending brief.
 *
 * Section 2.4 of the parent brief specified 1 to 3px of perpendicular offset, which is
 * the same mechanism turned down until it reads as a pinstripe. 16px is inside the brief's
 * 12 to 20 range, and the radius hash squares itself in the shader so most particles ride
 * well inside it.
 */
const SPIRAL_RADIUS = 16

/**
 * Where the reveal line sits, as a fraction of viewport height from the top.
 *
 * The brief asks for 60 to 70 percent. Two thirds puts the head band in the lower
 * third, which is where a reader's eye already is on the way down, and leaves 240px of
 * head above the line comfortably on screen at every viewport height this site
 * supports. Because the line is derived from scroll every frame, this fraction is the
 * only thing that decides where the head appears, and it cannot drift.
 */
export const REVEAL_OFFSET = 2 / 3

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
      // The head is the hero field's accent, the same token, because the stream is
      // meant to read as having come out of the field. Particle brief 2.1.
      uColourHead: { value: pick('--color-accent') },
      /*
        The same pair for the dark grounds the stream crosses. Particle brief 2.5.

        `--accent-on-inverse` is the same #ff521f as `--accent` today, since ADR 0019
        gave the accent no twin, so the visible switch at a band edge is the rest colour
        alone. Read from tokens regardless, so a future divergence needs no code here.
      */
      uColourRestInverse: { value: pick('--color-fg-inverse-muted') },
      uColourHeadInverse: { value: pick('--color-accent-on-inverse') },
      // Dark ground ranges in document pixels, from the same measurement pass that
      // samples the paths. Sized at the uniform array length, not the live band count,
      // so a relayout cannot change the array length and force a recompile.
      uBandTops: { value: new Float32Array(MAX_BANDS) },
      uBandBottoms: { value: new Float32Array(MAX_BANDS) },
      uBandCount: { value: 0 },
      // The dispersion band. Spread stays at zero until a logo row is measured, which
      // switches the effect off on any page without one.
      uDisperseTop: { value: 0 },
      uDisperseBottom: { value: 1 },
      uDisperseSpread: { value: new Float32Array([0, 0]) },
      uDisperseCentreX: { value: 0 },
      // The hero's lower half, which the handoff scatters its origins across. Zero width
      // until a hero is measured, which switches the handoff off rather than branching.
      uHandoffBox: { value: new Float32Array([0, 0, 0, 0]) },
      // Body copy the trail recedes over. Four floats a box, count alongside.
      uTextRects: { value: new Float32Array(MAX_TEXT_RECTS * 4) },
      uTextCount: { value: 0 },
      uSpiralRadius: { value: SPIRAL_RADIUS },
      // The trail rotates at rest, so this scene now needs a clock where it did not.
      uTime: { value: 0 },
      // The reveal line in document pixels, written every frame, and the depth of the
      // head band above it. One scalar each, where step 5 carried an array per path.
      uRevealLine: { value: 0 },
      uHeadLength: { value: HEAD_LENGTH },
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
    // Clamped like the fade in below, so a long frame or a backgrounded tab cannot jump
    // the trail through a quarter turn on the frame it comes back.
    live.uTime!.value = (live.uTime!.value as number) + Math.min(delta, 0.05)
    live.uOpacity!.value = Math.min(
      1,
      (live.uOpacity!.value as number) + Math.min(delta, 0.05) * 1.4,
    )

    /*
      The reveal line, from the same scroll that just placed the object.

      `scroll` above is the number Lenis wrote to the document before calling
      `ScrollTrigger.update()`, so it is the same number the SVG carrier's
      `stroke-dashoffset` was computed from. Deriving the line from it here, rather than
      reading scroll a second time or routing the value through the store, is what keeps
      one scroll source: the placement and the reveal use one value in one frame, so
      `uRevealLine - scroll` is exactly `height * REVEAL_OFFSET` on every frame and the
      line is stationary on screen by construction.

      Routing it through the ScrollTrigger's own eased progress was the other option and
      is worse. That value lags the scroll by design, which is what made the old head
      feel drawn, but a lagging reveal line is a line that slides up and down the
      viewport while you scroll. The brief is explicit that nothing on the render side
      eases toward the line, and this is why.

      Two floats a frame, no buffer upload, no per path array, no dynamic indexing.
    */
    live.uRevealLine!.value = scroll + size.height * REVEAL_OFFSET

    /*
      The dark grounds, copied here for the same reason the reveal line is computed here:
      the only writes to this material happen in this block, through the live uniforms,
      so there is nowhere for a stale holder to hide. See CLAUDE.md, WebGL uniforms.

      Cheap enough to do unconditionally. Eight floats and a count, no upload.
    */
    ;(live.uBandTops!.value as Float32Array).set(data.bandTops)
    ;(live.uBandBottoms!.value as Float32Array).set(data.bandBottoms)
    live.uBandCount!.value = data.bandCount

    const spread = live.uDisperseSpread!.value as Float32Array
    if (data.disperse) {
      live.uDisperseTop!.value = data.disperse.top
      live.uDisperseBottom!.value = data.disperse.bottom
      spread[0] = data.disperse.spreadX
      spread[1] = data.disperse.spreadY
      live.uDisperseCentreX!.value = data.disperse.centreX
    } else {
      spread[0] = 0
      spread[1] = 0
    }

    /*
      The handoff's origin box: the hero's lower half, full page width.

      Width comes from the canvas rather than the geometry because the document has no
      horizontal scroll, so the two are the same number and this one is already to hand. A
      null hero leaves the box zero width, and the shader treats that as the handoff being
      off.
    */
    ;(live.uTextRects!.value as Float32Array).set(data.text.rects)
    live.uTextCount!.value = data.text.count

    const box = live.uHandoffBox!.value as Float32Array
    if (data.hero) {
      box[0] = 0
      box[1] = size.width
      box[2] = data.hero.top + (data.hero.bottom - data.hero.top) * 0.5
      box[3] = data.hero.bottom
    } else {
      box[0] = 0
      box[1] = 0
      box[2] = 0
      box[3] = 0
    }
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
        {/*
          Carried, and read by nothing right now. The Y based reveal needs neither, but
          `aAlong` is a particle's position along its own strand and `aGroup` is which
          strand, and both are wanted for the hero handoff in step 8, which has to assign
          a field particle to a place on the route. The brief is explicit about keeping
          `aAlong`.
        */}
        <primitive attach="attributes-aAlong" object={new BufferAttribute(samples.along, 1)} />
        <primitive attach="attributes-aGroup" object={new BufferAttribute(samples.group, 1)} />
        {/*
          Read by the spiral: arc length gives the phase a rate in real pixels rather than
          per normalised path, and the normal gives it a direction to swing along. Both
          come straight out of the sampler, which already walked the curve to get them.
        */}
        <primitive
          attach="attributes-aDistance"
          object={new BufferAttribute(samples.distance, 1)}
        />
        <primitive attach="attributes-aNormal" object={new BufferAttribute(samples.normals, 2)} />
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
