'use client'

import { useEffect, useRef } from 'react'
import { Section } from '@/components/layout/Section'
import { CloudsLayer } from '@/components/motion/CloudsLayer'
import { DUR, EASE, loadGsap } from '@/components/motion/gsap'
import { useReducedMotion } from '@/components/motion/useReducedMotion'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { processSteps } from '@/content/process'

/**
 * S6. Four steps, horizontal on desktop, connected by the Thread. Brief 6.1 S6.
 *
 * Since ADR 0031 the section also carries a cloud field behind it, on the Full tier
 * only. It is handed to `Section` as a background rather than mounted in here, so it
 * paints below the Thread rather than over it.
 *
 * **It is an inverse band because of that field, and the reason is arithmetic.**
 * ADR 0033 has the working: no cloud field bright enough to sit under this section's
 * light ink is still visible as clouds, and the same field under inverse ink has a
 * whole usable range. So the section flipped, and every piece of ink in it went to
 * full `--color-fg-inverse`. Not muted, not accent: both fail against a moving
 * ground, and the codebase already does this on the blue cluster card for the same
 * reason. The one accent left is the scrubbed line, which is not text.
 *
 * On desktop the connecting line draws left to right, scrubbed to scroll progress,
 * and each step's text reveals as the head reaches its node. The user controls the
 * pace, which is the point: it is the one place on the page where the Thread is
 * horizontal and the reading order follows it.
 *
 * Below 1024px the steps stack and reveal on entrance instead of scrub, per the
 * brief. A scrubbed horizontal line has nowhere to go in a single column.
 */
export function Process() {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    const host = hostRef.current
    if (!host || reduced) return

    let cancelled = false
    let cleanup: (() => void) | undefined

    const run = async () => {
      const { gsap, ScrollTrigger } = await loadGsap()
      if (cancelled || !hostRef.current) return

      const context = gsap.context(() => {
        const steps = gsap.utils.toArray<HTMLElement>('[data-process-step]')
        const line = host.querySelector<HTMLElement>('[data-process-line]')
        const desktop = window.matchMedia('(width >= 64rem)')

        if (desktop.matches) {
          gsap.set(steps, { opacity: 0, y: 24 })
          if (line) gsap.set(line, { scaleX: 0, transformOrigin: 'left center' })

          const timeline = gsap.timeline({
            scrollTrigger: {
              trigger: host,
              start: 'top 70%',
              end: 'bottom 65%',
              // The user drives it. scrub 1 gives the line a little inertia.
              scrub: 1,
            },
          })

          if (line) timeline.to(line, { scaleX: 1, ease: 'none', duration: steps.length })

          // Each step lands as the head passes its node, so the reveals are
          // positioned along the same timeline rather than staggered by time.
          steps.forEach((step, index) => {
            timeline.to(
              step,
              { opacity: 1, y: 0, duration: 0.6, ease: EASE.out },
              index * 0.95 + 0.15,
            )
          })
        } else {
          // Stacked: entrance, not scrub.
          gsap.set(steps, { opacity: 0, y: 24 })
          gsap.to(steps, {
            opacity: 1,
            y: 0,
            duration: DUR.base,
            ease: EASE.out,
            stagger: 0.06,
            scrollTrigger: {
              trigger: host,
              start: 'top 80%',
              toggleActions: 'play none none none',
            },
          })
        }
      }, host)

      cleanup = () => {
        context.revert()
        ScrollTrigger.refresh()
      }
    }

    void run()

    return () => {
      cancelled = true
      cleanup?.()
    }
  }, [reduced])

  return (
    <Section
      id="process"
      label="How we work"
      variant="inverse"
      background={<CloudsLayer />}
    >
      <Eyebrow variant="inverse">How we work</Eyebrow>

      <div ref={hostRef} className="relative mt-16" data-thread-node>
        {/* The horizontal thread through the nodes. Desktop only. */}
        <div className="absolute inset-x-0 top-3 hidden lg:block">
          <span aria-hidden="true" className="bg-border-inverse block h-px w-full" />
          <span
            aria-hidden="true"
            data-process-line
            className="bg-accent-on-inverse absolute inset-x-0 top-0 block h-px w-full"
          />
        </div>

        <ol className="relative grid gap-16 lg:grid-cols-4 lg:gap-[var(--gutter)]">
          {processSteps.map((step) => (
            <li key={step.index} data-process-step data-process-node className="relative">
              <span
                aria-hidden="true"
                className="rounded-pill bg-fg-inverse mb-8 hidden size-1.5 lg:block"
                style={{ marginTop: '0.4rem' }}
              />
              <p className="label text-fg-inverse">{step.index}</p>
              <h3 className="text-title text-fg-inverse mt-4 font-bold">{step.name}</h3>
              <p className="measure text-body text-fg-inverse mt-3">{step.line}</p>
            </li>
          ))}
        </ol>
      </div>
    </Section>
  )
}
