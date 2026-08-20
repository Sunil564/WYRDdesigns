import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type EyebrowProps = {
  children: ReactNode
  /** An accent coloured tick before the label. Used once per section, not per block. */
  marker?: boolean
  className?: string
}

/**
 * Section eyebrow. Uppercase, tracked, muted. The `label` utility carries the
 * type treatment so an eyebrow can never drift from a meta line.
 */
export function Eyebrow({ children, marker = false, className }: EyebrowProps) {
  return (
    <p className={cn('label text-fg-muted flex items-center gap-3', className)}>
      {marker && (
        <span aria-hidden="true" className="bg-accent inline-block h-px w-8 align-middle" />
      )}
      {children}
    </p>
  )
}
