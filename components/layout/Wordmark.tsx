import { cn } from '@/lib/utils'

type WordmarkProps = {
  /**
   * Which artwork to render. Explicit, never inferred from a parent, because the same
   * mark sits on the white header and on the dark footer. Phase 4b criterion 12.
   */
  variant?: 'light' | 'inverse'
  className?: string
}

/**
 * The supplied mark. Black artwork on light grounds, white artwork on dark ones.
 *
 * Both variants are supplied files, not recolours of ours: `Logo_Design_Black final.png` and
 * `Logo_Design_White.png`, each a 2101 by 989 raster after trimming at the same 2.124 aspect.
 * Used unmodified, never redrawn, never recoloured, never restretched, per section 0.3.
 *
 * **The inverse branch used to render type**, because until 2026-08-21 only the black artwork
 * existed and black on `--color-bg-inverse` measures 1.06:1, which is not a contrast problem
 * to tune but invisibility. Section 0.3 forbids recolouring a supplied mark, so the options
 * were type or nothing and the operator was told rather than shown an inverted logo. The white
 * variant was then supplied and the fallback is gone. See ADR 0025.
 *
 * Both render at the same size on both grounds, which is the point: one identity, one size,
 * whichever ground it lands on.
 *
 * Exported at 3x the largest render, WebP with a PNG fallback, by
 * `scripts/process-assets.py`. Width and height are the intrinsic 3x values so the box is
 * reserved before the file loads and neither the header nor the footer can shift.
 */
export function Wordmark({
  variant = 'light',
  className,
}: WordmarkProps) {
  const file = variant === 'light' ? 'wyrd-header' : 'wyrd-inverse'

  return (
    <picture>
      <source srcSet={`/brand/${file}.webp`} type="image/webp" />
      <img
        src={`/brand/${file}.png`}
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
