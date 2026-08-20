'use client'

import Link from 'next/link'
import { useRef } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react'
import { clamp } from '@/lib/utils'

type MagneticButtonProps = {
  href: string
  children: React.ReactNode
  /** Pull radius in px. Brief 6.1 S8 sets it at 90. */
  radius?: number
  /** Maximum travel toward the cursor in px. Brief 6.1 S8 sets it at 12. */
  distance?: number
}

/**
 * The contact call to action. Brief 6.1 S8.
 *
 * Translates up to 12px toward the cursor within a 90px radius and springs back on
 * leave. Disabled on touch and under reduced motion: Motion's `MotionConfig
 * reducedMotion="user"` in `SiteMotion` stops the spring, and the pointer type
 * check stops the listener from doing anything on a finger.
 *
 * It is a real link. The magnet is decoration on top of a normal navigation.
 */
export function MagneticButton({
  href,
  children,
  radius = 90,
  distance = 12,
}: MagneticButtonProps) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const springX = useSpring(x, { stiffness: 220, damping: 18, mass: 0.6 })
  const springY = useSpring(y, { stiffness: 220, damping: 18, mass: 0.6 })

  // The label counter shifts slightly less than the button, which reads as weight.
  const labelX = useTransform(springX, (value) => value * 0.4)
  const labelY = useTransform(springY, (value) => value * 0.4)

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse') return
    const host = hostRef.current
    if (!host) return

    const rect = host.getBoundingClientRect()
    const centreX = rect.left + rect.width / 2
    const centreY = rect.top + rect.height / 2
    const dx = event.clientX - centreX
    const dy = event.clientY - centreY
    const length = Math.hypot(dx, dy)

    if (length > radius) {
      x.set(0)
      y.set(0)
      return
    }

    const pull = clamp(1 - length / radius, 0, 1) * distance
    x.set((dx / (length || 1)) * pull)
    y.set((dy / (length || 1)) * pull)
  }

  const reset = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <div
      ref={hostRef}
      onPointerMove={onPointerMove}
      onPointerLeave={reset}
      // The catch area is larger than the button, which is what makes the pull
      // start before the cursor arrives.
      className="inline-flex p-8"
    >
      <motion.div style={{ x: springX, y: springY }}>
        <Link
          href={href}
          data-thread-converge
          className="label accent-fill-inverse rounded-pill inline-flex min-h-11 items-center px-8 py-4 font-bold"
        >
          <motion.span style={{ x: labelX, y: labelY }} className="inline-block">
            {children}
          </motion.span>
        </Link>
      </motion.div>
    </div>
  )
}
