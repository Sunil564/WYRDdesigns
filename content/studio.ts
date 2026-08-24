/**
 * Copy for the `/studio` route. Brief section 6.4.
 *
 * Every string here is traceable, and the trace is the point on this route more than any
 * other, because a studio page is where an about-us voice normally invents things.
 *
 *   opening        `site.descriptor`, verbatim from docs/brand.md section 2
 *   name, thread   verbatim from the build plan section 6.4
 *   strip          verbatim from the build plan line 334
 *   capabilities   `content/services.ts`, which is verbatim from docs/brand.md section 3
 *   process        `content/process.ts`, which is verbatim from the build plan 6.1 S6
 *   location       `content/site.ts`, from docs/brand.md section 1
 *
 * There is no founding year, no headcount, no years in business and no team. None of those
 * facts exist, so none of them is written, inferred, or gestured at. The team section does
 * not render at all: see `docs/placeholders.md`, "What is deliberately absent".
 *
 * The name is explained here and only here. CLAUDE.md fixes both halves of that rule: once,
 * on this page, and never in a sentence containing the word "but".
 */

export const studioPage = {
  eyebrow: 'Studio',
  headline: 'Studio',
  /** Stated once, on this route, per CLAUDE.md. */
  name: {
    label: 'The name',
    statement: 'WYRD is Old English for fate. It also sounds like weird. We answer to both.',
    thread:
      'Fate was a thread. Something spun, measured, and cut. A brand works the same way. Every choice about how you show up gets woven in. We stay on it for the whole length.',
  },
  capabilities: {
    label: 'What we do',
    /** Names the spine's relationship to the four without restating either. */
    note: 'Four clusters, and the direction that sits on top of all of them.',
  },
  process: {
    label: 'How we work',
    /**
     * The expansion the brief asks for is room, not more claims. The four steps are the
     * four steps: same names, same lines, given full width and larger type instead of the
     * compressed grid the homepage uses. Inventing a second sentence per step to make this
     * page feel longer is exactly the failure section 1 of the Phase 5 brief describes.
     */
    note: null,
  },
  location: {
    label: 'Where we are',
  },
  contact: {
    label: 'Talk to us',
  },
  meta: {
    title: 'Studio',
    description:
      'WYRD Designs is a digital and creative studio in Bangalore. One team across strategy, content and production, in-house, so the people who build it are the people who keep working on it.',
  },
} as const
