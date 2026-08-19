'use client'

import type { ReactNode } from 'react'
import { MotionConfig } from 'motion/react'
import { useLenis } from '@/components/motion/useLenis'

/**
 * Two jobs, one client boundary at the root.
 *
 * 1. Starts Lenis and wires it to GSAP ScrollTrigger, or does not, under reduced
 *    motion.
 * 2. Sets `reducedMotion="user"` for Motion. The CSS freeze in globals.css does
 *    not reach Motion, because Motion animates through WAAPI rather than CSS
 *    transitions, so Motion needs telling separately.
 *
 * `children` arrives already rendered by the server components above it, so this
 * boundary does not pull the page into the client bundle.
 */
export function SiteMotion({ children }: { children: ReactNode }) {
  useLenis()

  return <MotionConfig reducedMotion="user">{children}</MotionConfig>
}
