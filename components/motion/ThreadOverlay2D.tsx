'use client'

import { useEffect, useRef, useState } from 'react'
import {
  DISPERSE_OUTWARD,
  HEAD_ALPHA_BASE,
  HEAD_ALPHA_RANGE,
  HEAD_DISPERSE_DAMP,
  HEAD_SIZE_GAIN,
  REST_ALPHA_BASE,
  REST_ALPHA_RANGE,
  REVEAL_OFFSET,
  SPIRAL_DEPTH,
  SPIRAL_HEAD_DAMP,
  SPIRAL_IN_CLOUD,
  SPIRAL_RADIUS,
  SPIRAL_RADIUS_CURVE,
  SPIRAL_RADIUS_FLOOR,
  SPIRAL_SPIN,
  SPIRAL_WAVELENGTH,
  TEXT_DIM,
  TEXT_DIM_HEAD_KEEP,
  TEXT_PAD,
  THREAD_BASE_SIZE,
} from '@/components/motion/threadConstants'
import { HEAD_LENGTH } from '@/components/motion/threadGeometry'
import { subscribeThread, threadState } from '@/components/motion/threadStore'
import type { ThreadStreamData } from '@/components/motion/threadStore'
import { currentScroll } from '@/components/motion/useLenis'

/** Never render above 2x. The cost is quadratic and the gain is invisible. Brief 7b.4. */
const DPR_CAP = 2

/**
 * How far outside the viewport a particle is still drawn, in document pixels.
 *
 * This is the whole performance argument. The Full tier hands every point to the GPU and lets
 * it discard the off screen ones for free. Canvas 2D has no such thing, so an overlay that
 * drew the whole route would pay for a 7,800px document to render an 823px window. Culling to
 * the viewport turns 1,200 sampled points into roughly 200 to 400 drawn ones.
 *
 * The margin covers the spiral's own excursion plus the dispersion bloom, so nothing pops in
 * at the edge of the screen.
 */
const CULL_MARGIN = 160

/**
 * The Thread on the Reduced tier: the same route, the same rules, drawn with Canvas 2D.
 *
 * Zero Three.js by construction, since nothing here imports it. That is the point: this tier
 * exists because the device is touch driven or low powered, and the whole tiering argument
 * collapses if the fallback ships the thing it is a fallback for.
 *
 * **Every constant is imported from `threadConstants`, shared with the shader.** Retyping them
 * here is the exact fault this build has paid for repeatedly: a second copy of a number that
 * goes stale silently. Where the behaviour cannot be shared, because one is GLSL and one is
 * JavaScript, the numbers still are.
 *
 * **There is no reduced motion branch here, and that is deliberate.** `useRenderTier` tests
 * `prefers-reduced-motion` first and returns `static` before it ever reaches the coarse
 * pointer test, so a visitor with reduced motion on never mounts this component at all. They
 * get the SVG stroke, complete and still. A branch here would be unreachable code that reads
 * like a guarantee, which is how this build acquired its last dead subsystem.
 *
 * `arc()` per particle, not batched and not blitted. Measured under CPU throttling: batching
 * into one path per alpha bucket is about 1.5 times slower, because building the buckets each
 * frame costs more than the fills it saves, and a pre-rendered sprite blitted with `drawImage`
 * is about eight times slower. Chromium's small circle fill is very well optimised and the
 * naive loop wins.
 */
export function ThreadOverlay2D() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [data, setData] = useState<ThreadStreamData | null>(() => threadState().data)

  useEffect(() => {
    const sync = () => setData(threadState().data)
    sync()
    return subscribeThread(sync)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !data) return
    const context = canvas.getContext('2d')
    if (!context) return

    const { samples, bandTops, bandBottoms, bandCount, disperse, text } = data
    const { positions, distance, normals, random, count } = samples

    /*
      Colours are read once, from the tokens, rather than written here. The same four values the
      shader picks up, so the two renderers cannot disagree about what the Thread looks like.
    */
    const styles = getComputedStyle(document.documentElement)
    const token = (name: string, fallback: string) =>
      styles.getPropertyValue(name).trim() || fallback
    const restColour = token('--color-fg-muted', '#5e5e66')
    const restInverse = token('--color-fg-inverse-muted', '#9a9aa2')
    const headColour = token('--color-accent', '#ff521f')
    const headInverse = token('--color-accent-on-inverse', '#ff521f')

    /** Matches the shader's `fract(sin(x) * k)` so both renderers scatter identically. */
    const hash = (value: number, a: number, b: number, k: number) => {
      const x = Math.sin(value * a + b) * k
      return x - Math.floor(x)
    }

    let width = 0
    let height = 0
    let dpr = 1
    let frame = 0
    let running = false
    let start = performance.now()

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      width = Math.max(1, Math.round(rect.width))
      height = Math.max(1, Math.round(rect.height))
      dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP)
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      context.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    /*
      One line or two columns.

      Below 1024 the route is a single straight line, so the clients dispersion has no strand
      columns to lean between and the two column version has nothing to bias toward. The single
      line blooms symmetrically instead: outward on both sides through the logo band, back
      together below it. Same Y ramp, one line, no inward bias.
    */
    const singleLine = samples.groupCount === 1

    const draw = () => {
      const now = performance.now()
      const time = (now - start) / 1000
      const scroll = currentScroll()
      const revealLine = scroll + height * REVEAL_OFFSET
      const top = scroll - CULL_MARGIN
      const bottom = scroll + height + CULL_MARGIN

      context.clearRect(0, 0, width, height)

      for (let i = 0; i < count; i += 1) {
        const y = positions[i * 3 + 1]!

        /*
          Reveal and cull, both on the undisplaced Y and both before any work is done. The
          reveal is the shader's rule exactly: visible at or above the line. The cull is this
          renderer's own, and it is what makes the frame affordable.
        */
        if (y > revealLine) continue
        if (y < top || y > bottom) continue

        const x = positions[i * 3]!
        const rand = random[i]!

        /* Head band: the 240px of document Y immediately above the line, squared toward it. */
        let head = 1 - (revealLine - y) / HEAD_LENGTH
        head = head > 0 ? (head < 1 ? head * head : 1) : 0

        /* Dispersion ramp, a smoothstepped triangle across the band. */
        let ramp = 0
        if (disperse) {
          const span = Math.max(disperse.bottom - disperse.top, 1)
          const t = (y - disperse.top) / span
          if (t > 0 && t < 1) {
            const triangle = 1 - Math.abs(t * 2 - 1)
            ramp = triangle * triangle * (3 - 2 * triangle)
          }
        }

        /* The head keeps only a fraction of the dispersion, so it stays a head. */
        if (ramp > 0) ramp *= 1 + (HEAD_DISPERSE_DAMP - 1) * head

        let offsetX = 0
        let offsetY = 0
        if (ramp > 0 && disperse) {
          const angle = hash(rand, 127.1, 3.7, 43758.5453) * Math.PI * 2
          const swingX = Math.cos(angle)
          if (singleLine) {
            /* Symmetric. Nothing to bias toward, so both sides get the same reach. */
            offsetX = swingX * disperse.spreadX * ramp
          } else {
            const inward = x < disperse.centreX ? 1 : -1
            const lean = swingX * inward > 0 ? 1 : DISPERSE_OUTWARD
            offsetX = swingX * lean * disperse.spreadX * ramp
          }
          offsetY = Math.sin(angle) * disperse.spreadY * ramp
        }

        /*
          Spiral. Position on cosine along the path normal, size and alpha on sine, ninety
          degrees apart, which is what makes a flat oscillation read as rotation.
        */
        const phaseHash = hash(rand, 78.233, 1.3, 43758.5453)
        const phase =
          (distance[i]! / SPIRAL_WAVELENGTH) * Math.PI * 2 +
          phaseHash * Math.PI * 2 +
          time * SPIRAL_SPIN
        const radiusHash = hash(rand, 45.164, 9.7, 24634.6345)
        let radius =
          SPIRAL_RADIUS *
          (SPIRAL_RADIUS_FLOOR + (1 - SPIRAL_RADIUS_FLOOR) * radiusHash ** SPIRAL_RADIUS_CURVE)
        radius *= 1 + (SPIRAL_IN_CLOUD - 1) * ramp
        radius *= 1 + (SPIRAL_HEAD_DAMP - 1) * head

        const swing = Math.cos(phase)
        const depth = Math.sin(phase)
        const drawX = x + offsetX + normals[i * 2]! * swing * radius
        const drawY = y + offsetY + normals[i * 2 + 1]! * swing * radius

        /* Which ground this particle is on, from its undisplaced Y, as the shader does. */
        let inverse = false
        for (let band = 0; band < bandCount; band += 1) {
          if (y >= bandTops[band]! && y <= bandBottoms[band]!) {
            inverse = true
            break
          }
        }

        /*
          Text dimming, from the drawn position rather than the path position, because the
          question is where the particle ended up relative to the words. Ramped over the pad
          rather than stepped, so it does not read as a rectangle cut out of the trail.
        */
        let dim = 0
        for (let r = 0; r < text.count; r += 1) {
          const left = text.rects[r * 4]!
          const boxTop = text.rects[r * 4 + 1]!
          const right = text.rects[r * 4 + 2]!
          const boxBottom = text.rects[r * 4 + 3]!
          const dx = Math.max(left - drawX, drawX - right)
          const dy = Math.max(boxTop - drawY, drawY - boxBottom)
          const outside = Math.max(dx, dy)
          if (outside >= TEXT_PAD) continue
          const near =
            outside <= -TEXT_PAD ? 1 : 1 - (outside + TEXT_PAD) / (TEXT_PAD * 2)
          if (near > dim) dim = near
          if (dim >= 1) break
        }
        const textDim = 1 + (TEXT_DIM - 1) * dim * (1 + (TEXT_DIM_HEAD_KEEP - 1) * head)

        const restAlpha = REST_ALPHA_BASE + rand * REST_ALPHA_RANGE
        const headAlpha = HEAD_ALPHA_BASE + rand * HEAD_ALPHA_RANGE
        let alpha = (restAlpha + (headAlpha - restAlpha) * head) * (1 + SPIRAL_DEPTH * depth) * textDim
        if (alpha < 0.01) continue
        if (alpha > 1) alpha = 1

        const size =
          THREAD_BASE_SIZE *
          (0.72 + rand * 0.56) *
          (1 + SPIRAL_DEPTH * depth) *
          (1 + (HEAD_SIZE_GAIN - 1) * head)
        if (size <= 0) continue

        context.globalAlpha = alpha
        context.fillStyle = inverse
          ? head > 0.5
            ? headInverse
            : restInverse
          : head > 0.5
            ? headColour
            : restColour
        context.beginPath()
        context.arc(drawX, drawY - scroll, size / 2, 0, Math.PI * 2)
        context.fill()
      }

      context.globalAlpha = 1
      if (running) frame = window.requestAnimationFrame(draw)
    }

    const startLoop = () => {
      if (running) return
      running = true
      start = performance.now() - start
      frame = window.requestAnimationFrame(draw)
    }
    const stopLoop = () => {
      running = false
      if (frame) window.cancelAnimationFrame(frame)
      frame = 0
    }

    resize()
    startLoop()

    const onVisibility = () => (document.hidden ? stopLoop() : startLoop())
    document.addEventListener('visibilitychange', onVisibility)

    let resizeFrame = 0
    const onResize = () => {
      if (resizeFrame) window.cancelAnimationFrame(resizeFrame)
      resizeFrame = window.requestAnimationFrame(resize)
    }
    window.addEventListener('resize', onResize)

    return () => {
      stopLoop()
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('resize', onResize)
      if (resizeFrame) window.cancelAnimationFrame(resizeFrame)
    }
  }, [data])

  if (!data) return null

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      data-thread-overlay={data.samples.count}
      className="pointer-events-none fixed inset-0 z-[2] h-full w-full"
    />
  )
}
