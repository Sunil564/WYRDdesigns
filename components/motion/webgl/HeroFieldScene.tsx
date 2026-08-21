'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { BufferAttribute, Color, NormalBlending } from 'three'
import type { Points, ShaderMaterial } from 'three'
import { heroFragmentShader, heroVertexShader } from '@/components/motion/webgl/heroField.glsl'
import { currentScroll } from '@/components/motion/useLenis'
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
 *
 * Down 12 percent from 12,000 by the amending brief. That is the whole of the hero change:
 * size, curl noise, cursor displacement, the one in nine accent ratio and normal blending
 * are all untouched. It also closes item B of the visibility brief, which had asked for 50
 * percent more point size against a build where uPixelRatio was stale: the fix in 070edf5
 * already roughly doubled the points on a 2x display, so the field is thinned instead of
 * enlarged. Item B is cancelled, not deferred. See ADR 0020 section 12.
 */
const COUNT = 10560
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

/**
 * Point size at the reference width, chosen by measuring ink coverage.
 *
 * Phase 4b raised this from the ported dark value to 6.0 for the light canvas.
 * The particle brief 1.2 asks for a further 15 to 20 percent on top of the post-4b
 * value, not on top of the pre-4b one: 7.0 is 17 percent up from 6.0. Compounding
 * the two increases would land near 8.4, which 4b already measured as blobs.
 */
const BASE_SIZE = 7.0

/**
 * The hero's document box, remeasured whenever the layout can have moved.
 *
 * The field is pinned to the hero's centre and clipped to its edges. Both used to
 * be free: the canvas was the hero section, so the browser did the pinning with
 * layout and the clipping with overflow-hidden. On the shared canvas the field has
 * to know where the hero is.
 */
function useHeroBand() {
  const band = useRef({ top: 0, bottom: 0, centre: 0 })

  useEffect(() => {
    const read = () => {
      const hero = document.querySelector('#hero')
      if (!hero) return
      const box = hero.getBoundingClientRect()
      const top = box.top + window.scrollY
      band.current = { top, bottom: top + box.height, centre: top + box.height / 2 }
    }

    read()
    window.addEventListener('resize', read)

    let observer: ResizeObserver | undefined
    const hero = document.querySelector('#hero')
    if (typeof ResizeObserver !== 'undefined' && hero) {
      observer = new ResizeObserver(read)
      observer.observe(hero)
    }
    // Fonts reflowing the headline changes the hero's height.
    void document.fonts?.ready.then(read)

    return () => {
      window.removeEventListener('resize', read)
      observer?.disconnect()
    }
  }, [])

  return band
}

function Field({ count, onResolved }: { count: number; onResolved: (value: number) => void }) {
  const points = useRef<Points | null>(null)
  const material = useRef<ShaderMaterial | null>(null)
  const { viewport, size } = useThree()
  const hero = useHeroBand()

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
      /*
        Size variance, widened as the base size grew. A uniform size reads as a
        texture rather than as a field, and the wider the base the more obvious
        that gets. Particle brief 1.2.
      */
      scales[index] = 0.42 + random() * 1.0
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
      uWorldPerPx: { value: 1 },
      uHalfSizePx: { value: [0, 0] as [number, number] },
      uHeroCentre: { value: 0 },
      uScroll: { value: 0 },
      uHeroBand: { value: [0, 0] as [number, number] },
    }
    // Palette is read once. It cannot change: there is one theme. ADR 0010.
  }, [])

  useEffect(() => {
    const onPointerMove = (event: PointerEvent) => {
      /*
        Screen pixels to the field's own frame, which is centred on the hero and
        measured in world units. At the top of the page this is the same mapping the
        scene used when the canvas was the hero box, and further down the page it is
        the correction that mapping was missing: the old one read the pointer in
        window coordinates against a canvas that had scrolled away.
      */
      const worldPerPx = size.height > 0 ? viewport.height / size.height : 1
      cursor.current.targetX = (event.clientX - size.width / 2) * worldPerPx
      cursor.current.targetY = (hero.current.centre - (event.clientY + window.scrollY)) * worldPerPx
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
  }, [hero, size.width, size.height, viewport.height])

  useFrame((_state, delta) => {
    const shader = material.current
    const object = points.current
    if (!shader) return

    // The scroll authority, not the document. See currentScroll.
    const scroll = currentScroll()
    const band = hero.current

    /*
      Nothing to draw once the hero is a viewport behind. The canvas stays alive for
      the thread scene, so the field has to switch itself off rather than relying on
      the canvas leaving the viewport, which it no longer does.
    */
    if (object) object.visible = scroll < band.bottom + size.height
    if (object && !object.visible) return

    const clamped = Math.min(delta, 0.05)
    shader.uniforms.uTime!.value += clamped

    /*
      Viewport maths in the frame loop, not in an effect. R3F's render loop is not
      synchronised with React's passive effects, so an effect keyed on the canvas
      size can run once against the zero it measures on the first pass and never run
      again. That cost the Thread stream a build to find. Two divisions per frame,
      and it cannot be stale.
    */
    const live = _state.size
    const box = _state.viewport
    shader.uniforms.uPixelRatio!.value = Math.min(window.devicePixelRatio || 1, 2)
    /*
      Point size follows the viewport as well as the count.

      A point is a fixed number of pixels, but the type around it is not: at 1440
      the headline is 80px and a 3px dot is dust, at 375 the headline is 36px and the
      same dot is grit. Scaling the size with width keeps the ratio between the field
      and the type roughly constant, which is what the eye actually reads.

      Both of these were set in an effect against this component's own memoised
      uniforms object, which is not the object the renderer uploads. The size was
      right by luck, since its stale value is its intended one at 1440. The pixel
      ratio was not: stale at 1, every point on a 2x display was half the size it
      should be. Found while working out why the Thread stream was invisible, which
      was the same fault with a fatal symptom.
    */
    shader.uniforms.uSize!.value = BASE_SIZE * clamp(live.width / REFERENCE_WIDTH, 0.6, 1)
    shader.uniforms.uWorldPerPx!.value = live.height > 0 ? box.height / live.height : 1
    const halfSize = shader.uniforms.uHalfSizePx!.value as [number, number]
    halfSize[0] = live.width / 2
    halfSize[1] = live.height / 2

    shader.uniforms.uScroll!.value = scroll
    shader.uniforms.uHeroCentre!.value = band.centre
    const heroBand = shader.uniforms.uHeroBand!.value as [number, number]
    heroBand[0] = band.top
    heroBand[1] = band.bottom

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
 * The Full tier hero field, as a scene rather than a canvas. Brief 6.1 S1 layer 2
 * and 7b.2A.
 *
 * One `THREE.Points`, 12,000 instances, one draw call, all motion in the vertex
 * shader. Normal blending with per point alpha over the light canvas, soft circular
 * falloff, no halo and no postprocessing pass. See ADR 0017, ADR 0019, ADR 0020.
 *
 * It no longer owns a canvas. Brief 7b.4 allows one `<Canvas>` per page and the
 * Thread needs the same one, so `SiteScene` owns it and this is a scene inside it.
 * The field places itself in document space, which is what keeps it scrolling with
 * the hero and stopping at the hero's edges. See ADR 0020.
 */
export function HeroField({ onCount }: { onCount?: (value: number) => void }) {
  const [count, setCount] = useState(COUNT)
  const onResolved = useCallback((value: number) => onCount?.(value), [onCount])

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

  return <Field count={count} onResolved={onResolved} />
}
