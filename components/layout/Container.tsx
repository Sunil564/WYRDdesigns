import type { ReactNode } from 'react'
import { htmlTag, type HtmlTag } from '@/lib/polymorphic'
import { cn } from '@/lib/utils'

type ContainerProps = {
  children: ReactNode
  as?: HtmlTag
  /** Full bleed content still needs the gutter, so it opts out of the max width only. */
  bleed?: boolean
  className?: string
}

/**
 * Horizontal frame. 1440px ceiling, gutter from `--gutter`, which switches from
 * 24px to 48px at 1024px in one place in globals.css. No responsive padding
 * classes anywhere else in the build.
 */
export function Container({ children, as, bleed = false, className }: ContainerProps) {
  const Tag = htmlTag(as, 'div')
  return (
    <Tag className={cn('w-full px-[var(--gutter)]', !bleed && 'max-w-content mx-auto', className)}>
      {children}
    </Tag>
  )
}
