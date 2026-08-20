'use client'

import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import { cn } from '@/lib/utils'

type ChipProps = {
  children: ReactNode
  /** Pressed state. Drives `aria-pressed`, so a screen reader hears the filter state. */
  selected?: boolean
  className?: string
} & Omit<ComponentPropsWithoutRef<'button'>, 'className' | 'children' | 'aria-pressed'>

/**
 * Pill toggle. Used by the `/work` cluster filter and by the multi select on the
 * contact form. It is a real button with `aria-pressed`, not a styled div, so
 * keyboard and screen reader behaviour comes for free.
 */
export function Chip({ children, selected = false, className, ...rest }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        'label rounded-pill inline-flex min-h-11 items-center border px-4 py-2',
        'transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)]',
        selected
          ? 'accent-fill border-accent-strong'
          : 'border-border text-fg-muted hover:border-fg hover:text-fg',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
}
