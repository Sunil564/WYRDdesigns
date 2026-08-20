'use client'

import { useEffect, useRef } from 'react'
import { clamp, lerp, seededRandom } from '@/lib/utils'

type ParticleField2DProps = {
  /** Seed for the layout, so the field is identical across reloads. */
  seed?: string
  className?: string
}

/** Hard ceiling from brief 6.1. Never exceeded, whatever the viewport. */
const MAX_PARTICLES = 400
const CURSOR_RADIUS = 180
/** 1.2s to settle back, expressed as a per frame ease at 60fps. */
const RETURN_EASE = 0.045
const DPR_CAP = 2

type Particle = {
  baseX: number
  baseY: number
  x: number
  y: number
  offsetX: number
  offsetY: number
  radius: number
  alpha: number
  colour: string
  phase: number
  speed: number
}

/**
 * The Reduced tier particle field. Brief 6.1 layer 2.
 *
 * Hand written 2D canvas, roughly 90 particles on desktop and 40 on tablet, no
 * library. Loading a particle library to draw 90 dots is exactly the failure the
 * tiering exists to prevent, and this is about a hundred lines. See ADR 0008.
 *
 * The loop stops when the field leaves the viewport and when the tab is hidden.
 * Cursor interaction is skipped on coarse pointers, which get ambient drift only.
 *
 * Colours are read from the live computed style, so the palette stays in
 * globals.css and this file hardcodes nothing.
 */
export function ParticleField2D({ seed = 'wyrd-hero', className }: ParticleField2DProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const context = canvas.getContext('2d')
    if (!context) return

    const styles = getComputedStyle(document.documentElement)
    const palette = {
      border: styles.getPropertyValue('--color-border').trim() || '#26262e',
      fgMuted: styles.getPropertyValue('--color-fg-muted').trim() || '#8b8b95',
      accent: styles.getPropertyValue('--color-accent').trim() || '#ff521f',
    }

    const fine = window.matchMedia('(pointer: fine)').matches

    let particles: Particle[] = []
    let width = 0
    let height = 0
    let dpr = 1
    let frame = 0
    let running = false
    let inView = false
    const cursor = { x: -9999, y: -9999, active: false }

    const countFor = (w: number) => {
      /*
        Phase 4b section 5 says halve the count and then tune up if it reads too
        sparse. Halving landed at 45 on desktop, which measured a third of the ink
        the shader field puts down and read as a handful of stray dots rather than a
        field. Tuned back up to 72, which matches the shader field's presence at the
        same viewport. Still well under the dark build's density per visible pixel,
        because that field scattered most of its points outside the frustum.
      */
      if (w >= 1024) return 72
      if (w >= 768) return 48
      return 30
    }

    const build = () => {
      const rect = canvas.getBoundingClientRect()
      width = Math.max(1, Math.round(rect.width))
      height = Math.max(1, Math.round(rect.height))
      dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP)
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      context.setTransform(dpr, 0, 0, dpr, 0, 0)

      const count = Math.min(countFor(width), MAX_PARTICLES)
      const next = seededRandom(`${seed}:${count}`)
      particles = Array.from({ length: count }, (_unused, index) => {
        const x = next() * width
        const y = next() * height
        // One in twelve carries the accent. Brief 6.1.
        const accent = index % 12 === 0
        return {
          baseX: x,
          baseY: y,
          x,
          y,
          offsetX: 0,
          offsetY: 0,
          // Points read smaller against light, so the radius is up by about a
          // third, matching the shader field.
          radius: 0.7 + next() * 1.3,
          alpha: accent ? 0.55 : 0.3 + next() * 0.3,
          colour: accent ? palette.accent : next() > 0.5 ? palette.fgMuted : palette.border,
          phase: next() * Math.PI * 2,
          speed: 0.15 + next() * 0.35,
        }
      })
    }

    const draw = (time: number) => {
      frame = 0
      context.clearRect(0, 0, width, height)

      const t = time * 0.00012

      for (const particle of particles) {
        // A low amplitude sum of sines, which reads as an organic drift and costs
        // two trig calls per particle. A real noise field is not worth 20kb here.
        const driftX = Math.sin(t * particle.speed + particle.phase) * 18
        const driftY = Math.cos(t * particle.speed * 0.8 + particle.phase * 1.3) * 14

        let targetX = particle.baseX + driftX
        let targetY = particle.baseY + driftY

        if (cursor.active) {
          const dx = targetX - cursor.x
          const dy = targetY - cursor.y
          const distance = Math.hypot(dx, dy)
          if (distance < CURSOR_RADIUS && distance > 0.001) {
            // Inverse square falloff, matching the Full tier shader's behaviour.
            const force = (1 - distance / CURSOR_RADIUS) ** 2 * CURSOR_RADIUS * 0.55
            targetX += (dx / distance) * force
            targetY += (dy / distance) * force
          }
        }

        particle.x = lerp(particle.x, targetX, RETURN_EASE)
        particle.y = lerp(particle.y, targetY, RETURN_EASE)

        context.globalAlpha = particle.alpha
        context.fillStyle = particle.colour
        context.beginPath()
        context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2)
        context.fill()
      }

      context.globalAlpha = 1
      if (running) frame = window.requestAnimationFrame(draw)
    }

    const start = () => {
      if (running) return
      running = true
      frame = window.requestAnimationFrame(draw)
    }

    const stop = () => {
      running = false
      if (frame) window.cancelAnimationFrame(frame)
      frame = 0
    }

    const sync = () => {
      if (inView && !document.hidden) start()
      else stop()
    }

    build()
    // One static frame immediately, so the field is present before the first
    // animation frame rather than appearing a beat late.
    draw(0)

    const observer = new IntersectionObserver(
      (entries) => {
        inView = entries[0]?.isIntersecting ?? false
        sync()
      },
      { threshold: 0 },
    )
    observer.observe(canvas)

    const onVisibility = () => sync()
    document.addEventListener('visibilitychange', onVisibility)

    const onPointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      cursor.x = event.clientX - rect.left
      cursor.y = event.clientY - rect.top
      cursor.active =
        cursor.x > -CURSOR_RADIUS &&
        cursor.y > -CURSOR_RADIUS &&
        cursor.x < rect.width + CURSOR_RADIUS &&
        cursor.y < rect.height + CURSOR_RADIUS
    }

    const onPointerLeave = () => {
      cursor.active = false
    }

    if (fine) {
      window.addEventListener('pointermove', onPointerMove, { passive: true })
      window.addEventListener('pointerleave', onPointerLeave)
    }

    let resizeFrame = 0
    const onResize = () => {
      if (resizeFrame) return
      resizeFrame = window.requestAnimationFrame(() => {
        resizeFrame = 0
        const rect = canvas.getBoundingClientRect()
        // Rebuild only on a real size change. iOS fires resize on scroll.
        if (Math.abs(rect.width - width) < 2 && Math.abs(rect.height - height) < 2) return
        build()
      })
    }
    window.addEventListener('resize', onResize)

    return () => {
      stop()
      observer.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('resize', onResize)
      if (resizeFrame) window.cancelAnimationFrame(resizeFrame)
      if (fine) {
        window.removeEventListener('pointermove', onPointerMove)
        window.removeEventListener('pointerleave', onPointerLeave)
      }
      particles = []
      context.clearRect(0, 0, clamp(width, 0, 10000), clamp(height, 0, 10000))
    }
  }, [seed])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      data-field="2d"
      className={className}
      style={{ pointerEvents: 'none', width: '100%', height: '100%', display: 'block' }}
    />
  )
}
