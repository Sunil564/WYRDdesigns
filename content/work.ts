/**
 * Copy for the `/work` route. Brief section 6.2 and the Phase 5 brief section 4.
 *
 * Both strings are given verbatim by the Phase 5 brief, which is an operator
 * instruction and therefore a source. Nothing here is inferred, and nothing counts
 * or characterises the project list: the page says "selected projects" and leaves
 * the number to whatever `content/projects.ts` actually holds.
 *
 * The filter labels are the four cluster names from `content/services.ts`, which
 * `docs/brand.md` section 4 fixes. `All` is the only added label and it is
 * structure rather than a claim.
 */

export const workPage = {
  eyebrow: 'Work',
  headline: 'Work',
  lead: 'Selected projects. More on request.',
  /** The label for the filter that clears the others. */
  allLabel: 'All',
  /**
   * Shown in place of the grid if the project list is ever empty. Not reachable
   * today, and written rather than left to a crash, because an empty list is a
   * real state for a new studio.
   */
  empty: 'Nothing cleared for publication yet. Ask and we will show you the work.',
  meta: {
    title: 'Work',
    description:
      'Selected projects from WYRD Designs across web and ecommerce, search, film and video, and exhibitions. All of it made in-house. More on request.',
  },
} as const
