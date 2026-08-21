/**
 * `/studio` route verification. Development only, run against a production build.
 *
 * The route level checks come from `scripts/route-checks.mjs` so they exist once. What is
 * here is mostly about absence, which is unusual for a harness and is the point of this
 * route: no team section, no founding year, no headcount, no years in business, and the name
 * explained exactly once across the whole site.
 *
 * Absence is asserted on rendered text, not on the absence of a component import. A section
 * can be imported and render nothing, and a component can be deleted while its copy survives
 * in a content module, so the only honest question is what reaches the page.
 *
 * Usage: bash scripts/verify-server.sh, then
 *   SHOOT_BASE=http://localhost:3100 node scripts/check-studio.mjs
 */

import { assertBuildFresh } from './build-fresh.mjs'
import { createHarness } from './route-checks.mjs'

const BASE = process.env.SHOOT_BASE ?? 'http://localhost:3000'

/*
  Refuse to measure a build older than the source. See scripts/build-fresh.mjs.
*/
assertBuildFresh({ base: BASE })

const ROUTE = '/studio'

/** Every route the site links to, so the name can be checked across all of them. */
const ALL_ROUTES = ['/', '/studio', '/work', '/work/ecommerce-garments']

const harness = createHarness({ base: BASE })
const { record, open } = harness
await harness.launch()

// ---------------------------------------------------------------- shared route checks
await harness.checkHead(ROUTE)
await harness.checkKeyboardAndTargets(ROUTE)
await harness.checkReducedMotion(ROUTE)
await harness.checkOverflow(ROUTE)

// ------------------------------------------------------- what the route does not claim
{
  const { context, page } = await open(1440, 900)
  await page.goto(`${BASE}${ROUTE}`, { waitUntil: 'load' })
  await page.waitForTimeout(2000)

  const body = await page.evaluate(() => {
    const main = document.querySelector('main')
    const text = (main?.innerText ?? '').replace(/\s+/g, ' ')
    return {
      text,
      /** Section labels the page publishes about itself. */
      labels: Array.from(main?.querySelectorAll('section[aria-label]') ?? []).map(
        (section) => section.getAttribute('aria-label') ?? '',
      ),
      numbers: [...text.matchAll(/\d[\d,.%]*/g)].map((match) => match[0]),
      images: main?.querySelectorAll('img').length ?? 0,
      placeholders: document.querySelectorAll('main [data-placeholder]').length,
    }
  })

  /*
    A team section would announce itself in one of three ways: a section label, a heading, or
    a portrait. All three are checked, because a page can have a team block with no label on
    it and a headshot is a person whether or not the word "team" appears.
  */
  const teamLabels = body.labels.filter((label) => /team|people|who we are|founders?/i.test(label))
  const teamWords = body.text.match(/\b(our team|the team|meet the|founder|co-founder|headshot)\b/gi)
  record(
    'there is no team section, by label, by heading, or by portrait',
    teamLabels.length === 0 && !teamWords && body.images === 0,
    `sections: ${body.labels.join(' | ')}. ` +
      `team-ish labels ${teamLabels.length}, team-ish phrases ${teamWords?.length ?? 0}, ` +
      `${body.images} images in main`,
  )

  /*
    Numbers on this route are the risk. A founding year, a headcount, and a years-in-business
    figure are all numbers, and none of those facts exists. The process indexes 01 to 04 are
    structure rather than claims, and the phone numbers are verified facts from brand.md, so
    those are the only digits allowed to reach the page.
  */
  const allowed = /^(01|02|03|04|91|86603|33165|82176|18082)$/
  const unexplained = body.numbers.filter((value) => !allowed.test(value))
  record(
    'no founding year, headcount, or years in business is rendered',
    unexplained.length === 0,
    unexplained.length
      ? `unexplained numbers: ${unexplained.join(', ')}`
      : `digits on the page: ${[...new Set(body.numbers)].join(', ')}, all process indexes or ` +
        `phone numbers from docs/brand.md`,
  )

  /*
    This route stands in for nothing. Every other Phase 5 page renders generated visuals, and
    this one renders only text that is traceable to a source, so there is nothing on it to
    tag. Scoped to main deliberately: the header's wordmark is an interim placeholder site
    wide and says nothing about this route.
  */
  record(
    'the route renders no placeholder in main, because nothing on it stands in for a fact',
    body.placeholders === 0,
    `${body.placeholders} elements carry data-placeholder inside main`,
  )
  await context.close()
}

// -------------------------------------------------- the name, once, and never with "but"
{
  const { context, page } = await open(1440, 900)
  const mentions = []
  for (const route of ALL_ROUTES) {
    await page.goto(`${BASE}${route}`, { waitUntil: 'load' })
    await page.waitForTimeout(1500)
    const found = await page.evaluate(() => {
      /*
        The whole document, not just main: the rule is that the site explains the name once,
        and a header or footer is part of the site.
      */
      const text = (document.body.innerText ?? '').replace(/\s+/g, ' ')
      const sentences = text.split(/(?<=[.!?])\s+/)
      const about = sentences.filter((sentence) => /old english|sounds like weird/i.test(sentence))
      return { count: about.length, sentences: about }
    })
    if (found.count > 0) mentions.push({ route, ...found })
  }

  const total = mentions.reduce((sum, entry) => sum + entry.count, 0)
  record(
    'the name is explained on exactly one route',
    mentions.length === 1 && mentions[0].route === ROUTE,
    mentions.length
      ? `${total} sentence(s) across ${mentions.map((entry) => entry.route).join(', ')}`
      : 'the name is explained nowhere, which is also wrong',
  )

  const withBut = mentions.flatMap((entry) => entry.sentences).filter((sentence) => /\bbut\b/i.test(sentence))
  record(
    'no sentence about the name contains the word "but"',
    withBut.length === 0,
    withBut.length ? withBut.join(' | ') : `checked: ${mentions[0]?.sentences.join(' ') ?? '(none)'}`,
  )
  await context.close()
}

// ----------------------------------------------- capabilities and process match the source
{
  const { context, page } = await open(1440, 900)
  await page.goto(`${BASE}${ROUTE}`, { waitUntil: 'load' })
  await page.waitForTimeout(1500)
  const studioText = await page.evaluate(
    () => (document.querySelector('main')?.innerText ?? '').replace(/\s+/g, ' '),
  )

  /*
    The homepage is the reference, not a list typed in here. If /studio described a service
    differently from the homepage, one of the two would be wrong and a copied list would hide
    which.
  */
  await page.goto(`${BASE}/`, { waitUntil: 'load' })
  await page.waitForTimeout(2500)
  const home = await page.evaluate(() => {
    const text = (document.querySelector('main')?.innerText ?? '').replace(/\s+/g, ' ')
    return {
      steps: ['Understand', 'Direct', 'Make', 'Hand over'].filter((step) => text.includes(step)),
      clusters: ['Build', 'Reach', 'Show', 'Stage'].filter((name) =>
        new RegExp(`\\b${name}\\b`).test(text),
      ),
    }
  })
  const missingSteps = home.steps.filter((step) => !studioText.includes(step))
  const missingClusters = home.clusters.filter((name) => !new RegExp(`\\b${name}\\b`).test(studioText))
  record(
    'the capabilities recap and the process carry the same names the homepage does',
    home.steps.length === 4 &&
      home.clusters.length === 4 &&
      missingSteps.length === 0 &&
      missingClusters.length === 0,
    `homepage has ${home.steps.length} steps and ${home.clusters.length} clusters. ` +
      `Missing from /studio: steps ${missingSteps.join(', ') || 'none'}, ` +
      `clusters ${missingClusters.join(', ') || 'none'}`,
  )
  await context.close()
}

// ------------------------------------------------------- location stops where the data does
{
  const { context, page } = await open(1440, 900)
  await page.goto(`${BASE}${ROUTE}`, { waitUntil: 'load' })
  await page.waitForTimeout(1500)
  const address = await page.evaluate(() => {
    const element = document.querySelector('main address')
    return {
      present: Boolean(element),
      text: (element?.innerText ?? '').replace(/\s+/g, ' ').trim(),
    }
  })
  /* A street address would be a fact nobody supplied. City, region, country is all there is. */
  const hasStreet = /\d+[a-z]?[, ]|road|street|lane|floor|suite|block|cross|main\b/i.test(
    address.text,
  )
  record(
    'the address renders city, region and country, and no street',
    address.present && address.text.length > 0 && !hasStreet,
    `address reads "${address.text}"`,
  )
  await context.close()
}

await harness.finish()
