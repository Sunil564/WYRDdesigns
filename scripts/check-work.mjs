/**
 * `/work` route verification. Development only, run against a production build.
 *
 * The route level checks come from `scripts/route-checks.mjs` so they exist once. What is
 * here is what only this page can be asked: that the list is exactly as long as the content
 * and repeats nothing, that every row is complete, that nothing on it pretends to be a link,
 * and that homepage S4 shows the first three of the same list.
 *
 * **What this used to check is gone with the feature.** The grid was a set of image cards
 * behind a cluster filter, and three of the five criteria here measured decoded card
 * visuals, link resolution, and chip disabled state against `project.clusters`. There are
 * no images, no links and no chips now. Those criteria were deleted rather than loosened,
 * because an assertion kept alive past its feature reads as coverage and is not.
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

const ROUTE = '/work'

/** Reads every engagement row on whatever page is open. Used on `/work` and on `/`. */
const readRows = () =>
  Array.from(document.querySelectorAll('article[data-engagement]')).map((row) => ({
    name: row.querySelector('h2, h3')?.textContent?.trim() ?? '',
    sector: row.querySelector('p.label')?.textContent?.trim() ?? '',
    line: row.querySelector('p.measure')?.textContent?.trim() ?? '',
    services: Array.from(row.querySelectorAll('ul li')).map((li) => li.textContent?.trim() ?? ''),
    /* Anything clickable inside the row. There should be none of it. */
    links: row.querySelectorAll('a, button').length,
  }))

const harness = createHarness({ base: BASE })
const { record, open } = harness
await harness.launch()

// ---------------------------------------------------------------- shared route checks
await harness.checkHead(ROUTE)
await harness.checkKeyboardAndTargets(ROUTE)
/*
  The route carried a decoded image or a drawn placeholder in every card and the count was
  the composition test. Both are now zero by design, so zero is what is asserted: an image
  reappearing here means a card frame came back with it.
*/
await harness.checkReducedMotion(ROUTE, {
  expect: (state) => state.loadedImages === 0 && state.placeholders === 0,
  describe: (state) =>
    `${state.loadedImages} decoded images and ${state.placeholders} placeholders, both expected to be 0`,
})
await harness.checkOverflow(ROUTE)

// ------------------------------------------------ the list is the content, not padded
{
  const { context, page } = await open(1440, 900)
  await page.goto(`${BASE}${ROUTE}`, { waitUntil: 'load' })
  await page.waitForTimeout(2000)

  const rows = await page.evaluate(readRows)
  const names = rows.map((row) => row.name)
  const distinct = new Set(names)

  record(
    'the list holds one row per engagement and repeats none',
    rows.length > 0 && distinct.size === rows.length,
    `${rows.length} rows, ${distinct.size} distinct names: ${[...distinct].join(', ')}`,
  )

  /*
    Every field, on every row, present and non trivial. The content module allows a short
    line on purpose, so the floor is low: this catches a field that rendered empty, not a
    field that is merely brief. Three of the six carry no location and that is not a failure.
  */
  const incomplete = rows.filter(
    (row) =>
      row.name.length < 2 ||
      row.sector.length < 3 ||
      row.line.length < 10 ||
      row.services.length === 0 ||
      row.services.some((service) => service.length === 0),
  )
  record(
    'every row carries a name, a sector, a line and at least one service',
    incomplete.length === 0,
    incomplete.length
      ? `${incomplete.length} incomplete: ${incomplete.map((row) => row.name || '(unnamed)').join(', ')}`
      : rows.map((row) => `${row.name} [${row.services.length}]`).join(', '),
  )

  /*
    The rows do not link. Asserted on the rendered DOM rather than on the component, because
    the failure this guards against is a link coming back before a case study does: an
    affordance that lights up and then 404s. The VIEW cursor went the same way, and its
    element is gone from the tree entirely, so its absence is checked at the page level.
  */
  const clickable = rows.reduce((total, row) => total + row.links, 0)
  const cursorLabels = await page.evaluate(
    () => document.querySelectorAll('.cursor-label, .work-card').length,
  )
  record(
    'no row links anywhere, and no card frame or VIEW cursor survives',
    clickable === 0 && cursorLabels === 0,
    `${clickable} clickable elements inside rows, ${cursorLabels} cursor labels or card frames on the page`,
  )

  await context.close()
}

// ------------------------------------------- S4 shows the first three of the same list
{
  const { context, page } = await open(1440, 900)
  await page.goto(`${BASE}${ROUTE}`, { waitUntil: 'load' })
  await page.waitForTimeout(1500)
  const full = (await page.evaluate(readRows)).map((row) => row.name)

  await page.goto(`${BASE}/`, { waitUntil: 'load' })
  /* S4 is below the fold and its rows are reveal wrapped, so it has to be reached. */
  await page.locator('#work').scrollIntoViewIfNeeded()
  await page.waitForTimeout(1500)
  const home = (await page.evaluate(readRows)).map((row) => row.name)

  /*
    Compared page against page, not either against a constant in here. A copied list is a
    second source of truth that goes stale silently, and the failure worth catching is the
    two pages disagreeing after someone edits one of them.
  */
  const expected = full.slice(0, home.length)
  const matches =
    home.length === 3 && home.length < full.length && home.every((name, i) => name === expected[i])
  record(
    'homepage S4 shows the first three rows of /work, in the same order',
    matches,
    `S4: ${home.join(', ')} | /work first ${home.length}: ${expected.join(', ')} of ${full.length} total`,
  )

  await context.close()
}

await harness.finish()
