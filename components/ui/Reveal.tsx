'use client'

import type { ElementType, ReactNode } from 'react'
import { useInView } from '@/components/motion/useInView'
import { cn } from '@/lib/utils'

type RevealProps = {
  children: ReactNode
  /** Element to render. A reveal wrapper should not break document structure. */
  as?: ElementType
  /** Delay in ms. Siblings step by 60ms, per brief section 5.2. */
  delay?: number
  /** Travel distance in px. 32 is the section default. */
  y?: number
  className?: string
}

/**
 * Entrance wrapper. Fires once, at 20 percent visibility, and never again.
 *
 * The animation is CSS. This component only flips `data-reveal` from `out` to
 * `in`, so there is no per frame JavaScript and reduced motion is handled by one
 * CSS rule in globals.css rather than by a second code path here.
 *
 * The final layout box is reserved before the animation runs, because only
 * opacity and transform change. Nothing here can cause layout shift.
 */
export function Reveal({ children, as, delay = 0, y = 32, className }: RevealProps) {
  const Tag = (as ?? 'div') as ElementType
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.2, once: true })

  return (
    <Tag
      ref={ref}
      data-reveal={inView ? 'in' : 'out'}
      style={
        {
          '--reveal-delay': `${delay}ms`,
          '--reveal-y': `${y}px`,
        } as React.CSSProperties
      }
      className={cn(className)}
    >
      {children}
    </Tag>
  )
}
