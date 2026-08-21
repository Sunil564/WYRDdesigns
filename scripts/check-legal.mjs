/**
 * `/privacy` and `/terms` verification. Development only, run against a production build.
 *
 * Both are holding text today, so most of what this asserts is about being honest about that:
 * the page says it is not published, it makes no claim it cannot support, and it offers a
 * route to a person. The rest is the shared route checks.
 *
 * It exists now rather than when the real copy lands, because the copy landing is exactly
 * when a broken link or a missing heading would slip in unnoticed.
 *
 * Usage: bash scripts/verify-server.sh, then
 *   SHOOT_BASE=http://localhost:3100 node scripts/check-legal.mjs
 */

import { assertBuildFresh } from './build-fresh.mjs'
import { createHarness } from './route-checks.mjs'

const BASE = process.env.SHOOT_BASE ?? 'http://localhost:3000'

/*
  Refuse to measure a build older than the source. See scripts/build-fresh.mjs.
*/
assertBuildFresh({ base: BASE })

const ROUTES = ['/privacy', '/terms']

const harness = createHarness({ base: BASE })
const { record, open } = harness
await harness.launch()

for (const route of ROUTES) {
  await harness.checkHead(route)
  await harness.checkKeyboardAndTargets(route, { stops: 20 })
  await harness.checkReducedMotion(route)
  await harness.checkOverflow(route, [320, 375, 768, 1440, 2560])
}

// ------------------------------------------------- the footer link that used to 404
{
  const { context, page } = await open(1440, 900)
  await page.goto(`${BASE}/`, { waitUntil: 'load' })
  await page.waitForTimeout(2500)

  /*
    Follow the links the footer actually renders, rather than the two this file names. The
    footer is the reason these routes exist, and a list typed in here would not notice a third
    legal link being added.
  */
  const hrefs = await page.evaluate(() =>
    Array.from(document.querySelectorAll('footer a[href^="/"]'))
      .map((link) => link.getAttribute('href') ?? '')
      .filter((href) => /privacy|terms/.test(href)),
  )
  const statuses = []
  for (const href of hrefs) {
    const response = await page.request.get(`${BASE}${href}`)
    statuses.push({ href, status: response.status() })
  }
  const broken = statuses.filter((entry) => entry.status >= 400)
  record(
    'every legal link in the footer resolves',
    hrefs.length > 0 && broken.length === 0,
    broken.length
      ? broken.map((entry) => `${entry.status} ${entry.href}`).join(', ')
      : `${statuses.length} links from the footer, all 200: ${hrefs.join(', ')}`,
  )
  await context.close()
}

// --------------------------------------------- holding text says so, and claims nothing
{
  const { context, page } = await open(1440, 900)
  for (const route of ROUTES) {
    await page.goto(`${BASE}${route}`, { waitUntil: 'load' })
    await page.waitForTimeout(1500)
    const body = await page.evaluate(() => {
      const main = document.querySelector('main')
      const text = (main?.innerText ?? '').replace(/\s+/g, ' ')
      return {
        text,
        pending: /not yet published/i.test(text),
        mailto: Array.from(main?.querySelectorAll('a[href^="mailto:"]') ?? []).length,
        numbers: [...text.matchAll(/\d[\d,.%]*/g)].map((match) => match[0]),
        paragraphs: main?.querySelectorAll('p').length ?? 0,
      }
    })

    record(
      `${route} says on the page that it is not the published document`,
      body.pending,
      `pending marker ${body.pending}, ${body.paragraphs} paragraphs, ${body.text.length} chars`,
    )
    record(
      `${route} offers a real address rather than only an apology`,
      body.mailto > 0,
      `${body.mailto} mailto link(s)`,
    )
    /*
      A date, a version number, a retention period in days: every one of those would be a fact
      about a document nobody has written. None should be on the page until the text is.
    */
    record(
      `${route} states no date, version, or period it cannot support`,
      body.numbers.length === 0,
      body.numbers.length ? `numbers found: ${body.numbers.join(', ')}` : 'zero digits rendered',
    )
  }
  await context.close()
}

await harness.finish()
