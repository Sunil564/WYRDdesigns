'use client'

import type { gsap as GsapType } from 'gsap'

type Loaded = {
  gsap: typeof GsapType
  ScrollTrigger: typeof import('gsap/ScrollTrigger').ScrollTrigger
  SplitText: typeof import('gsap/SplitText').SplitText
}

let pending: Promise<Loaded> | null = null

/**
 * The one place GSAP is loaded and configured.
 *
 * Dynamically imported so none of it is in the first paint path, and memoised so
 * the hero, the Thread, and the process strip share a single instance rather than
 * each registering plugins again.
 *
 * The eases are registered here as CustomEase curves built from the exact
 * `--ease-out` and `--ease-in-out` values in globals.css. GSAP's built in eases are
 * close to those curves but not equal to them, and a CSS transition sitting next to
 * a GSAP tween on a different curve is visible.
 *
 * GSAP 3.15 ships every plugin under the standard no charge licence, so
 * ScrollTrigger, SplitText, and CustomEase need no membership. Recorded in ADR 0008.
 */
export async function loadGsap(): Promise<Loaded> {
  if (pending) return pending

  pending = (async () => {
    const [{ gsap }, { ScrollTrigger }, { SplitText }, { CustomEase }] = await Promise.all([
      import('gsap'),
      import('gsap/ScrollTrigger'),
      import('gsap/SplitText'),
      import('gsap/CustomEase'),
    ])

    gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase)

    // cubic-bezier(0.16, 1, 0.3, 1) and cubic-bezier(0.65, 0, 0.35, 1).
    CustomEase.create('wyrdOut', 'M0,0 C0.16,1 0.3,1 1,1')
    CustomEase.create('wyrdInOut', 'M0,0 C0.65,0 0.35,1 1,1')

    return { gsap, ScrollTrigger, SplitText }
  })()

  return pending
}

/** Names of the registered eases, so no caller retypes a bezier. */
export const EASE = {
  out: 'wyrdOut',
  inOut: 'wyrdInOut',
} as const

/** Durations, in seconds, mirroring the CSS tokens. */
export const DUR = {
  fast: 0.2,
  base: 0.5,
  slow: 0.9,
} as const

/** Stagger constants, in seconds. Brief section 5.2. */
export const STAGGER = {
  sibling: 0.06,
  char: 0.018,
} as const
