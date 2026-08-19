'use client'

import { useEffect, useRef } from 'react'
import { DUR, EASE, STAGGER, loadGsap } from '@/components/motion/gsap'
import { useReducedMotion } from '@/components/motion/useReducedMotion'
import { cn } from '@/lib/utils'

type SplitHeadlineProps = {
  /** One entry per sentence. Each becomes its own block so line masks are clean. */
  lines: readonly string[]
  className?: string
  lineClassName?: string
  /** Delay before the first character moves, in seconds. */
  delay?: number
  /** Fired when the reveal finishes, so the lead and actions can follow it. */
  onComplete?: () => void
}

/**
 * The hero headline reveal. Brief 6.1 S1 layer 1.
 *
 * Characters rise out of a hard edge: GSAP SplitText splits to lines and
 * characters, each line gets `overflow: hidden`, and the characters animate from
 * `opacity: 0, y: 40%, rotateX: -35deg` with an 18ms stagger.
 *
 * Two things this deliberately does not do.
 *
 * 1. **It never hides the headline before it can animate it.** The server rendered
 *    markup is the final state, so the headline is the LCP element and it paints
 *    with the document. The reveal only runs if hydration happened inside
 *    ENTRANCE_WINDOW. Past that the visitor has already read the headline, and
 *    taking it away to animate it back in would be worse than no animation.
 * 2. **It waits for `document.fonts.ready` before splitting.** Splitting against
 *    fallback metrics and then having the real face load is how a split headline
 *    causes layout shift.
 *
 * Under reduced motion nothing is split and nothing moves.
 */
const ENTRANCE_WINDOW = 2000

export function SplitHeadline({
  lines,
  className,
  lineClassName,
  delay = 0,
  onComplete,
}: SplitHeadlineProps) {
  const hostRef = useRef<HTMLHeadingElement | null>(null)
  const reduced = useReducedMotion()
  // A ref, not state. Setting state here would re-run the effect, and the cleanup
  // would kill the timeline it had just started, which is how the lead and the
  // actions end up waiting forever for an onComplete that never fires.
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return

    const host = hostRef.current
    if (!host) return

    if (reduced) {
      ran.current = true
      onComplete?.()
      return
    }

    // Too late to be an entrance. Leave the headline exactly as it painted.
    if (performance.now() > ENTRANCE_WINDOW) {
      ran.current = true
      onComplete?.()
      return
    }

    let cancelled = false
    let cleanup: (() => void) | undefined

    const run = async () => {
      const { gsap, SplitText } = await loadGsap()
      if (cancelled) return

      await document.fonts.ready
      if (cancelled) return

      const split = new SplitText(host.querySelectorAll('[data-headline-line]'), {
        type: 'lines,chars',
        linesClass: 'headline-line',
        charsClass: 'headline-char',
      })

      const timeline = gsap.timeline({
        delay,
        onComplete: () => {
          onComplete?.()
          // Revert as soon as the reveal is done, so the DOM goes back to plain
          // text for selection, search, and screen readers.
          split.revert()
        },
      })

      timeline.from(split.chars, {
        opacity: 0,
        yPercent: 40,
        rotateX: -35,
        transformOrigin: '50% 100%',
        duration: DUR.slow,
        ease: EASE.out,
        stagger: STAGGER.char,
      })

      cleanup = () => {
        timeline.kill()
        split.revert()
      }
    }

    ran.current = true

    void run()

    return () => {
      cancelled = true
      cleanup?.()
    }
  }, [delay, onComplete, reduced])

  return (
    <h1 ref={hostRef} className={cn(className)}>
      {lines.map((line) => (
        <span key={line} data-headline-line className={cn('block', lineClassName)}>
          {line}
        </span>
      ))}
    </h1>
  )
}
