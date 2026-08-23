/**
 * `/work/[slug]` template verification. Development only, run against a production build.
 *
 * The route level checks come from `scripts/route-checks.mjs` so they exist once. What is
 * here is what only this template can be asked: that a project with no outcome data renders
 * no outcome section rather than an empty one, that the meta row omits fields it does not
 * have, and that every project's page actually resolves.
 *
 * Usage: bash scripts/verify-server.sh, then
 *   SHOOT_BASE=http://localhost:3100 node scripts/check-case-study.mjs
 */

import { assertBuildFresh } from './build-fresh.mjs'
import { createHarness } from './route-checks.mjs'

const BASE = process.env.SHOOT_BASE ?? 'http://localhost:3000'

/*
  Refuse to measure a build older than the source. See scripts/build-fresh.mjs.
*/
assertBuildFresh({ base: BASE })

const harness = createHarness({ base: BASE })
const { record, open } = harness
await harness.launch()

/*
  The slugs come from the index page, not from a list typed into this file. A copied list is
  a second source of truth that goes stale silently, and this one would go stale the first
  time a project is added. See CLAUDE.md, Verification.
*/
const slugs = await (async () => {
  const { context, page } = await open(1440, 900)
  await page.goto(`${BASE}/work`, { waitUntil: 'load' })
  await page.waitForTimeout(2000)
  const found = await page.evaluate(() =>
    Array.from(document.querySelectorAll('article.work-card a'))
      .map((link) => link.getAttribute('href') ?? '')
      .filter(Boolean),
  )
  await context.close()
  return found
})()

record(
  'the index publishes at least one case study to test',
  slugs.length > 0,
  `${slugs.length} slugs from /work: ${slugs.join(', ')}`,
)

const first = slugs[0]

// ---------------------------------------------------------------- shared route checks
await harness.checkHead(first)
await harness.checkKeyboardAndTargets(first)
/*
  Under reduced motion the route still has to be composed, which used to be asserted by
  counting placeholders. The case study visuals are real image files now and carry no
  `data-placeholder`, so that count is permanently zero and the criterion passed on nothing.
  Loaded images are the equivalent evidence: a composed case study has its hero and its three
  visuals decoded. Four is measured rather than assumed, at the 1440x900 this opens and
  inside the wait it already had, with no scroll.
*/
await harness.checkReducedMotion(first, {
  expect: (state) => state.loadedImages >= 4,
  describe: (state) => `${state.loadedImages} loaded case study images`,
})
await harness.checkOverflow(first)

// -------------------------------------------------------- every case study page resolves
{
  const { context, page } = await open(1440, 900)
  const statuses = []
  for (const slug of slugs) {
    const response = await page.request.get(`${BASE}${slug}`)
    statuses.push({ slug, status: response.status() })
  }
  const broken = statuses.filter((entry) => entry.status >= 400)
  record(
    'every project on the index has a case study page that resolves',
    broken.length === 0 && statuses.length === slugs.length,
    broken.length
      ? broken.map((entry) => `${entry.status} ${entry.slug}`).join(', ')
      : `${statuses.length} pages, all 200`,
  )
  await context.close()
}

// ------------------------------------------ no outcome data means no outcome section
{
  const { context, page } = await open(1440, 900)
  const pages = []
  for (const slug of slugs) {
    await page.goto(`${BASE}${slug}`, { waitUntil: 'load' })
    await page.waitForTimeout(1500)
    pages.push(
      await page.evaluate((slugValue) => {
        const main = document.querySelector('main')
        const text = (main?.innerText ?? '').replace(/\s+/g, ' ')
        /*
          Read the section labels the page publishes rather than looking for a class name, so
          this cannot pass because a selector went stale.
        */
        const labels = Array.from(main?.querySelectorAll('section[aria-label]') ?? []).map(
          (section) => section.getAttribute('aria-label') ?? '',
        )
        return {
          slug: slugValue,
          labels,
          hasOutcomeSection: labels.some((label) => /outcome/i.test(label)),
          /** Any digit in the body is a number claimed about the project. */
          numbers: [...text.matchAll(/\d[\d,.%]*/g)].map((match) => match[0]),
          metaTerms: Array.from(main?.querySelectorAll('dt') ?? []).map(
            (term) => term.textContent?.trim() ?? '',
          ),
          /** A meta entry rendered with no value beside it is the failure to catch. */
          emptyMetaValues: Array.from(main?.querySelectorAll('dd') ?? []).filter(
            (value) => (value.textContent ?? '').trim().length === 0,
          ).length,
          /*
            Images the browser actually decoded, not elements present: `naturalWidth` is zero
            for a broken src, an empty src and an image that never loaded, all three of which
            satisfy an element count. Replaces a `data-placeholder` count that ccd35a0 left
            permanently zero here when the generated imagery replaced Placeholder.
          */
          loadedImages: Array.from(document.querySelectorAll('main img')).filter(
            (img) => img.complete && img.naturalWidth > 0,
          ).length,
          h1: document.querySelector('h1')?.textContent?.trim() ?? '',
        }
      }, slug),
    )
  }

  const withOutcome = pages.filter((entry) => entry.hasOutcomeSection)
  record(
    'a project with no outcome data renders no outcome section at all',
    withOutcome.length === 0,
    withOutcome.length
      ? `${withOutcome.map((entry) => entry.slug).join(', ')} rendered one`
      : `${pages.length} pages, none has an outcome section. Sections on the first: ` +
          `${pages[0].labels.join(' | ')}`,
  )

  const numbered = pages.filter((entry) => entry.numbers.length > 0)
  record(
    'no case study renders a number about the project',
    numbered.length === 0,
    numbered.length
      ? numbered.map((entry) => `${entry.slug}: ${entry.numbers.join(', ')}`).join(' | ')
      : `${pages.length} pages, zero digits rendered in main`,
  )

  const withEmpty = pages.filter((entry) => entry.emptyMetaValues > 0)
  record(
    'the meta row omits a field it does not have rather than showing an empty label',
    withEmpty.length === 0,
    withEmpty.length
      ? withEmpty.map((entry) => `${entry.slug}: ${entry.emptyMetaValues} empty`).join(', ')
      : `meta labels rendered: ${pages[0].metaTerms.join(', ') || '(none)'}`,
  )

  /*
    Every slot filled, asserted on the browser's own decode rather than on a tag. These are
    generated stand-ins pending real photography and docs/placeholders.md records them as
    such: something can be a stand-in without being a Placeholder, so the evidence that the
    route is composed is the image, not the attribute.
  */
  const unfilled = pages.filter((entry) => entry.loadedImages < 4)
  record(
    'every case study renders all four of its generated visuals',
    unfilled.length === 0,
    unfilled.length
      ? unfilled.map((entry) => `${entry.slug}: ${entry.loadedImages} of 4`).join(', ')
      : `${pages[0].loadedImages} decoded on the first page, ${pages.length} pages checked`,
  )

  const titled = pages.every((entry) => entry.h1.length > 0)
  record(
    'every case study renders its own title as the h1',
    titled && new Set(pages.map((entry) => entry.h1)).size === pages.length,
    pages.map((entry) => `"${entry.h1}"`).join(', '),
  )
  await context.close()
}

// -------------------------------------------------------- previous and next actually move
{
  const { context, page } = await open(1440, 900)
  await page.goto(`${BASE}${slugs[0]}`, { waitUntil: 'load' })
  await page.waitForTimeout(1500)
  const links = await page.evaluate(() =>
    Array.from(document.querySelectorAll('main a[href^="/work/"]'))
      .map((link) => link.getAttribute('href') ?? '')
      .filter(Boolean),
  )
  const leavesThisPage = links.filter((href) => href !== slugs[0])
  record(
    'the first case study links onward to another project',
    leavesThisPage.length > 0,
    `links from ${slugs[0]}: ${links.join(', ') || '(none)'}`,
  )
  await context.close()
}

// ------------------------------------------------- an unknown slug is a 404, not a page
{
  const { context, page } = await open(1440, 900)
  const response = await page.request.get(`${BASE}/work/not-a-real-project`)
  record(
    'an unknown slug returns 404 rather than an empty template',
    response.status() === 404,
    `status ${response.status()}`,
  )
  await context.close()
}

await harness.finish()
