/**
 * Copy for the `/work/[slug]` template. Brief section 6.3.
 *
 * Labels only. Every value on a case study page comes from `content/projects.ts`, and any
 * field that is null there renders nothing at all rather than an empty label. Nothing in
 * this file describes a project, because nothing in this build knows anything about one.
 *
 * There is deliberately no label for an outcome, a metric, a testimonial or a date beyond
 * the year. The outcome block does not render without real numbers, per ADR 0009, so a
 * label for it would be a label for a section that cannot appear.
 */

export const caseStudy = {
  /** Meta row labels. Each renders only beside a value that exists. */
  meta: {
    client: 'Client',
    year: 'Year',
    services: 'Services',
    role: 'Role',
  },
  briefLabel: 'The brief',
  outcomeLabel: 'Outcome',
  /** Shown on a card whose project entry is still a placeholder. */
  pending: 'Pending clearance',
  /**
   * The one honest sentence a placeholder case study can carry: it says the page is a
   * template and the project is not cleared, so nothing on it reads as a finished study.
   */
  placeholderNote:
    'This project has not been cleared for publication. The layout is real, the detail is not yet.',
  nav: {
    label: 'More work',
    previous: 'Previous',
    next: 'Next',
    all: 'All work',
  },
} as const
