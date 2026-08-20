'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { BufferAttribute, Color, NormalBlending } from 'three'
import type { Points, ShaderMaterial } from 'three'
import { SceneCanvas } from '@/components/motion/webgl/SceneCanvas'
import { heroFragmentShader, heroVertexShader } from '@/components/motion/webgl/heroField.glsl'
import { clamp, lerp, seededRandom } from '@/lib/utils'

/**
 * Particle count. Phase 4b section 5 halves the band, from 20,000 to 40,000 down to
 * 10,000 to 20,000, because dark points on white are visually louder than light
 * points on black at equal count. 12,000 of them, all inside the frustum, which is
 * a denser field than the dark build's 28,000 scattered across a box the camera
 * could only partly see.
 *
 * The watchdog below halves it once if the frame rate cannot hold, because the
 * brief's cut order is particle count before anything visual.
 */
const COUNT = 12000
const MIN_COUNT = 5000

/** Cursor uniform smoothing. Brief 7b.2A fixes this at 0.08. */
const CURSOR_LERP = 0.08

function readPalette() {
  const styles = getComputedStyle(document.documentElement)
  /*
    No literal fallbacks. They used to hold the dark palette, went stale the moment
    the canvas changed, and were dead code either way since this scene only mounts
    after the stylesheet has applied. An unresolvable token now falls back to the
    body's own resolved colour, which is a token value rather than a copy of one.
  */
  const fallback = getComputedStyle(document.body).color
  const pick = (token: string) => new Color(styles.getPropertyValue(token).trim() || fallback)

  return {
    border: pick('--color-border'),
    fgMuted: pick('--color-fg-muted'),
    accent: pick('--color-accent'),
  }
}

/** Reference viewport the count and the point size are calibrated against. */
const REFERENCE_AREA = 1440 * 900
const REFERENCE_WIDTH = 1440

/** Point size at the reference width, chosen by measuring ink coverage. */
const BASE_SIZE = 6.0

function Field({ count, onResolved }: { count: number; onResolved: (value: number) => void }) {
  const points = useRef<Points | null>(null)
  const material = useRef<ShaderMaterial | null>(null)
  const { viewport, size } = useThree()

  // Smoothed cursor in world units, plus the raw target it eases toward.
  const cursor = useRef({ x: 0, y: 0, targetX: 0, targetY: 0, strength: 0, targetStrength: 0 })
  const dropped = useRef(false)
  const fps = useRef({ frames: 0, elapsed: 0 })

  const geometry = useMemo(() => {
    /*
      Density is the constant, not the count. Spread follows the viewport, so a
      fixed count means a narrow window gets the same points in a quarter of the
      area and the field reads as noise rather than as dust. Found by looking at the
      375px screenshot, which is what the review pass in criterion 14 is for.
    */
    const area = size.width * size.height || REFERENCE_AREA
    const scaled = clamp(Math.round(count * (area / REFERENCE_AREA)), 2200, count)

    const random = seededRandom(`wyrd-hero-field:${scaled}`)
    const positions = new Float32Array(scaled * 3)
    const randoms = new Float32Array(scaled)
    const scales = new Float32Array(scaled)

    /*
      Spread across the visible frustum rather than an arbitrary slab. The dark
      build scattered points over a fixed 16 by 10 box while the camera could only
      see about 6.6 by 4.1 of it, so roughly five points in six were off screen and
      the count did not mean what it said. Matching the viewport is what makes the
      density number honest, and it is why the count could come down rather than up.

      A little past the edges, so a point drifting or being pushed by the cursor
      does not reveal a hard boundary.
    */
    const spreadX = viewport.width * 1.2
    const spreadY = viewport.height * 1.2

    for (let index = 0; index < scaled; index += 1) {
      positions[index * 3] = (random() - 0.5) * spreadX
      positions[index * 3 + 1] = (random() - 0.5) * spreadY
      // Depth only needs to be enough for a parallax hint.
      positions[index * 3 + 2] = (random() - 0.5) * 2
      randoms[index] = random()
      scales[index] = 0.5 + random() * 0.8
    }

    return { positions, randoms, scales, drawn: scaled }
  }, [count, size.width, size.height, viewport.width, viewport.height])

  useEffect(() => {
    onResolved(geometry.drawn)
  }, [geometry.drawn, onResolved])

  const uniforms = useMemo(() => {
    const palette = readPalette()
    return {
      uTime: { value: 0 },
      uCursor: { value: [0, 0] as [number, number] },
      uCursorStrength: { value: 0 },
      uPixelRatio: { value: 1 },
      uSize: { value: BASE_SIZE },
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

    /*
      Point size follows the viewport as well as the count.

      A point is a fixed number of pixels, but the type around it is not: at 1440
      the headline is 80px and a 3px dot is dust, at 375 the headline is 36px and the
      same dot is grit. Scaling the size with width keeps the ratio between the field
      and the type roughly constant, which is what the eye actually reads.
    */
    uniforms.uSize.value = BASE_SIZE * clamp(size.width / REFERENCE_WIDTH, 0.6, 1)
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
        /*
          Normal blending, not additive. Additive on white produces nothing: white
          is already at maximum on every channel, so an additive field simply
          vanishes. Phase 4b section 5.
        */
        blending={NormalBlending}
      />
    </points>
  )
}

/**
 * The Full tier hero field. Brief 6.1 S1 layer 2 and 7b.2A.
 *
 * One `THREE.Points`, 14,000 instances, one draw call, all motion in the vertex
 * shader. Normal blending with per point alpha over the light canvas, soft circular
 * falloff, no halo and no postprocessing pass. See ADR 0017 and ADR 0019.
 */
export function HeroFieldScene({ onContextLost }: { onContextLost?: () => void }) {
  const [count, setCount] = useState(COUNT)
  const [drawn, setDrawn] = useState(COUNT)
  const onResolved = useCallback((value: number) => setDrawn(value), [])

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
      pointCount={drawn}
      className="absolute inset-0 h-full w-full"
    >
      <Field count={count} onResolved={onResolved} />
    </SceneCanvas>
  )
}
