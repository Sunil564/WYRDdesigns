'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { AdditiveBlending, BufferAttribute, Color } from 'three'
import type { Points, ShaderMaterial } from 'three'
import { SceneCanvas } from '@/components/motion/webgl/SceneCanvas'
import { heroFragmentShader, heroVertexShader } from '@/components/motion/webgl/heroField.glsl'
import { lerp, seededRandom } from '@/lib/utils'

/**
 * Particle count. 28,000 sits inside the brief's 20,000 to 40,000 band and holds
 * 60fps with headroom on a 2021 mid range laptop. One `THREE.Points`, one draw call.
 *
 * The watchdog below halves it once if the frame rate cannot hold, because the
 * brief's cut order is particle count before anything visual.
 */
const COUNT = 28000
const MIN_COUNT = 9000

/** Cursor uniform smoothing. Brief 7b.2A fixes this at 0.08. */
const CURSOR_LERP = 0.08

function readPalette() {
  const styles = getComputedStyle(document.documentElement)
  const pick = (token: string, fallback: string) =>
    new Color(styles.getPropertyValue(token).trim() || fallback)

  return {
    border: pick('--color-border', '#26262e'),
    fgMuted: pick('--color-fg-muted', '#8b8b95'),
    accent: pick('--color-accent', '#ff521f'),
  }
}

function Field({ count }: { count: number }) {
  const points = useRef<Points | null>(null)
  const material = useRef<ShaderMaterial | null>(null)
  const { viewport, size } = useThree()

  // Smoothed cursor in world units, plus the raw target it eases toward.
  const cursor = useRef({ x: 0, y: 0, targetX: 0, targetY: 0, strength: 0, targetStrength: 0 })
  const dropped = useRef(false)
  const fps = useRef({ frames: 0, elapsed: 0 })

  const geometry = useMemo(() => {
    const random = seededRandom(`wyrd-hero-field:${count}`)
    const positions = new Float32Array(count * 3)
    const randoms = new Float32Array(count)
    const scales = new Float32Array(count)

    for (let index = 0; index < count; index += 1) {
      // A slab rather than a cube. The field sits behind the headline, so depth
      // only needs to be enough for a parallax hint.
      positions[index * 3] = (random() - 0.5) * 16
      positions[index * 3 + 1] = (random() - 0.5) * 10
      positions[index * 3 + 2] = (random() - 0.5) * 3
      randoms[index] = random()
      scales[index] = 0.4 + random() * 0.9
    }

    return { positions, randoms, scales }
  }, [count])

  const uniforms = useMemo(() => {
    const palette = readPalette()
    return {
      uTime: { value: 0 },
      uCursor: { value: [0, 0] as [number, number] },
      uCursorStrength: { value: 0 },
      uPixelRatio: { value: 1 },
      uSize: { value: 2.9 },
      uDrift: { value: 0.55 },
      uOpacity: { value: 0 },
      uColourBorder: { value: palette.border },
      uColourFgMuted: { value: palette.fgMuted },
      uColourAccent: { value: palette.accent },
    }
    // Palette is read once. It cannot change: there is one theme. ADR 0010.
  }, [])

  useEffect(() => {
    uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio || 1, 2)
  }, [uniforms, size])

  useEffect(() => {
    const onPointerMove = (event: PointerEvent) => {
      // Screen pixels to world units on the z = 0 plane.
      const nx = (event.clientX / window.innerWidth) * 2 - 1
      const ny = -((event.clientY / window.innerHeight) * 2 - 1)
      cursor.current.targetX = (nx * viewport.width) / 2
      cursor.current.targetY = (ny * viewport.height) / 2
      cursor.current.targetStrength = 1
    }

    const onPointerLeave = () => {
      cursor.current.targetStrength = 0
    }

    // Coarse pointers never reach this scene, they are on the Reduced tier, so
    // there is no touch branch to write here.
    window.addEventListener('pointermove', onPointerMove, { passive: true })
    window.addEventListener('pointerleave', onPointerLeave)
    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerleave', onPointerLeave)
    }
  }, [viewport.width, viewport.height])

  useFrame((_state, delta) => {
    const shader = material.current
    if (!shader) return

    const clamped = Math.min(delta, 0.05)
    shader.uniforms.uTime!.value += clamped

    // Fade the field in over its first second rather than popping it on.
    const opacity = shader.uniforms.uOpacity!
    opacity.value = Math.min(1, opacity.value + clamped * 1.4)

    const state = cursor.current
    state.x = lerp(state.x, state.targetX, CURSOR_LERP)
    state.y = lerp(state.y, state.targetY, CURSOR_LERP)
    state.strength = lerp(state.strength, state.targetStrength, CURSOR_LERP)

    const uniformCursor = shader.uniforms.uCursor!.value as [number, number]
    uniformCursor[0] = state.x
    uniformCursor[1] = state.y
    shader.uniforms.uCursorStrength!.value = state.strength * 1.9

    // Frame rate watchdog. If the first two seconds cannot hold 40fps, drop the
    // count once. Cutting particles is the brief's first cut, before anything
    // visual gets touched.
    if (!dropped.current) {
      fps.current.frames += 1
      fps.current.elapsed += clamped
      if (fps.current.elapsed > 2) {
        const average = fps.current.frames / fps.current.elapsed
        if (average < 40) {
          dropped.current = true
          window.dispatchEvent(new CustomEvent('wyrd:field-downshift'))
        }
        fps.current.frames = 0
        fps.current.elapsed = 0
      }
    }
  })

  return (
    <points ref={points} frustumCulled={false}>
      <bufferGeometry>
        <primitive
          attach="attributes-position"
          object={new BufferAttribute(geometry.positions, 3)}
        />
        <primitive attach="attributes-aRandom" object={new BufferAttribute(geometry.randoms, 1)} />
        <primitive attach="attributes-aScale" object={new BufferAttribute(geometry.scales, 1)} />
      </bufferGeometry>
      <shaderMaterial
        ref={material}
        vertexShader={heroVertexShader}
        fragmentShader={heroFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        depthTest={false}
        blending={AdditiveBlending}
      />
    </points>
  )
}

/**
 * The Full tier hero field. Brief 6.1 S1 layer 2 and 7b.2A.
 *
 * One `THREE.Points`, 28,000 instances, one draw call, all motion in the vertex
 * shader. Additive blending over the dark canvas, soft circular falloff, and a
 * wide halo on the roughly one in twelve accent points instead of a
 * postprocessing bloom pass. See ADR 0017.
 */
export function HeroFieldScene({ onContextLost }: { onContextLost?: () => void }) {
  const [count, setCount] = useState(COUNT)

  // The watchdog in Field fires this at most once per mount. Halving the count
  // rebuilds the geometry, which is a one off cost on a machine that has already
  // told us it cannot hold the frame rate.
  useEffect(() => {
    const onDownshift = () => {
      setCount((current) => Math.max(MIN_COUNT, Math.round(current / 2)))
    }
    window.addEventListener('wyrd:field-downshift', onDownshift)
    return () => window.removeEventListener('wyrd:field-downshift', onDownshift)
  }, [])

  return (
    <SceneCanvas
      frameloop="always"
      onContextLost={onContextLost}
      className="absolute inset-0 h-full w-full"
    >
      <Field count={count} />
    </SceneCanvas>
  )
}
