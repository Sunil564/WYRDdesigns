/**
 * `/work` route verification. Development only, run against a production build.
 *
 * The route level checks come from `scripts/route-checks.mjs` so they exist once. What is
 * here is what only this page can be asked: that the grid is exactly as long as the content,
 * that a cluster with no cleared project is not a live control, and that filtering animates
 * position rather than popping.
 *
 * Usage: bash scripts/verify-server.sh, then
 *   SHOOT_BASE=http://localhost:3100 node scripts/check-work.mjs
 */

import { assertBuildFresh } from './build-fresh.mjs'
import { createHarness } from './route-checks.mjs'

const BASE = process.env.SHOOT_BASE ?? 'http://localhost:3000'

/*
  Refuse to measure a build older than the source. See scripts/build-fresh.mjs.
*/
assertBuildFresh({ base: BASE })

const CHIP_GROUP = '[aria-label="Filter work by cluster"] button'
const ROUTE = '/work'

const harness = createHarness({ base: BASE })
const { record, open } = harness
await harness.launch()

// ---------------------------------------------------------------- shared route checks
await harness.checkHead(ROUTE)
await harness.checkKeyboardAndTargets(ROUTE)
/*
  Under reduced motion the route still has to be composed: a visual in every card. What fills
  a card changed twice, so the count is now of both kinds. Placeholders went to zero when the
  visuals became real files; decoded images go to zero on a card whose project has no imagery
  yet, which is where Bhavani Garments sits. The grid is composed either way, and one card
  short is the failure worth catching.
*/
await harness.checkReducedMotion(ROUTE, {
  expect: (state) => state.loadedImages + state.placeholders >= 3,
  describe: (state) =>
    `${state.loadedImages} decoded card images and ${state.placeholders} pending slots`,
})
await harness.checkOverflow(ROUTE)

// ------------------------------------------------- the grid is the content, not padded
{
  const { context, page } = await open(1440, 900)
  await page.goto(`${BASE}${ROUTE}`, { waitUntil: 'load' })
  await page.waitForTimeout(2000)

  const grid = await page.evaluate((chipGroup) => {
    const cards = Array.from(document.querySelectorAll('article.work-card'))
    return {
      cards: cards.length,
      slugs: cards.map((card) => card.querySelector('a')?.getAttribute('href') ?? ''),
      /*
        Every card visual, measured on what the browser actually decoded rather than on the
        element being present. `naturalWidth` is zero for a broken src, an empty src, and an
        img that never loaded, all three of which would satisfy a querySelectorAll count.
      */
      visuals: Array.from(document.querySelectorAll('article.work-card img')).map((img) => ({
        loaded: img.complete && img.naturalWidth > 0,
        natural: `${img.naturalWidth}x${img.naturalHeight}`,
        shown: `${Math.round(img.getBoundingClientRect().width)}x${Math.round(img.getBoundingClientRect().height)}`,
        alt: (img.getAttribute('alt') ?? '').trim(),
        lazy: img.loading === 'lazy',
      })),
      /*
        A card whose project has no imagery yet renders the seeded placeholder at the same
        shape. Measured on the drawn box as well as on the note, because a placeholder that
        collapsed to zero height would leave a hole in the grid and still carry its attribute.
      */
      pending: Array.from(
        document.querySelectorAll('article.work-card [data-placeholder]'),
      ).map((node) => ({
        note: (node.getAttribute('data-placeholder') ?? '').trim(),
        shown: Math.round(node.getBoundingClientRect().height),
      })),
      chips: Array.from(document.querySelectorAll(chipGroup)).map((button) => ({
        label: button.textContent?.trim() ?? '',
        disabled: button.disabled,
      })),
      /** Which clusters each card says it belongs to. Published by the card itself. */
      cardClusters: cards.map((card) => (card.getAttribute('data-clusters') ?? '').split(' ')),
    }
  }, CHIP_GROUP)

  /*
    Do the card links actually go anywhere? Asserted on the response, not on the href, since
    an href that reads correctly and 404s is exactly the failure worth catching. It did 404
    for one commit, while the detail route was still to come.
  */
  const linkStatuses = []
  for (const href of grid.slugs.filter(Boolean)) {
    const response = await page.request.get(`${BASE}${href}`)
    linkStatuses.push({ href, status: response.status() })
  }
  const broken = linkStatuses.filter((entry) => entry.status >= 400)
  record(
    'every card link resolves',
    broken.length === 0,
    broken.length
      ? `${broken.length} of ${linkStatuses.length} return an error: ` +
        broken.map((entry) => `${entry.status} ${entry.href}`).join(', ')
      : `${linkStatuses.length} links, all 200`,
  )

  const distinct = new Set(grid.slugs.filter(Boolean))
  record(
    'the grid holds one card per project and repeats none',
    grid.cards > 0 && distinct.size === grid.cards,
    `${grid.cards} cards, ${distinct.size} distinct slugs: ${[...distinct].join(', ')}`,
  )
  /*
    This asserted that every card visual carried `data-placeholder`. The visuals are real
    files now, so it had to become an assertion about the image rather than about the
    element: decoded by the browser, carrying alt text, and lazy because none of them is
    above the fold. Alt text is checked for presence here and for content by hand, since no
    assertion can tell an honest description from a claim about our work.
  */
  const drawn = grid.visuals.filter((visual) => visual.loaded)
  const pendingDrawn = grid.pending.filter((slot) => slot.note.length > 10 && slot.shown > 40)
  record(
    'every card carries a visual, either a decoded described image or a drawn placeholder',
    grid.visuals.length + grid.pending.length === grid.cards &&
      drawn.length === grid.visuals.length &&
      pendingDrawn.length === grid.pending.length &&
      grid.visuals.every((visual) => visual.alt.length > 20) &&
      grid.visuals.every((visual) => visual.lazy),
    [
      ...grid.visuals.map(
        (visual) => `${visual.shown} from ${visual.natural}${visual.loaded ? '' : ' NOT LOADED'}`,
      ),
      ...grid.pending.map((slot) => `placeholder ${slot.shown}px high`),
    ].join(', '),
  )
  const enabled = grid.chips.filter((chip) => !chip.disabled).map((chip) => chip.label)
  const disabled = grid.chips.filter((chip) => chip.disabled).map((chip) => chip.label)
  /*
    This asserted that at least one chip was disabled, which was true while three projects sat
    in three clusters and stopped being a test the moment a project sat in two: Bhavani
    Garments is in Build and in Reach, so every cluster now holds one and nothing is disabled.

    An assertion with no case left to catch is worse than none, because it reads as coverage.
    So the criterion is now the invariant rather than one instance of it: a chip is disabled
    if and only if no project in the content module sits in its cluster. That holds whether
    the answer is four enabled chips or none, and it fails if the count and the state
    disagree, which is the actual failure worth catching.
  */
  /*
    Both sides read off the page: the chips are what the filter offers, and the clusters come
    from the cards themselves through `data-clusters`. Neither is a constant copied out of
    `content/services.ts`, which would go stale the moment a cluster was renamed.
  */
  const occupied = new Set(grid.cardClusters.flat().filter(Boolean))
  const expectedDisabled = grid.chips
    .slice(1)
    .map((chip) => chip.label)
    .filter((name) => !occupied.has(name.toLowerCase()))
  const stateMatchesContent =
    disabled.length === expectedDisabled.length &&
    expectedDisabled.every((name) => disabled.includes(name))
  record(
    'a chip is disabled exactly when no project sits in its cluster',
    grid.chips.length === 5 && stateMatchesContent,
    `${grid.chips.length} chips. Enabled: ${enabled.join(', ')}. ` +
      `Disabled: ${disabled.join(', ') || 'none'}. ` +
      `Content says empty: ${expectedDisabled.join(', ') || 'none'}`,
  )
  await context.close()
}

// -------------------------------------------------------------- filtering moves cards
{
  const { context, page } = await open(1440, 900)
  await page.goto(`${BASE}${ROUTE}`, { waitUntil: 'load' })
  await page.waitForTimeout(2000)

  const before = await page.evaluate(() =>
    Array.from(document.querySelectorAll('article.work-card')).map((card) => {
      const rect = card.getBoundingClientRect()
      return {
        slug: (card.querySelector('a')?.getAttribute('href') ?? '').split('/').pop(),
        y: Math.round(rect.top + window.scrollY),
      }
    }),
  )

  /*
    Filter to the last enabled cluster, so the card that survives is not already first and
    has somewhere to travel to. If filtering popped, the survivor would be at its final
    place on the frame after the click.
  */
  const target = await page.evaluate((chipGroup) => {
    const chips = Array.from(document.querySelectorAll(chipGroup)).filter(
      (button) => !button.disabled && button.textContent?.trim() !== 'All',
    )
    const last = chips[chips.length - 1]
    last?.click()
    return last?.textContent?.trim() ?? null
  }, CHIP_GROUP)

  const position = () =>
    page.evaluate(() => {
      const card = document.querySelector('article.work-card')
      if (!card) return null
      const rect = card.getBoundingClientRect()
      return { x: Math.round(rect.left), y: Math.round(rect.top + window.scrollY) }
    })

  await page.waitForTimeout(90)
  const early = await position()
  await page.waitForTimeout(900)
  const settled = await position()
  const remaining =
    early && settled ? Math.abs(early.y - settled.y) + Math.abs(early.x - settled.x) : 0

  record(
    'filtering animates position rather than popping',
    remaining > 4,
    `filtered to ${target}. 90ms after the click the survivor was still ${remaining}px from ` +
      `its final place, settling at (${settled?.x}, ${settled?.y}). ` +
      `Before: ${before.map((card) => `${card.slug}@${card.y}`).join(', ')}`,
  )
  await context.close()
}

await harness.finish()
