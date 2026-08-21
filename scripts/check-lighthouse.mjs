/**
 * Lighthouse, on every route. Development only, run against a production build.
 *
 * **Accessibility and Best Practices only. Performance and SEO are deliberately not scored.**
 *
 * Performance is not reported because this environment cannot produce an honest number: it is
 * headless Chromium on a software renderer with no GPU, where the same page measures 16.7 to
 * 24.7ms median frame time depending on the run. A Performance score from here would be a
 * precise looking figure that says nothing about a real device, which is worse than the gap it
 * appears to fill. The plan's two Performance budgets stay open, and closing them needs
 * hardware. See `docs/BLOCKERS.md` items 10 and 11.
 *
 * SEO is left out for a narrower reason: several of its audits check for a canonical pointing
 * at a real origin and for a crawlable robots policy, and the production domain does not exist
 * yet. It would score the absence of item 1, not the quality of the markup.
 *
 * Accessibility and Best Practices are device independent, so they are real numbers here.
 *
 * Usage: bash scripts/verify-server.sh, then
 *   SHOOT_BASE=http://localhost:3100 node scripts/check-lighthouse.mjs
 */

import { chromium } from 'playwright'
import lighthouse from 'lighthouse'
import { assertBuildFresh } from './build-fresh.mjs'

const BASE = process.env.SHOOT_BASE ?? 'http://localhost:3000'

/*
  Refuse to measure a build older than the source. See scripts/build-fresh.mjs.
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

const CATEGORIES = ['accessibility', 'best-practices']

/** The plan sets Accessibility at 100 on every route. Best Practices has no stated target. */
const REQUIRED = { accessibility: 100 }

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
        onlyCategories: CATEGORIES,
        /*
          Desktop, unthrottled. Throttling shapes Performance, which is not being scored, and
          leaving it on only makes the run slower and the accessibility tree no different.
        */
        formFactor: 'desktop',
        screenEmulation: { mobile: false, disabled: true },
        throttlingMethod: 'provided',
      },
    },
  )

  const { categories, audits } = runnerResult.lhr
  const row = { route }
  for (const category of CATEGORIES) {
    const result = categories[category]
    const score = Math.round((result.score ?? 0) * 100)
    row[category] = score
    row[`${category}Failures`] = failuresIn(result, audits)
  }
  table.push(row)
}

await browser.close()

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
console.log('Performance and SEO are not scored here. See the header of this file.')

const failed = results.filter((result) => !result.pass)
console.log(`\n${results.length - failed.length}/${results.length} checks passed`)
if (failed.length > 0) process.exitCode = 1
