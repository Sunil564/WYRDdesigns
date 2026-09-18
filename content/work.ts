/**
 * Copy for the `/work` route.
 *
 * Both visible strings are the operator's, given verbatim on 2026-09-18. The page no
 * longer claims a selection or a case study: it says what these are, which is work in
 * progress, and says when the fuller version arrives without promising a date.
 *
 * The cluster filter is gone with the case studies. Six rows do not need a filter, and
 * the chips were wired to `project.clusters`, a field the engagement content does not
 * carry and should not. See ADR 0034.
 */

export const workPage = {
  eyebrow: 'Work',
  headline: 'Work',
  lead: 'Current engagements. Full case studies as they finish.',
  /**
   * Shown in place of the list if the engagement list is ever empty. Not reachable
   * today, and written rather than left to a crash, because an empty list is a real
   * state for a new studio.
   */
  empty: 'Nothing to show here yet. Ask and we will talk you through what we are building.',
  meta: {
    title: 'Work',
    description:
      'Current engagements at WYRD Designs across web and ecommerce, digital marketing, film and video, and events. All of it made in-house.',
  },
} as const
