'use client'

import { useEffect, useRef } from 'react'
import { Section } from '@/components/layout/Section'
import { DUR, EASE, loadGsap } from '@/components/motion/gsap'
import { useReducedMotion } from '@/components/motion/useReducedMotion'
import { positioning } from '@/content/home'

/**
 * S2. Single centred block, generous space, no imagery. Brief 6.1 S2.
 *
 * Line by line mask reveal with a 120ms stagger. The italic phrase arrives last,
 * 400ms after the rest, and until it does the surrounding text sits at 70 percent
 * opacity. That ordering is the section: the emphasis lands after the setup, not
 * with it.
 *
 * GSAP owns this rather than `Reveal`, because the three parts share one timeline
 * on one scroll trigger. It also means the hidden state is set by JavaScript after
 * mount rather than in CSS, so the text is visible if JavaScript never arrives, and
 * the section is below the fold when the state is set, so nothing flashes.
 */
export function Positioning() {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    const host = hostRef.current
    if (!host || reduced) return

    let cancelled = false
    let cleanup: (() => void) | undefined

    const run = async () => {
      const { gsap, ScrollTrigger, SplitText } = await loadGsap()
      if (cancelled || !hostRef.current) return

      await document.fonts.ready
      if (cancelled || !hostRef.current) return

      const body = Array.from(host.querySelectorAll<HTMLElement>('[data-positioning-line]'))
      const emphasisEl = host.querySelector<HTMLElement>('[data-positioning-emphasis]')

      // `mask: 'lines'` wraps every line in an overflow hidden box, which is what
      // makes this a mask reveal rather than a fade.
      const splits = [...body, ...(emphasisEl ? [emphasisEl] : [])].map(
        /*
          `aria: 'none'` because the default puts `aria-label` on the element it splits, and
          these are plain spans. ARIA prohibits `aria-label` on a generic role, and Lighthouse
          scored the homepage 96 on it. With the option off, GSAP adds no ARIA at all and the
          sentence stays in the DOM as ordinary text, which assistive technology reads without
          help. Nothing here needs a label: the text is the text.
        */
        (element) => new SplitText(element, { type: 'lines', mask: 'lines', aria: 'none' }),
      )

      const bodyLines = splits.slice(0, body.length).flatMap((split) => split.lines)
      const emphasisLines = emphasisEl ? (splits[splits.length - 1]?.lines ?? []) : []

      gsap.set([...bodyLines, ...emphasisLines], { yPercent: 110, opacity: 0 })

      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: host,
          start: 'top 78%',
          // Once, and never again on scroll up. Brief 5.2.
          toggleActions: 'play none none none',
        },
      })

      timeline.to(bodyLines, {
        yPercent: 0,
        opacity: 0.7,
        duration: DUR.slow,
        ease: EASE.out,
        stagger: 0.12,
      })

      if (emphasisLines.length > 0) {
        timeline.to(
          emphasisLines,
          { yPercent: 0, opacity: 1, duration: DUR.slow, ease: EASE.out },
          '+=0.4',
        )
        // The surrounding text only reaches full strength once the emphasis has.
        timeline.to(bodyLines, { opacity: 1, duration: DUR.base, ease: EASE.out }, '<0.15')
      }

      cleanup = () => {
        timeline.scrollTrigger?.kill()
        timeline.kill()
        splits.forEach((split) => split.revert())
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
    <Section id="positioning" label="What the work is" className="text-center">
      <div ref={hostRef}>
        {/*
          The measure cap lives on the paragraph, not on a wrapper. `ch` resolves
          against the font size of the element it is written on, so a 30ch cap on a
          body sized wrapper is 240px, not 1200px, and the block collapses to one
          word per line.
        */}
        <p className="text-display text-fg mx-auto max-w-[26ch] font-bold" data-thread-node>
          <span className="block" data-positioning-line>
            {positioning.before}
          </span>
          <span className="editorial text-fg mt-6 block" data-positioning-emphasis>
            {positioning.emphasis}
          </span>
          <span className="mt-6 block" data-positioning-line>
            {positioning.after}
          </span>
        </p>
      </div>
    </Section>
  )
}
