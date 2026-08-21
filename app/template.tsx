'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { motion } from 'motion/react'

/**
 * Page transitions. Brief 7b.2C, Phase 6.
 *
 * `template.tsx` rather than a wrapper in `layout.tsx`, because the App Router remounts a
 * template on every navigation and reuses a layout. Remounting is the whole mechanism: the
 * incoming page's tree is new, so an enter animation runs without any state to reset.
 *
 * **Opacity only. No transform, and that is not a shortcut.**
 *
 * A transform on this element would make it the containing block for every `position: fixed`
 * descendant, and `{children}` contains one that matters: `SiteScene` renders the shared WebGL
 * canvas as `fixed inset-0` from inside `app/page.tsx`. A transform here would re-anchor that
 * canvas to this wrapper for the length of the transition, so the hero field and the Thread
 * would slide by the offset amount every time someone navigated to the homepage. Opacity below
 * 1 creates a stacking context but not a containing block, so fixed layers stay anchored to
 * the viewport.
 *
 * That costs the 24px Y offset section 7b.2C asks for on the Reduced tier. The alternative was
 * moving the canvas up to the layout so it sits outside this wrapper, which would mount it on
 * every route and ship Three.js to pages that have no scene. The offset is the cheaper thing
 * to give up. See ADR 0022.
 *
 * **Reduced motion is checked here, synchronously, and both halves of that took a measurement
 * to get right.**
 *
 * `MotionConfig reducedMotion="user"` in `SiteMotion` covers every other Motion animation on
 * the site, but by design it disables transform and layout animations only: Motion treats an
 * opacity fade as safe and lets it through. Measured with the preference set, the page still
 * faded at 0.67 mid navigation. This site's convention is stricter than Motion's default, in
 * `globals.css`, in ADR 0012, and in every harness criterion that asserts a route renders
 * composed with nothing moving, so it is checked explicitly.
 *
 * The check cannot come from `useReducedMotion`. That hook starts at `false` and resolves in an
 * effect, which is right for a component that mounts once and wrong here: a template remounts
 * on every navigation, so it would read "not reduced" on the first render of each one, start
 * the fade, and correct itself a frame later. Measured again after adding the hook, still 0.68.
 * The preference is read straight from `matchMedia` in the initialiser instead, which is
 * client only and therefore safe: this decision is only ever consulted on a navigation.
 */

/**
 * Whether the visitor has navigated yet, at module scope so it survives the remount.
 *
 * The first mount of a template is the initial page load, and fading the whole document in
 * there would collide with the `[data-reveal]` entrance system that already stages the first
 * screen, and would delay content behind an animation nobody asked for. So the first mount
 * renders at rest and only subsequent navigations transition.
 */
let hasNavigated = false

/** Mirrors `--dur-base` and `--ease-out`. Motion takes numbers where CSS has tokens. */
const DURATION = 0.5
const EASE = [0.16, 1, 0.3, 1] as const

export default function Template({ children }: { children: ReactNode }) {
  /*
    Both decisions taken once, on the first render of this mount, before anything paints. On the
    server `hasNavigated` is false, so this resolves to the no animation branch and the markup
    matches what the client renders on a first load.
  */
  const [state] = useState(() => {
    const isNavigation = hasNavigated
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    return { isNavigation, animate: isNavigation && !reduced }
  })

  useEffect(() => {
    hasNavigated = true
  }, [])

  return (
    <motion.div
      data-page-transition={
        state.animate ? 'animated' : state.isNavigation ? 'reduced' : 'first-load'
      }
      initial={state.animate ? { opacity: 0 } : false}
      animate={{ opacity: 1 }}
      transition={{ duration: DURATION, ease: EASE }}
    >
      {children}
    </motion.div>
  )
}
