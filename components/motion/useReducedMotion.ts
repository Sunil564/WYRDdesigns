'use client'

import { useEffect, useState } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

/**
 * Whether the visitor asked for reduced motion.
 *
 * Returns `false` during server render and the first client paint, then the real
 * value. That order matters: `false` renders the animated branch's markup, which
 * is identical to the still branch's markup, so there is no hydration mismatch.
 * The CSS in globals.css has already frozen every transition by then, so nothing
 * moves in the gap.
 *
 * Anything that mounts a canvas or starts a RAF loop must branch on this value
 * rather than relying on the CSS, because a frozen transition on a mounted
 * canvas is still a mounted canvas. See docs/decisions/0012.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const mql = window.matchMedia(QUERY)
    setReduced(mql.matches)

    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  return reduced
}
