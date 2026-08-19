'use client'

import { useEffect, useRef } from 'react'
import type Lenis from 'lenis'
import { loadGsap } from '@/components/motion/gsap'
import { useReducedMotion } from '@/components/motion/useReducedMotion'

/**
 * The single scroll authority.
 *
 * Lenis owns the scroll, GSAP ScrollTrigger updates from Lenis's scroll event, and
 * Lenis's own RAF is driven off the GSAP ticker. That gives the page exactly one
 * RAF loop for scroll rather than two competing ones.
 *
 * Everything is dynamically imported, so Lenis, GSAP, and ScrollTrigger stay out
 * of the first paint path. Under reduced motion none of the three is imported at
 * all and native scroll handles everything, per ADR 0012.
 *
 * The instance is published on `window.__lenis` so anything that needs to scroll
 * to a target, an anchor link or the mobile menu, can reach it without a context
 * provider wrapping the whole tree in a client boundary.
 */
export function useLenis(): void {
  const reduced = useReducedMotion()
  const instance = useRef<Lenis | null>(null)

  useEffect(() => {
    if (reduced) return

    let cancelled = false
    let cleanupTicker: (() => void) | undefined

    const start = async () => {
      const [{ default: LenisCtor }, { gsap, ScrollTrigger }] = await Promise.all([
        import('lenis'),
        loadGsap(),
      ])
      if (cancelled) return

      const lenis = new LenisCtor({
        duration: 1.05,
        // Matches --ease-out closely enough that a scrubbed animation and the
        // scroll itself do not read as two different eases.
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        // Touch scroll stays native. Smoothing a finger drag always feels wrong.
        syncTouch: false,
        autoRaf: false,
      })

      instance.current = lenis
      window.__lenis = lenis
      document.documentElement.classList.add('lenis')

      const onScroll = () => ScrollTrigger.update()
      lenis.on('scroll', onScroll)

      const raf = (time: number) => lenis.raf(time * 1000)
      gsap.ticker.add(raf)
      gsap.ticker.lagSmoothing(0)

      cleanupTicker = () => {
        lenis.off('scroll', onScroll)
        gsap.ticker.remove(raf)
        gsap.ticker.lagSmoothing(500, 33)
      }
    }

    void start()

    return () => {
      cancelled = true
      cleanupTicker?.()
      instance.current?.destroy()
      instance.current = null
      delete window.__lenis
      document.documentElement.classList.remove('lenis')
    }
  }, [reduced])
}

/**
 * Scroll to a target, through Lenis when it is running and natively when it is
 * not. Used by in page anchors and by the hero's second action.
 */
export function scrollToTarget(target: string | HTMLElement, offset = 0): void {
  const lenis = typeof window === 'undefined' ? undefined : window.__lenis
  if (lenis) {
    lenis.scrollTo(target, { offset })
    return
  }

  const element = typeof target === 'string' ? document.querySelector<HTMLElement>(target) : target
  element?.scrollIntoView({ behavior: 'auto', block: 'start' })
}
