/**
 * The 404. Development only, run against a production build.
 *
 * The thing worth asserting hardest is the status code, not the markup. A page that looks like
 * a 404 and answers 200 is a soft 404: search engines index it, monitoring never sees it, and
 * every broken link on the site becomes invisible. Both routes into this page are checked on
 * the response rather than on what rendered.
 *
 * Usage: bash scripts/verify-server.sh, then
 *   SHOOT_BASE=http://localhost:3100 node scripts/check-not-found.mjs
 */

import { assertBuildFresh } from './build-fresh.mjs'
import { createHarness } from './route-checks.mjs'

const BASE = process.env.SHOOT_BASE ?? 'http://localhost:3000'

/*
  Refuse to measure a build older than the source. See scripts/build-fresh.mjs.
*/
assertBuildFresh({ base: BASE })

/** An address matching no route at all. */
const UNMATCHED = '/no-such-page'

/** A route that exists with a parameter that does not, so the page calls `notFound()`. */
const BAD_SLUG = '/work/no-such-project'

/*
  The two paths below answer 404 by design, so their own status is not a problem to report. The
  status assertions above check it directly instead, which is where that claim belongs.
*/
const harness = createHarness({ base: BASE, expectedErrorPaths: [UNMATCHED, BAD_SLUG] })
const { record, open } = harness
await harness.launch()

// ------------------------------------------------------------ both routes answer 404
{
  const { context, page } = await open(1440, 900)
  const statuses = []
  for (const path of [UNMATCHED, BAD_SLUG, '/work/ecommerce-garments']) {
    const response = await page.request.get(`${BASE}${path}`)
    statuses.push({ path, status: response.status() })
  }
  const unmatched = statuses.find((entry) => entry.path === UNMATCHED)
  const badSlug = statuses.find((entry) => entry.path === BAD_SLUG)
  const real = statuses.find((entry) => entry.path === '/work/ecommerce-garments')

  record(
    'an unmatched address answers 404, not a soft 200',
    unmatched.status === 404,
    `${unmatched.path} returned ${unmatched.status}`,
  )
  record(
    'a real route with an unknown parameter answers 404',
    badSlug.status === 404,
    `${badSlug.path} returned ${badSlug.status}`,
  )
  /*
    The control. If the 404 handler were catching everything, the first two would pass and the
    site would be broken, so a real route is checked in the same breath.
  */
  record(
    'a real route still answers 200',
    real.status === 200,
    `${real.path} returned ${real.status}`,
  )
  await context.close()
}

// ------------------------------------------------------------- shared route checks
await harness.checkHead(UNMATCHED, { expectCanonical: false })
await harness.checkKeyboardAndTargets(UNMATCHED, { stops: 18 })
await harness.checkReducedMotion(UNMATCHED)
await harness.checkOverflow(UNMATCHED, [320, 375, 768, 1440, 2560])

// ------------------------------------------- it is not indexable, and offers real routes
{
  const { context, page } = await open(1440, 900)
  await page.goto(`${BASE}${UNMATCHED}`, { waitUntil: 'load' })
  await page.waitForTimeout(2000)

  const head = await page.evaluate(() => ({
    robots: document.querySelector('meta[name="robots"]')?.getAttribute('content') ?? '',
    h1: document.querySelector('h1')?.textContent?.trim() ?? '',
    /* Only the links this page offers, not the header and footer it shares with every route. */
    offered: Array.from(document.querySelectorAll('main a[href^="/"]')).map((link) =>
      link.getAttribute('href'),
    ),
  }))

  record(
    'the 404 asks not to be indexed',
    /noindex/.test(head.robots),
    `robots "${head.robots || '(none)'}"`,
  )

  /*
    A 404 that links to another 404 is the worst version of this page. The links it offers are
    followed rather than read.
  */
  const results = []
  for (const href of head.offered) {
    const response = await page.request.get(`${BASE}${href}`)
    results.push({ href, status: response.status() })
  }
  const broken = results.filter((entry) => entry.status >= 400)
  record(
    'every route the 404 offers resolves',
    results.length > 0 && broken.length === 0,
    broken.length
      ? broken.map((entry) => `${entry.status} ${entry.href}`).join(', ')
      : `${results.length} offered: ${results.map((entry) => entry.href).join(', ')}, all 200`,
  )

  /*
    Next's built in error page renders a bare "404" as its h1 in inline styles. If this ever
    reverts to the default, the heading is what changes first.
  */
  record(
    'the page renders its own heading rather than the framework default',
    head.h1.length > 0 && head.h1 !== '404',
    `h1 "${head.h1}"`,
  )
  await context.close()
}

await harness.finish()
