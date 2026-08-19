'use client'

import { useCallback, useEffect, useState } from 'react'
import { SplitHeadline } from '@/components/motion/SplitHeadline'
import { scrollToTarget } from '@/components/motion/useLenis'
import { Button } from '@/components/ui/Button'
import { Eyebrow } from '@/components/ui/Eyebrow'

type HeroIntroProps = {
  eyebrow: string
  lines: readonly string[]
  lead: string
  primary: { label: string; href: string }
  secondary: { label: string; target: string }
}

/**
 * The hero's text layer and its entrance ordering. Brief 6.1 S1 layer 1.
 *
 * The eyebrow fades in first. The headline reveal starts 200ms later. The lead and
 * the actions follow the headline's real completion rather than a guessed duration,
 * which is what `onComplete` is for.
 *
 * Entrance state is one attribute per element and the transitions live in
 * globals.css, so reduced motion, and JavaScript being absent, are each handled by
 * a single rule rather than by a second code path here.
 */
export function HeroIntro({ eyebrow, lines, lead, primary, secondary }: HeroIntroProps) {
  const [mounted, setMounted] = useState(false)
  const [headlineDone, setHeadlineDone] = useState(false)
  const onComplete = useCallback(() => setHeadlineDone(true), [])

  useEffect(() => {
    // One frame after hydration, so the transition has a state to move from.
    const frame = window.requestAnimationFrame(() => setMounted(true))
    return () => window.cancelAnimationFrame(frame)
  }, [])

  return (
    <div>
      <div className="hero-enter" data-enter={mounted ? 'in' : 'out'}>
        <Eyebrow marker>{eyebrow}</Eyebrow>
      </div>

      <SplitHeadline
        lines={lines}
        onComplete={onComplete}
        delay={0.2}
        className="text-mega text-paper mt-8 font-black"
        lineClassName="overflow-hidden pb-[0.08em]"
      />

      <p
        className="hero-enter text-lead text-muted mt-10 max-w-[60ch]"
        data-enter={headlineDone ? 'in' : 'out'}
      >
        {lead}
      </p>

      <div
        className="hero-enter hero-enter-late mt-12 flex flex-wrap items-center gap-8"
        data-enter={headlineDone ? 'in' : 'out'}
      >
        <Button href={primary.href}>{primary.label}</Button>
        <Button variant="link" onClick={() => scrollToTarget(secondary.target, -80)}>
          {secondary.label}
        </Button>
      </div>
    </div>
  )
}
