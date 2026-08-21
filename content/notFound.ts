/**
 * Copy for the 404 page.
 *
 * Written to the voice rules in `CLAUDE.md`: confident, plain, unhurried, short sentences,
 * say the thing and stop. No apology, no exclamation mark, no joke about being lost. A 404 is
 * a fact about an address, not an event that needs softening.
 *
 * It states the two things that are actually true of a missing page, that it may have moved or
 * may never have existed, and then gets out of the way. It does not guess what the visitor
 * wanted, because it cannot know, and a wrong guess reads worse than an honest list.
 */

export const notFoundPage = {
  eyebrow: '404',
  headline: 'Not here.',
  lead: 'That address does not point at a page. It may have moved, or it may never have existed.',
  linksLabel: 'Where to instead',
  homeLabel: 'Home',
  meta: {
    title: 'Not found',
    description: 'That address does not point at a page on the WYRD Designs site.',
  },
} as const
