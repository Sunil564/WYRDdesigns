'use client'

import { useInView } from '@/components/motion/useInView'

/**
 * The footer's closing mark. The supplied white artwork, at a hairline value, with a
 * highlight that sweeps across it and stops.
 *
 * **The artwork is not modified.** It renders as an `img` at low opacity, which is what
 * puts it at the hairline value: white at 9 percent over `--color-bg-inverse` resolves to
 * almost exactly `--color-border-inverse`, the colour the typographic version used. Section
 * 0.3 forbids recolouring a supplied mark, and nothing here recolours it. The sheen is a
 * separate layer above, clipped to the artwork's own alpha, so the mark itself is untouched
 * and the highlight simply cannot escape its silhouette.
 *
 * The sweep runs only while the footer is on screen. `once: false` is the whole reason
 * `useInView` takes that parameter. An animation at the very bottom of a long page would
 * otherwise tick for the entire visit without ever being seen.
 *
 * Decorative, so the whole thing is hidden from assistive technology: the name is already in
 * the footer copy above it and in the header. See ADR 0026.
 */
export function WordmarkClose() {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.15, once: false })

  return (
    <div
      ref={ref}
      aria-hidden="true"
      data-sheen={inView ? 'running' : 'paused'}
      className="wordmark-close pointer-events-none select-none"
    >
      {/*
        A plain img, not next/image, for the same reasons as ClientLogo: a local static asset
        at a known size needing no resizing, no format negotiation and no runtime. Lazy,
        because it is 32kb sitting at the very bottom of a long page and nothing above the
        fold waits on it. Width and height reserve the box so the footer cannot shift.
      */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/wyrd-watermark.webp"
        alt=""
        width={2101}
        height={989}
        loading="lazy"
        decoding="async"
      />
      <span className="wordmark-sheen" />
    </div>
  )
}
