import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type EyebrowProps = {
  children: ReactNode
  /**
   * Which ground this eyebrow sits on. Passed explicitly, never inferred from a parent,
   * the same rule `Section` and `Placeholder` follow.
   *
   * It is a prop rather than a `className` override because `cn` is a plain joiner with
   * no conflict resolution, by its own documented contract: passing `text-fg-inverse`
   * alongside this component's own `text-fg-muted` leaves both in the attribute and lets
   * stylesheet order decide, which is how the first version of this rendered muted on a
   * dark band and looked like a bug in the colour rather than in the API.
   */
  variant?: 'default' | 'inverse'
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
export function Eyebrow({ children, variant = 'default', className }: EyebrowProps) {
  /*
    Full ink on an inverse ground, not the muted token. `--color-fg-inverse-muted` needs a
    background at or below L 0.034 to clear AA, and the cloud band runs to L 0.13. See
    ADR 0033.
  */
  return (
    <p
      className={cn(
        'label',
        variant === 'inverse' ? 'text-fg-inverse' : 'text-fg-muted',
        className,
      )}
    >
      {children}
    </p>
  )
}
