import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type GridProps = {
  children: ReactNode
  className?: string
}

/**
 * The 12 column grid from brief section 4.3. Four columns below 768px, twelve at
 * and above, so a child can span 4 on mobile and 7 on desktop without a second
 * layout system.
 *
 * Gap matches the gutter, which is how a column edge lines up with the container
 * edge at every width.
 */
export function Grid({ children, className }: GridProps) {
  return (
    <div className={cn('grid grid-cols-4 gap-[var(--gutter)] md:grid-cols-12', className)}>
      {children}
    </div>
  )
}
