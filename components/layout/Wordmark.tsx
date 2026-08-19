import { cn } from '@/lib/utils'

type WordmarkProps = {
  /** `mark` is the header lockup, `display` is the oversized footer treatment. */
  size?: 'mark' | 'display'
  /** The `Designs` half. Off in tight spaces where `WYRD` alone is unambiguous. */
  descriptor?: boolean
  className?: string
}

/**
 * Interim typographic wordmark.
 *
 * The supplied logo is a black on transparent raster and is invisible on
 * `--color-void`. Section 0.3 of the brief forbids recolouring it and sanctions
 * setting the wordmark in Satoshi instead, which is what this is. The lockup
 * order matches the supplied artwork: the name, then `Designs` below and lighter.
 *
 * Tagged `data-placeholder`, listed in docs/placeholders.md, and replaced the day
 * a vector and a dark background variant arrive. See ADR 0003.
 */
export function Wordmark({ size = 'mark', descriptor = true, className }: WordmarkProps) {
  return (
    <span
      data-placeholder="Interim typographic wordmark, pending a vector mark with a dark background variant"
      className={cn('inline-flex items-baseline gap-2 leading-none', className)}
    >
      <span
        className={cn(
          'text-paper font-black tracking-[-0.02em]',
          size === 'mark' ? 'text-title' : 'text-mega',
        )}
      >
        WYRD
      </span>
      {descriptor && (
        <span
          className={cn(
            'text-muted',
            size === 'mark' ? 'label' : 'text-title font-medium tracking-[0.06em]',
          )}
        >
          Designs
        </span>
      )}
    </span>
  )
}
