/**
 * `/work` route verification. Development only, run against a production build.
 *
 * Follows the six rules carried out of the thread work, per Phase 5 brief section 2. In
 * particular: nothing here forces a tier, so the page resolves the way the emulated device
 * would, and the card count is compared against what the page renders rather than against a
 * number copied into this file.
 *
 * Usage: bash scripts/verify-server.sh, then
 *   SHOOT_BASE=http://localhost:3100 node scripts/check-work.mjs
 */

import { chromium } from 'playwright'
import { assertBuildFresh } from './build-fresh.mjs'

const BASE = process.env.SHOOT_BASE ?? 'http://localhost:3000'

/*
  Refuse to measure a build older than the source. See scripts/build-fresh.mjs.
*/
assertBuildFresh({ base: BASE })

const results = []
function record(name, pass, detail = '') {
  results.push({ name, pass, detail })
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? `\n        ${detail}` : ''}`)
}

/**
 * Routes Phase 5 has not built yet, plus the analytics scripts that only exist in prod.
 *
 * `/work/<slug>` is in here because Next prefetches every card link, and the detail route is
 * the next commit in the brief's order. It is not swept under the rug: the criterion below,
 * "every card link resolves", fetches those URLs and reports them by name, so the state is
 * stated once and precisely rather than twice and vaguely. When the detail route lands that
 * criterion turns green on its own and this pattern can lose its `work` branch.
 */
const EXPECTED_404 =
  /_vercel\/(insights|speed-insights)|\/(studio|contact|privacy|terms)(\?_rsc=|\/|$)|\/work\/[a-z-]+/

const CHIP_GROUP = '[aria-label="Filter work by cluster"] button'

const browser = await chromium.launch()

async function open(width, height, reducedMotion = 'no-preference') {
  const context = await browser.newContext({
    viewport: { width, height },
    reducedMotion,
    hasTouch: width < 600,
    isMobile: width < 600,
  })
  const page = await context.newPage()
  const problems = []
  page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`))
  page.on('console', (message) => {
    const text = message.text()
    if (message.type() !== 'error' && message.type() !== 'warning') return
    if (/Failed to load resource|Vercel (Web Analytics|Speed Insights)/.test(text)) return
    if (/GL Driver Message|GPU stall/.test(text)) return
    problems.push(`${message.type()}: ${text}`)
  })
  page.on('response', (response) => {
    if (response.status() >= 400 && !EXPECTED_404.test(response.url())) {
      problems.push(`${response.status()} ${response.url()}`)
    }
  })
  return { context, page, problems }
}

// --------------------------------------------------------- metadata, landmarks, console
{
  const { context, page, problems } = await open(1440, 900)
  await page.goto(`${BASE}/work`, { waitUntil: 'load' })
  await page.waitForTimeout(2500)

  const head = await page.evaluate(() => ({
    title: document.title,
    description: document.querySelector('meta[name="description"]')?.getAttribute('content') ?? '',
    canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? '',
    h1Count: document.querySelectorAll('h1').length,
    h1: document.querySelector('h1')?.textContent?.trim() ?? '',
    main: document.querySelectorAll('main').length,
    header: document.querySelectorAll('header').length,
    footer: document.querySelectorAll('footer').length,
  }))
  record(
    'the route has its own title and description, and exactly one h1',
    head.title.length > 0 &&
      !head.title.startsWith('WYRD Designs, digital') &&
      head.description.length > 0 &&
      head.h1Count === 1,
    `title "${head.title}", h1 "${head.h1}", description ${head.description.length} chars`,
  )
  record(
    'the canonical URL is absolute and no domain is hardcoded in it',
    head.canonical.startsWith('http') && !/wyrddesigns\.in/.test(head.canonical),
    `canonical ${head.canonical || '(none)'}`,
  )
  record(
    'one main, one header, one footer',
    head.main === 1 && head.header === 1 && head.footer === 1,
    `main ${head.main}, header ${head.header}, footer ${head.footer}`,
  )
  record('no console problems on the route', problems.length === 0, problems.join(' | '))
  await context.close()
}

// ------------------------------------------------- the grid is the content, not padded
{
  const { context, page } = await open(1440, 900)
  await page.goto(`${BASE}/work`, { waitUntil: 'load' })
  await page.waitForTimeout(2000)

  const grid = await page.evaluate((chipGroup) => {
    const cards = Array.from(document.querySelectorAll('article.work-card'))
    return {
      cards: cards.length,
      slugs: cards.map((card) => card.querySelector('a')?.getAttribute('href') ?? ''),
      placeholders: document.querySelectorAll('[data-placeholder]').length,
      chips: Array.from(document.querySelectorAll(chipGroup)).map((button) => ({
        label: button.textContent?.trim() ?? '',
        disabled: button.disabled,
      })),
    }
  }, CHIP_GROUP)

  /*
    Do the card links actually go anywhere? Asserted on the response, not on the href, since
    an href that reads correctly and 404s is exactly the failure worth catching.
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
  record(
    'every card visual is tagged as a placeholder',
    grid.placeholders >= grid.cards,
    `${grid.placeholders} elements carry data-placeholder against ${grid.cards} cards`,
  )
  const enabled = grid.chips.filter((chip) => !chip.disabled).map((chip) => chip.label)
  const disabled = grid.chips.filter((chip) => chip.disabled).map((chip) => chip.label)
  record(
    'a cluster with no cleared project is a disabled chip, not a route into an empty state',
    grid.chips.length === 5 && disabled.length > 0,
    `${grid.chips.length} chips. Enabled: ${enabled.join(', ')}. Disabled: ${disabled.join(', ') || 'none'}`,
  )
  await context.close()
}

// -------------------------------------------------------------- filtering moves cards
{
  const { context, page } = await open(1440, 900)
  await page.goto(`${BASE}/work`, { waitUntil: 'load' })
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

// -------------------------------------------------- reduced motion renders final state
{
  const { context, page, problems } = await open(1440, 900, 'reduce')
  await page.goto(`${BASE}/work`, { waitUntil: 'load' })
  await page.waitForTimeout(2000)
  const state = await page.evaluate(() => ({
    hiddenReveals: Array.from(document.querySelectorAll('[data-reveal]')).filter(
      (element) => Number(getComputedStyle(element).opacity) < 0.99,
    ).length,
    cards: document.querySelectorAll('article.work-card').length,
    canvases: document.querySelectorAll('canvas').length,
    lenis: Boolean(window.__lenis),
  }))
  record(
    'reduced motion renders the route composed, with nothing mounted',
    state.hiddenReveals === 0 && state.cards > 0 && state.canvases === 0 && !state.lenis,
    `${state.cards} cards, ${state.hiddenReveals} unrevealed, ${state.canvases} canvases, lenis ${state.lenis}`,
  )
  record('no console problems under reduced motion', problems.length === 0, problems.join(' | '))
  await context.close()
}

// --------------------------------------------------------- keyboard, focus, touch size
{
  const { context, page } = await open(1440, 900)
  await page.goto(`${BASE}/work`, { waitUntil: 'load' })
  await page.waitForTimeout(2000)

  const walk = []
  for (let step = 0; step < 24; step += 1) {
    await page.keyboard.press('Tab')
    const stop = await page.evaluate(() => {
      const element = document.activeElement
      if (!element || element === document.body) return null
      const style = getComputedStyle(element)
      const box = element.getBoundingClientRect()
      return {
        tag: element.tagName.toLowerCase(),
        name: (element.getAttribute('aria-label') ?? element.textContent ?? '').trim().slice(0, 24),
        ring: style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) > 0,
        rendered: box.width > 0 && box.height > 0,
      }
    })
    if (stop) walk.push(stop)
  }
  const unrendered = walk.filter((stop) => !stop.rendered)
  const ringless = walk.filter((stop) => !stop.ring)
  record(
    'every keyboard stop is rendered and shows a focus ring',
    walk.length > 0 && unrendered.length === 0 && ringless.length === 0,
    `${walk.length} stops, ${unrendered.length} not rendered, ${ringless.length} without a ring. ` +
      `Order: ${walk.slice(0, 12).map((stop) => stop.name || stop.tag).join(' > ')}`,
  )

  const small = await page.evaluate(() => {
    const out = []
    for (const element of document.querySelectorAll('a, button, input, select, textarea')) {
      const rect = element.getBoundingClientRect()
      /*
        Anything down to a few pixels either way is visually hidden rather than small, the
        skip link included: it renders 1 by 1 until focused and is not a touch target. Same
        exclusion and same reason as check-home.
      */
      if (rect.width <= 4 || rect.height <= 4) continue
      if (rect.height < 44) out.push(`${element.tagName.toLowerCase()} ${Math.round(rect.height)}px`)
    }
    return out
  })
  record('every interactive target clears 44px of height', small.length === 0, small.join(', '))
  await context.close()
}

// ----------------------------------------------------------------- responsive overflow
{
  const widths = [320, 375, 768, 1024, 1440, 1920, 2560]
  const overflowing = []
  for (const width of widths) {
    const { context, page } = await open(width, 900)
    await page.goto(`${BASE}/work`, { waitUntil: 'load' })
    await page.waitForTimeout(1200)
    const over = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1,
    )
    if (over) overflowing.push(width)
    await context.close()
  }
  record(
    'no horizontal scroll from 320px to 2560px',
    overflowing.length === 0,
    overflowing.length
      ? `overflows at ${overflowing.join(', ')}px`
      : `checked ${widths.join(', ')}px`,
  )
}

await browser.close()

const failed = results.filter((result) => !result.pass)
console.log(`\n${results.length - failed.length}/${results.length} checks passed`)
if (failed.length > 0) process.exitCode = 1
