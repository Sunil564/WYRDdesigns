import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type EyebrowProps = {
  children: ReactNode
  className?: string
}

/**
 * Section eyebrow. Uppercase, tracked, muted. The `label` utility carries the type
 * treatment so an eyebrow can never drift from a meta line.
 *
 * **No rule before the label, and nothing in its place.** Every eyebrow used to open with a
 * 32px accent hairline, which is a decoration that says nothing the type does not already
 * say: the label is uppercase at 0.12em tracking and reads as an eyebrow on that alone. A
 * dot, a square or a vertical tick would only be a different convention doing the same
 * unnecessary work.
 *
 * The removal is also an alignment fix. The rule sat in a flex row with a 12px gap, so the
 * label began 44px inside the container and every eyebrow on the site was off the grid its
 * own heading sat on. Without the row the text starts at the container edge, flush with the
 * h1 below it.
 */
export function Eyebrow({ children, className }: EyebrowProps) {
  return <p className={cn('label text-fg-muted', className)}>{children}</p>
}
