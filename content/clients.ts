/**
 * Client logo manifest. Brief section 6.1 S5.
 *
 * Generated from `public/logos/manifest.json`, which `scripts/process-assets.py`
 * writes from the six logo files in the source folder. Names are the real company
 * names as they appear in the artwork. Nothing here is renamed or invented.
 *
 * Each file is an alpha only ink mask, rendered in `currentColor` through the
 * `logo-mask` utility, which is how the row moves from `--color-fg-muted` to
 * `--color-fg` on hover with one CSS transition. See ADR 0004.
 *
 * Six logos is below the eight the brief sets as the marquee threshold, so S5
 * renders a single centred static row. A marquee with six logos looks like a
 * marquee with six logos.
 *
 * If clearance for any of these has not actually been given, delete its entry.
 * The section disappears on its own at zero. See ADR 0002 section 6 and
 * docs/BLOCKERS.md item 4.
 */

export type Client = {
  /** Real company name, from the artwork. Used as the accessible name. */
  name: string
  file: string
  /** Intrinsic mask size, so the row reserves its box before the file loads. */
  width: number
  height: number
}

/** Below this count the marquee is replaced by a static centred row. */
export const MARQUEE_THRESHOLD = 8

export const clients: Client[] = [
  { name: 'Bhavani Sarees', file: '/logos/bhavani-sarees.webp', width: 115, height: 96 },
  { name: 'G Monisa', file: '/logos/g-monisa.webp', width: 113, height: 96 },
  { name: 'Maharaja', file: '/logos/maharaja.webp', width: 135, height: 96 },
  { name: 'SITEO', file: '/logos/siteo.webp', width: 284, height: 96 },
  {
    name: 'Seervi Business Expo',
    file: '/logos/seervi-business-expo.webp',
    width: 87,
    height: 96,
  },
  { name: 'Vahini Pipes', file: '/logos/vahini-pipes.webp', width: 201, height: 96 },
]
