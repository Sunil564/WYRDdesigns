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
  /**
   * Fired part way through the character run, so the lead and actions overlap the
   * end of it rather than queueing behind it. See REVEAL_AT.
   */
  onReveal?: () => void
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

/**
 * Where in the character run the lead and the actions are released, as a fraction of the
 * timeline.
 *
 * **This used to be the timeline's `onComplete`, and that read as the page hanging.** A
 * staggered `from` finishes when the *last* character finishes its own full duration, which
 * with 53 characters at an 18ms stagger and a 0.9s ease is 900ms after that character starts
 * moving. The eye reads the line as complete long before then. Measured over five loads at
 * 1x: mean character opacity crossed 95 percent at 1.68s, and the lead did not begin until
 * 2.49s, an empty beat of 806 to 830ms with a spread of only 25ms across loads.
 *
 * At 0.65 the lead begins at 1.19s into a 1.84s timeline, while the last character started
 * at 0.94s and is still landing. Arriving into the end of the reveal rather than after it.
 */
const REVEAL_AT = 0.65

export function SplitHeadline({
  lines,
  className,
  lineClassName,
  delay = 0,
  onReveal,
}: SplitHeadlineProps) {
  const hostRef = useRef<HTMLHeadingElement | null>(null)
  const reduced = useReducedMotion()
  // A ref, not state. Setting state here would re-run the effect, and the cleanup
  // would kill the timeline it had just started, which is how the lead and the
  // actions end up waiting forever for an onReveal that never fires.
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return

    const host = hostRef.current
    if (!host) return

    if (reduced) {
      ran.current = true
      onReveal?.()
      return
    }

    // Too late to be an entrance. Leave the headline exactly as it painted.
    if (performance.now() > ENTRANCE_WINDOW) {
      ran.current = true
      onReveal?.()
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

      /*
        Inserted after the tween so `duration()` is the real one rather than a number
        retyped from the stagger and the character count, which would go stale the first
        time the headline copy changed. The position is inside the timeline, so this does
        not extend it, and it is added synchronously within the `delay` before playback
        reaches it.
      */
      timeline.call(() => onReveal?.(), undefined, timeline.duration() * REVEAL_AT)

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
  }, [delay, onReveal, reduced])

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
