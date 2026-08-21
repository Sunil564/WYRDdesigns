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
 * One rendering: the artwork as supplied, in its own colours, at a shared optical height.
 *
 * **There used to be two.** Five marks shipped as alpha only ink masks tinted with
 * `currentColor`, and SITEO shipped in colour because five colour blocks with white letters
 * knocked out do not survive being reduced to one ink. That made the row five grey marks and
 * one in full colour, which read as an inconsistency rather than a decision, and it put the
 * odd one out permanently in `docs/BLOCKERS.md` waiting for a file SITEO was never asked
 * for. Removing the treatment closes it. See ADR 0027.
 *
 * The real company name is the accessible name, and nothing is renamed.
 */
export function ClientLogo({ client, height = 40, className }: ClientLogoProps) {
  const width = Math.round((client.width / client.height) * height)

  return (
    /*
      A plain img, not next/image. The file is a local static asset at a known size
      that needs no resizing, no format negotiation, and no lazy loading, and the
      Image component's client runtime measured 5kb over the wire for exactly one
      mark in the row. Width and height are set, so the box is reserved and there is
      no layout shift.
    */
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
