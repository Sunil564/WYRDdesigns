import { cn } from '@/lib/utils'

type WordmarkProps = {
  /** `mark` is the header lockup, `display` is the oversized footer treatment. */
  size?: 'mark' | 'display'
  /**
   * Which token set to read. Explicit, never inferred from a parent, because the
   * same wordmark sits on the white header and on the dark footer.
   * Phase 4b criterion 12.
   */
  variant?: 'light' | 'inverse'
  /** The `Designs` half. Off in tight spaces where `WYRD` alone is unambiguous. */
  descriptor?: boolean
  className?: string
}

/**
 * The supplied mark, on light grounds. The typographic fallback, on dark ones.
 *
 * The artwork is `Codebase2/Company logo/Logo_Design_Black final.png`, a 2101 by 989 raster
 * after trimming, black with a gradient on the Y, on transparent. It is used unmodified:
 * never redrawn, never recoloured, never restretched, per section 0.3 of the brief.
 *
 * **Why it took until now.** ADR 0003 shelved this mark because the site was dark and black
 * artwork on `--color-bg` was invisible. Phase 4b turned the canvas white, which removed the
 * reason without anyone going back for the mark. It has been sitting in `public/brand/` since
 * Phase 0.
 *
 * **The inverse branch still renders type, and that is a report rather than a preference.**
 * Black artwork on `--color-bg-inverse` measures about 1.06:1, which is not a contrast
 * problem to tune, it is invisibility. Section 0.3 forbids recolouring a supplied mark, so
 * the honest options were type or nothing, and the operator gets told rather than shown a
 * silently inverted logo. See ADR 0023 and `docs/BLOCKERS.md` item 2.
 *
 * Exported at 3x the largest render, WebP with a PNG fallback, by
 * `scripts/process-assets.py`. Width and height are the intrinsic 3x values so the box is
 * reserved before the file loads and the header cannot shift.
 */
export function Wordmark({
  size = 'mark',
  variant = 'light',
  descriptor = true,
  className,
}: WordmarkProps) {
  if (variant === 'light') {
    return (
      <picture>
        <source srcSet="/brand/wyrd-header.webp" type="image/webp" />
        <img
          src="/brand/wyrd-header.png"
          alt="WYRD Designs"
          width={255}
          height={120}
          /*
            Sized by height so the artwork keeps its own proportions. 32px on mobile and 40px
            from `sm` up, which is what the 3x export is cut for.
          */
          className={cn('h-8 w-auto sm:h-10', className)}
          decoding="async"
        />
      </picture>
    )
  }

  return (
    <span
      data-placeholder="Typographic wordmark on dark grounds, pending a mark drawn for a dark background"
      className={cn('inline-flex items-baseline gap-2 leading-none', className)}
    >
      <span
        className={cn(
          'text-fg-inverse font-black tracking-[-0.02em]',
          size === 'mark' ? 'text-title' : 'text-mega',
        )}
      >
        WYRD
      </span>
      {/*
        A real space between the two words, not only the flex gap. Without it the text content
        is "WYRDDesigns" and a link's accessible name stops containing its own visible text.
      */}
      {descriptor && ' '}
      {descriptor && (
        <span
          className={cn(
            'text-fg-inverse-muted',
            size === 'mark' ? 'label' : 'text-title font-medium tracking-[0.06em]',
          )}
        >
          Designs
        </span>
      )}
    </span>
  )
}
