import type { ProjectImage as ProjectImageData } from '@/content/projects'
import { cn } from '@/lib/utils'

type ProjectImageProps = {
  image: ProjectImageData
  /**
   * Only the case study hero is eager. Everything else is below the fold on every
   * viewport this site supports, and a lazy image that is genuinely below the fold costs
   * the visitor nothing while an eager one delays the thing they came for.
   */
  priority?: boolean
  /** `sizes` for the browser to pick against. Every slot knows its own width. */
  sizes?: string
  className?: string
}

/**
 * One generated project frame.
 *
 * `<picture>` with a WebP source and a JPG fallback, both produced by
 * `scripts/process-assets.py` from the same original. A plain `img`, not `next/image`, for
 * the same reason as `ClientLogo`: these are local static assets at a known size that need
 * no resizing, no format negotiation at request time, and no client runtime.
 *
 * **Width and height are always the intrinsic pixels.** They are what stops the slot
 * collapsing before the file arrives, and images are the classic cause of layout shift, so
 * the box is reserved from the markup rather than from CSS that may or may not have applied.
 * The aspect ratio the browser derives from them matches the slot exactly, because the slots
 * were moved to the images rather than the images cut to the slots.
 */
export function ProjectImage({ image, priority = false, sizes, className }: ProjectImageProps) {
  return (
    <picture>
      <source srcSet={image.webp} type="image/webp" sizes={sizes} />
      <img
        src={image.jpg}
        alt={image.alt}
        width={image.width}
        height={image.height}
        sizes={sizes}
        loading={priority ? 'eager' : 'lazy'}
        decoding={priority ? 'sync' : 'async'}
        fetchPriority={priority ? 'high' : 'auto'}
        className={cn('block h-full w-full object-cover', className)}
      />
    </picture>
  )
}
