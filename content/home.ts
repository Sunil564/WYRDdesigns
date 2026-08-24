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
  /**
   * Locked. docs/brand.md section 2, the positioning line, amended 2026-08-24.
   * The lead states the differentiator plainly and then what it buys: in-house is
   * the reason the studio is still on the work after launch, not a second claim
   * sitting beside it. ADR 0030.
   */
  headline: ['We build it.', 'Then we grow it with you.'],
  lead: 'Web, film, search, social, and the events where it all lands. One team, in-house, still here after launch.',
  actions: {
    primary: { label: 'Start a project', href: '/contact' },
    secondary: { label: 'See what we do', target: '#capabilities' },
  },
} as const

/** S2. The italic phrase is the one emphasis in the block. Brief section 6.1 S2. */
export const positioning = {
  before: 'Most studios hand you a website and wish you luck.',
  emphasis: 'The website is one surface.',
  /*
    The closing sentence is the mechanism, not a second position: the studio can still
    be on the work because the work was never subcontracted. It says how the studio
    operates and claims no duration, because no engagement length is a verified fact.
    ADR 0030.

    "Stall", not the brief's "stand": docs/brand.md section 3 fixes the wording of the
    exhibitions service as "Stall design, collateral and on-ground management", and the
    project on /work is "Exhibition presence, hospitality". Stall is the word this studio
    and its buyers already use. Stand would have been a synonym appearing nowhere else on
    the site.
  */
  after:
    'The film, the search results, the ads, the stall at the expo, the way the whole thing holds together: that is the work. We do all of it ourselves, which is why we are still on it long after the site goes live.',
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
  headline: 'Tell us what you are building.',
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
