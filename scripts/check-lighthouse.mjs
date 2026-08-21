/**
 * Lighthouse. Two modes, decided by where `SHOOT_BASE` points.
 *
 * **Local, against the verification server: Accessibility and Best Practices only.**
 * Performance is not scored there because a local server cannot produce an honest number:
 * nothing is served over a real network, and the plan's budgets are about what a visitor
 * gets. A precise looking figure from localhost is worse than the gap it appears to fill.
 *
 * **Remote, against a deployment: Performance as well, mobile and desktop.**
 * The plan sets two budgets, in sections 602 and 603: mobile at 90 or above, which is the
 * Reduced tier because Lighthouse's mobile emulation reports a coarse pointer and
 * `useRenderTier` sends coarse pointers to Reduced, and desktop at 85 or above, which is the
 * Full tier with WebGL. Which tier each form factor actually resolved to is measured and
 * reported rather than assumed, because reporting a Reduced tier number that was really Full
 * would be a false claim about the thing the whole tiering argument rests on.
 *
 * **What this still does not measure:** sustained frame rate while scrolling. Lighthouse
 * scores page load. `docs/BLOCKERS.md` item 11 is about holding 60fps on a mid range laptop,
 * which no Lighthouse run of any kind reports, and which stays open after this.
 *
 * SEO is left out in both modes for a narrower reason: several of its audits check a canonical
 * against a real origin, and the production domain does not exist yet, so it would score the
 * absence of BLOCKERS item 1 rather than the quality of the markup.
 *
 * Usage, local:
 *   bash scripts/verify-server.sh
 *   SHOOT_BASE=http://localhost:3100 node scripts/check-lighthouse.mjs
 *
 * Usage, against a protected Vercel deployment. The share URL comes from Vercel and carries a
 * one day token; the cookie it sets is reused as a header so the audited URL has no redirect
 * and no query string in it:
 *   SHOOT_BASE=https://example.vercel.app  *   VERCEL_SHARE_URL='https://example.vercel.app/?_vercel_share=...'  *   node scripts/check-lighthouse.mjs
 */

import { chromium } from 'playwright'
import lighthouse from 'lighthouse'
import { assertBuildFresh } from './build-fresh.mjs'

const BASE = process.env.SHOOT_BASE ?? 'http://localhost:3000'

/*
  Refuse to measure a build older than the source. A no op against a deployment, which serves
  whatever was pushed rather than a local directory. See scripts/build-fresh.mjs.
*/
assertBuildFresh({ base: BASE })

/** Every route a visitor can reach. `/tiers` and `/tokens` are development harnesses. */
const ROUTES = [
  '/',
  '/work',
  '/work/ecommerce-garments',
  '/studio',
  '/contact',
  '/privacy',
  '/terms',
]

/** True when pointed at a deployment rather than the local verification server. */
const IS_REMOTE = !/localhost|127\.0\.0\.1/.test(BASE)

/** The plan sets Accessibility at 100 on every route. Best Practices has no stated target. */
const REQUIRED = { accessibility: 100 }

/**
 * The plan's Performance budgets, sections 602 and 603. Only meaningful against a deployment.
 *
 * `formFactor` is the lever that also picks the tier: Lighthouse's mobile emulation reports a
 * coarse pointer, and `useRenderTier` sends every coarse pointer to Reduced before any
 * capability test, so mobile measures the Reduced tier and desktop measures Full.
 */
const PERFORMANCE_BUDGETS = [
  { formFactor: 'mobile', expectedTier: 'reduced', minimum: 90 },
  { formFactor: 'desktop', expectedTier: 'full', minimum: 85 },
]

/**
 * Lighthouse's own desktop preset, written out rather than imported from its internals.
 * Mobile uses Lighthouse's defaults, which are the throttled Moto G profile the mobile budget
 * is written against.
 */
const DESKTOP_SETTINGS = {
  formFactor: 'desktop',
  screenEmulation: { mobile: false, width: 1350, height: 940, deviceScaleFactor: 1, disabled: false },
  throttling: {
    rttMs: 40,
    throughputKbps: 10 * 1024,
    cpuSlowdownMultiplier: 1,
    requestLatencyMs: 0,
    downloadThroughputKbps: 0,
    uploadThroughputKbps: 0,
  },
}

const results = []
function record(name, pass, detail = '') {
  results.push({ name, pass, detail })
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? `\n        ${detail}` : ''}`)
}

/*
  Playwright's own Chromium, launched with a debugging port for Lighthouse to drive. No second
  browser download, and the binary under test is the one every other harness uses.
*/
const browser = await chromium.launch({ args: ['--remote-debugging-port=9222'] })
const port = 9222

/**
 * The auth cookie for a protected deployment, sent as a header on every Lighthouse request.
 *
 * Auditing the share URL directly would work and would be wrong: the token is a query string
 * and the first hop is a redirect, so the measured URL would not be the URL a visitor loads
 * and the redirect would land in the metrics. Loading it once here and reusing the cookie it
 * sets means Lighthouse audits the clean URL with no redirect in front of it.
 */
async function authHeader() {
  const shareUrl = process.env.VERCEL_SHARE_URL
  if (!shareUrl) return null
  const context = await browser.newContext()
  const page = await context.newPage()
  await page.goto(shareUrl, { waitUntil: 'load', timeout: 60_000 })
  const cookies = await context.cookies()
  await context.close()
  const jwt = cookies.find((cookie) => cookie.name === '_vercel_jwt')
  return jwt ? { Cookie: `${jwt.name}=${jwt.value}` } : null
}

const extraHeaders = IS_REMOTE ? await authHeader() : null

if (IS_REMOTE && !extraHeaders) {
  console.error(
    'This deployment needs an auth cookie and none was obtained. Set VERCEL_SHARE_URL to a ' +
      'Vercel share link, or the run will score the login redirect rather than the site.',
  )
  process.exitCode = 1
}

/**
 * Which tier the page resolved to under a given form factor, read from what the page publishes.
 *
 * Measured rather than assumed. The whole point of reporting a mobile number as the Reduced
 * tier is that it was the Reduced tier, and `useRenderTier` decides that from the pointer, not
 * from the viewport.
 */
async function tierUnder(formFactor) {
  const mobile = formFactor === 'mobile'
  const context = await browser.newContext({
    viewport: mobile ? { width: 412, height: 823 } : { width: 1350, height: 940 },
    hasTouch: mobile,
    isMobile: mobile,
    ...(extraHeaders ? { extraHTTPHeaders: extraHeaders } : {}),
  })
  const page = await context.newPage()
  await page.goto(`${BASE}/`, { waitUntil: 'load', timeout: 60_000 })
  await page.waitForTimeout(4000)
  const resolved = await page.evaluate(() => ({
    tier: document.querySelector('[data-tier]')?.getAttribute('data-tier') ?? null,
    canvases: document.querySelectorAll('canvas').length,
    pointerFine: window.matchMedia('(pointer: fine)').matches,
  }))
  await context.close()
  return resolved
}

/** Audits that failed, with the elements Lighthouse blamed, so a failure is actionable. */
function failuresIn(categoryResult, audits) {
  const out = []
  for (const ref of categoryResult.auditRefs) {
    const audit = audits[ref.id]
    if (!audit || audit.score === null || audit.score >= 1) continue
    const items = audit.details?.items ?? []
    const where = items
      .slice(0, 3)
      .map((item) => item.node?.selector ?? item.node?.snippet ?? '')
      .filter(Boolean)
      .join(' | ')
    out.push(`${audit.id}${where ? ` at ${where}` : ''}`)
  }
  return out
}

const table = []

for (const route of ROUTES) {
  const runnerResult = await lighthouse(
    `${BASE}${route}`,
    { port, output: 'json', logLevel: 'error' },
    {
      extends: 'lighthouse:default',
      settings: {
        /*
          The per route sweep is Accessibility and Best Practices only, on every route, even
          when the run is remote. Performance is scored separately below, on the homepage,
          under the two form factors the budgets are written for. Running the full performance
          suite on nine routes twice would take a long time to say the same thing.
        */
        onlyCategories: ['accessibility', 'best-practices'],
        /*
          Desktop, unthrottled. Throttling shapes Performance, which is not scored here, and
          leaving it on only makes the run slower and the accessibility tree no different.
        */
        formFactor: 'desktop',
        screenEmulation: { mobile: false, disabled: true },
        throttlingMethod: 'provided',
        ...(extraHeaders ? { extraHeaders } : {}),
        /* Keep the auth cookie. Lighthouse clears storage before a run by default. */
        disableStorageReset: Boolean(extraHeaders),
      },
    },
  )

  const { categories, audits } = runnerResult.lhr
  const row = { route }
  for (const category of ['accessibility', 'best-practices']) {
    const result = categories[category]
    const score = Math.round((result.score ?? 0) * 100)
    row[category] = score
    row[`${category}Failures`] = failuresIn(result, audits)
  }
  table.push(row)
}

console.log('\nroute                             accessibility  best-practices')
for (const row of table) {
  console.log(
    `${row.route.padEnd(33)} ${String(row.accessibility).padStart(13)} ${String(row['best-practices']).padStart(15)}`,
  )
}
console.log('')

for (const row of table) {
  record(
    `${row.route} scores Accessibility ${REQUIRED.accessibility}`,
    row.accessibility >= REQUIRED.accessibility,
    row.accessibilityFailures.length
      ? `scored ${row.accessibility}. Failing audits: ${row.accessibilityFailures.join('; ')}`
      : `scored ${row.accessibility}, no failing audits`,
  )
}

/*
  Best Practices is reported, not gated. The build plan sets no target for it, and inventing a
  threshold here would be a second source of truth for a number nobody agreed.

  The homepage's 96 is an artifact of running off platform, checked rather than assumed: the
  only failing audit is `errors-in-console`, and the only two entries are 404s for
  `/_vercel/insights/script.js` and `/_vercel/speed-insights/script.js`. Those files are served
  by Vercel's edge and do not exist on a local server, so the score would be 100 when deployed
  and cannot be verified from here.
*/
const worstPractices = table.reduce(
  (worst, row) => (row['best-practices'] < worst['best-practices'] ? row : worst),
  table[0],
)
console.log(
  `\nBest Practices, reported and not gated: lowest is ${worstPractices['best-practices']} at ` +
    `${worstPractices.route}` +
    (worstPractices['best-practicesFailures'].length
      ? `, failing ${worstPractices['best-practicesFailures'].join('; ')}`
      : ', no failing audits'),
)

/*
  Performance, only against a deployment, only on the homepage, and under the two form factors
  the plan writes its budgets for. The homepage is the right page to measure: it is the heaviest
  route on the site, the only one carrying WebGL, and the one a visitor arrives on.
*/
if (IS_REMOTE && extraHeaders) {
  console.log('\nPerformance, against the deployment\n')
  for (const budget of PERFORMANCE_BUDGETS) {
    const resolved = await tierUnder(budget.formFactor)

    const runner = await lighthouse(
      `${BASE}/`,
      { port, output: 'json', logLevel: 'error' },
      {
        extends: 'lighthouse:default',
        settings: {
          onlyCategories: ['performance'],
          ...(budget.formFactor === 'desktop' ? DESKTOP_SETTINGS : { formFactor: 'mobile' }),
          extraHeaders,
          disableStorageReset: true,
        },
      },
    )

    const { categories, audits } = runner.lhr
    const score = Math.round((categories.performance.score ?? 0) * 100)
    const metric = (id) => audits[id]?.displayValue ?? 'n/a'

    /*
      The tier is part of the criterion, not colour. A mobile score of 90 means nothing as a
      Reduced tier number if the page actually served the Full tier.
    */
    const tierMatched = resolved.tier === budget.expectedTier
    record(
      `${budget.formFactor} Performance is ${budget.minimum} or above on the ${budget.expectedTier} tier`,
      score >= budget.minimum && tierMatched,
      `scored ${score}, needed ${budget.minimum}. Tier resolved to ${resolved.tier}` +
        `${tierMatched ? '' : `, EXPECTED ${budget.expectedTier}`}` +
        ` with ${resolved.canvases} canvas(es), pointer:fine ${resolved.pointerFine}. ` +
        `FCP ${metric('first-contentful-paint')}, LCP ${metric('largest-contentful-paint')}, ` +
        `TBT ${metric('total-blocking-time')}, CLS ${metric('cumulative-layout-shift')}, ` +
        `SI ${metric('speed-index')}`,
    )
  }
  console.log(
    '\nSustained frame rate while scrolling is still not measured. Lighthouse scores page ' +
      'load. See docs/BLOCKERS.md item 11.',
  )
} else {
  console.log('Performance and SEO are not scored here. See the header of this file.')
}

/* Closed here rather than after the route sweep: the performance runs need it too. */
await browser.close()

const failed = results.filter((result) => !result.pass)
console.log(`\n${results.length - failed.length}/${results.length} checks passed`)
if (failed.length > 0) process.exitCode = 1
