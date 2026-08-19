/**
 * Homepage copy.
 *
 * Locked lines come from docs/brand.md and are never rewritten. Connective copy
 * comes from section 6.1 of the build brief, which docs/brand.md permits.
 *
 * One deliberate substitution, per ADR 0002: the brief's hero eyebrow reads
 * `DESIGN AND TECHNOLOGY STUDIO, BANGALORE`. docs/brand.md section 2 describes the
 * studio as "a digital and creative studio", and brand.md wins on positioning
 * language, so that is what the eyebrow says.
 */

export const hero = {
  eyebrow: 'Digital and creative studio, Bangalore',
  /** Locked. docs/brand.md section 2, the positioning line. */
  headline: ["We don't just build websites.", 'We build everything around them.'],
  lead: 'Web, film, search, social, and the room it all happens in. One studio, one thread through the whole thing.',
  actions: {
    primary: { label: 'Start a project', href: '/contact' },
    secondary: { label: 'See what we do', target: '#capabilities' },
  },
} as const

/** S2. The italic phrase is the one emphasis in the block. Brief section 6.1 S2. */
export const positioning = {
  before: 'Most studios hand you a website and wish you luck.',
  emphasis: 'The website is one surface.',
  after:
    'The film, the search results, the ads, the booth at the trade show, the way the whole thing holds together: that is the work.',
} as const

/** S7. Three facts, no photos of laptops. Brief section 6.1 S7. */
export const studioStrip = {
  lines: [
    'We are a small studio in Bangalore.',
    'You will talk to the people doing the work.',
    'There is no account layer between you and the person making the thing.',
  ],
  link: { label: 'About the studio', href: '/studio' },
} as const

/** S8. Brief section 6.1 S8. */
export const contactCta = {
  headline: 'Tell us what you are making.',
  action: { label: 'Start a project', href: '/contact' },
} as const

/** S4. Brief section 6.1 S4. Honest framing, no manufactured volume. */
export const workIntro = {
  eyebrow: 'Selected work',
  headline: 'A short list, on purpose.',
  link: { label: 'All work', href: '/work' },
} as const

/** S5. Brief section 6.1 S5. */
export const clientsIntro = {
  eyebrow: 'Worked with',
} as const
