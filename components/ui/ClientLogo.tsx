import type { Client } from '@/content/clients'
import { cn } from '@/lib/utils'

type ClientLogoProps = {
  client: Client
  /** Rendered height in px. The row normalises on optical height, not bounding box. */
  height?: number
  className?: string
}

/**
 * One client mark in the S5 row. Phase 4b section 8.
 *
 * Two renderings, chosen by data rather than by eye:
 *
 * - `mono: true` is an alpha only ink mask tinted with `currentColor`, so the row
 *   moves from `--fg-muted` to `--fg` on hover with one CSS transition and one file.
 * - `mono: false` is the original artwork, for a mark that stops being readable when
 *   reduced to one colour. It sits on the same optical height as the masks and is
 *   listed in docs/BLOCKERS.md as needing a supplied single colour version.
 *
 * Either way the real company name is the accessible name, and nothing is renamed.
 */
export function ClientLogo({ client, height = 40, className }: ClientLogoProps) {
  const width = Math.round((client.width / client.height) * height)

  if (!client.mono) {
    /*
      A plain img, not next/image. The file is a local static asset at a known size
      that needs no resizing, no format negotiation, and no lazy loading, and the
      Image component's client runtime measured 5kb over the wire for exactly one
      mark in the row. Width and height are set, so the box is reserved and there is
      no layout shift.
    */
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={client.file}
        alt={client.name}
        width={width}
        height={height}
        className={cn('block h-10 w-auto', className)}
      />
    )
  }

  return (
    <span
      role="img"
      aria-label={client.name}
      className={cn('logo-mask block h-10', className)}
      style={{ width: `${width}px`, maskImage: `url(${client.file})` }}
    />
  )
}
