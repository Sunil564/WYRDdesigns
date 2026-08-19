'use client'

import { useEffect, useRef, useState } from 'react'

export type UseInViewOptions = {
  /** Visibility fraction that counts as in view. Brief section 5.2 fixes it at 0.2. */
  threshold?: number
  /** Fire once and stop observing. Entrances never re-fire on scroll up. */
  once?: boolean
  /** Margin around the root, same syntax as IntersectionObserver. */
  rootMargin?: string
}

/**
 * One IntersectionObserver per element, disconnected as soon as it has done its
 * job. Used both for entrances and for pausing RAF loops and WebGL scenes on
 * viewport exit, which is why `once` is a parameter rather than a hardcoded true.
 */
export function useInView<T extends Element = HTMLDivElement>(options: UseInViewOptions = {}) {
  const { threshold = 0.2, once = true, rootMargin = '0px' } = options
  const ref = useRef<T | null>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    // No observer support means show everything rather than hide everything.
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (!entry) return

        if (entry.isIntersecting) {
          setInView(true)
          if (once) observer.disconnect()
        } else if (!once) {
          setInView(false)
        }
      },
      { threshold, rootMargin },
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [threshold, once, rootMargin])

  return { ref, inView }
}
