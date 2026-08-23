/**
 * Client logo manifest. Brief section 6.1 S5.
 *
 * Generated from `public/logos/manifest.json`, which `scripts/process-assets.py`
 * writes from the six logo files in the source folder. Names are the real company
 * names as they appear in the artwork. Nothing here is renamed or invented.
 *
 * Every mark ships in its own colours, at one optical height. Five of the six used to
 * render as alpha ink masks tinted with `currentColor`, with SITEO alone in colour because
 * it did not survive being reduced to one ink. That treatment is gone: a row of five grey
 * marks and one in full colour made SITEO look like a mistake rather than a decision, and
 * the marks are other companies' property, which is an argument for showing them as drawn
 * rather than as our house style. See ADR 0027.
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
  /** Intrinsic size, so the row reserves its box before the file loads. */
  width: number
  height: number
  /**
   * Rendered height multiplier on `CLIENT_MARK_HEIGHT`, tuned per mark.
   *
   * Not a nicety. Every file here is already trimmed to its own ink, so all six share an
   * optical height, and at that shared height SITEO still reads far larger than the rest.
   * SITEO is a solid colour block whose bounding box is 86.5 percent inked; the other five
   * are line art and fill 30 to 53 percent of theirs. Equal boxes, unequal ink.
   *
   * So the row matches apparent weight rather than bounding box, and the amount is per mark
   * because the five are not equally light. Measured coverage of the ink box, which is what
   * set the ordering before the eye tuned it:
   *
   *   SITEO      86.5%   the reference, untouched at 1.0
   *   Seervi     53.4%
   *   Maharaja   52.1%
   *   G Monisa   47.6%
   *   Vahini     39.4%
   *   Bhavani    30.4%   the lightest, and it needs the most
   *
   * Absent means 1. Clamped to `CLIENT_ROW_ALLOWANCE` in `ClientLogo`, so a future edit here
   * cannot silently make the row taller.
   */
  scale?: number
}

/** Rendered height of a mark at scale 1, in px. SITEO renders here and nowhere else. */
export const CLIENT_MARK_HEIGHT = 40

/**
 * The tallest any mark may render, in px, and therefore the height of the row.
 *
 * The row is pinned to this rather than to its tallest child, so the section's rhythm is set
 * by a number that is written down instead of by whichever mark happens to be scaled most.
 * Raising a `scale` past it clamps rather than growing the row.
 */
export const CLIENT_ROW_ALLOWANCE = 60

/** Below this count the marquee is replaced by a static centred row. */
export const MARQUEE_THRESHOLD = 8

export const clients: Client[] = [
  {
    name: 'Bhavani Sarees',
    file: '/logos/bhavani-sarees.webp',
    width: 115,
    height: 96,
    scale: 1.5,
  },
  {
    name: 'G Monisa',
    file: '/logos/g-monisa.webp',
    width: 113,
    height: 90,
    scale: 1.42,
  },
  {
    name: 'Maharaja',
    file: '/logos/maharaja.webp',
    width: 135,
    height: 88,
    scale: 1.39,
  },
  {
    name: 'SITEO',
    file: '/logos/siteo.webp',
    width: 284,
    height: 71,
    /* Down 20 percent from the base. It is the densest mark and carried the row. */
    scale: 0.8,
  },
  {
    name: 'Seervi Business Expo',
    file: '/logos/seervi-business-expo.webp',
    width: 87,
    height: 96,
    scale: 1.49,
  },
  {
    name: 'Vahini Pipes',
    file: '/logos/vahini-pipes.webp',
    width: 201,
    height: 83,
    scale: 1.18,
  },
]
