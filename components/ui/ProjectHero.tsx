import type { ProjectImages } from '@/content/projects'

/** Below this width the portrait hero is served. Matches the `lg` breakpoint. */
const HERO_BREAKPOINT = '(min-width: 64rem)'

/**
 * The case study hero, as two separate images rather than one cropped by CSS.
 *
 * The landscape frame is composed for width and the portrait one for height, and neither is
 * a crop of the other: they were generated separately for exactly this. Cropping the 16:9 to
 * a phone's viewport would keep about a quarter of it, and the part thrown away is the
 * negative space the composition is built on.
 *
 * Two `<source>` elements ahead of the `img`, so the browser picks before it fetches and
 * only ever downloads one. Both carry their own intrinsic dimensions, which is what stops
 * the swap at the breakpoint from shifting anything: without them the element would take its
 * ratio from whichever file happened to load.
 *
 * Eager, because this is the largest contentful paint on the route. It is the one image on
 * the site that is not lazy.
 */
export function ProjectHero({ images }: { images: ProjectImages }) {
  const wide = images.heroDesktop
  const tall = images.heroMobile

  return (
    <picture>
      <source
        media={HERO_BREAKPOINT}
        srcSet={wide.webp}
        type="image/webp"
        width={wide.width}
        height={wide.height}
      />
      <source
        media={HERO_BREAKPOINT}
        srcSet={wide.jpg}
        type="image/jpeg"
        width={wide.width}
        height={wide.height}
      />
      <source srcSet={tall.webp} type="image/webp" width={tall.width} height={tall.height} />
      <img
        src={tall.jpg}
        alt={tall.alt}
        width={tall.width}
        height={tall.height}
        loading="eager"
        decoding="sync"
        fetchPriority="high"
        className="block h-full w-full object-cover"
      />
    </picture>
  )
}
