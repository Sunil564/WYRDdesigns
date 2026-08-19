/**
 * Phase 4 home sections verification. Development only, run against a production
 * build.
 *
 * Asserts each Phase 4 criterion in a real browser: every section present and in
 * order, the Thread drawing through all of them at every breakpoint above 1024 and
 * falling back to a straight line below, no section re-triggering its entrance on
 * scroll up, the hover and pointer states, the logo row, and the honest framing
 * rules that matter more than any of it.
 *
 * Usage: npm run build && npm start, then node scripts/check-home.mjs
 */

import { chromium } from 'playwright'

const BASE = process.env.SHOOT_BASE ?? 'http://localhost:3000'
const results = []

function record(name, pass, detail = '') {
  results.push({ name, pass, detail })
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? `\n        ${detail}` : ''}`)
}

const EXPECTED_404 =
  /_vercel\/(insights|speed-insights)|\/(work|studio|contact|privacy|terms)(\?_rsc=|\/|$)/

const browser = await chromium.launch()

async function open(width, height, tier = 'full', reducedMotion = 'no-preference') {
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
    // Driver diagnostics from headless software rendering, not page problems. A
    // real GPU never emits these. Confirmed by running the same page with and
    // without a GPU backend.
    if (/GL Driver Message|GPU stall/.test(text)) return
    problems.push(`${message.type()}: ${text}`)
  })
  page.on('response', (response) => {
    if (response.status() >= 400 && !EXPECTED_404.test(response.url())) {
      problems.push(`${response.status()} ${response.url()}`)
    }
  })
  await page.addInitScript((value) => window.localStorage.setItem('wyrd:tier', value), tier)
  return { context, page, problems }
}

/** Walk the page top to bottom so every scroll trigger and scrub fires. */
async function walk(page, step = 600, settle = 220) {
  const height = await page.evaluate(() => document.documentElement.scrollHeight)
  for (let y = 0; y < height; y += step) {
    await page.evaluate((value) => window.scrollTo(0, value), y)
    await page.waitForTimeout(settle)
  }
  await page.waitForTimeout(600)
}

// ------------------------------------------------------- sections, order, content
{
  const { context, page, problems } = await open(1440, 900)
  await page.goto(`${BASE}/`, { waitUntil: 'load' })
  await page.waitForTimeout(2500)

  const order = await page.evaluate(() =>
    Array.from(document.querySelectorAll('main > section')).map((section) => section.id),
  )
  const expected = [
    'hero',
    'positioning',
    'capabilities',
    'work',
    'clients',
    'process',
    'studio-strip',
    'contact-cta',
  ]
  record(
    'S1 to S8 all render, in the brief order, and S9 is the footer',
    JSON.stringify(order) === JSON.stringify(expected),
    order.join(' > '),
  )

  const footer = await page.evaluate(() => Boolean(document.querySelector('footer')))
  record('S9 footer renders', footer)

  // Copy that is locked by docs/brand.md must appear verbatim.
  const copy = await page.evaluate(() => document.body.innerText)
  const locked = [
    "We don't just build websites. We build everything around them.",
    'Fast, product-led websites and stores, built to be found and built to last.',
    'Rank on Google, and get named by AI answer engines when buyers ask.',
    'A content engine that keeps the brand present every week, not in bursts.',
    'Brand films, product stories and testimonials, shot and cut in-house.',
    'Complex products made simple, in sixty seconds or less.',
    'Identity, positioning and a design system that holds across every touchpoint.',
    'Stall design, collateral and on-ground management, start to finish.',
    'Seasonal pushes and launches, planned, produced and measured.',
  ]
  const missing = locked.filter((line) => !copy.replace(/\s+/g, ' ').includes(line))
  record(
    'every service line is verbatim from docs/brand.md',
    missing.length === 0,
    missing.join(' | '),
  )

  const banned = [
    'craft',
    'bespoke',
    'curated',
    'elevate',
    'unlock',
    'seamless',
    'cutting-edge',
    'passionate about',
    'one-stop',
    'synergy',
    'end-to-end partner',
    'we believe',
  ]
  const hits = banned.filter((phrase) => copy.toLowerCase().includes(phrase))
  record('no banned phrase appears on the page', hits.length === 0, hits.join(' | '))

  // Escapes, not literals, so this file does not itself trip scripts/check-dashes.py.
  const dashPattern = new RegExp('[' + String.fromCodePoint(0x2014, 0x2013) + ']')
  const dashes = await page.evaluate(
    (pattern) => new RegExp(pattern).test(document.body.innerText),
    dashPattern.source,
  )
  record('no em dash or en dash renders anywhere on the page', !dashes)

  // Nothing may claim a number, a year, or a price.
  const numbers = (copy.match(/\b\d[\d,.]*\b/g) ?? []).filter(
    (value) => !['01', '02', '03', '04'].includes(value),
  )
  record(
    'the only numbers on the page are the step and cluster indexes, the phone numbers, and the year',
    numbers.every((value) => /^(86603|33165|82176|18082|91|20\d\d)$/.test(value)),
    numbers.join(' | '),
  )

  record('no unexpected console errors or warnings', problems.length === 0, problems.join(' | '))
  await context.close()
}

// ------------------------------------------------------------------- the Thread
for (const width of [1024, 1440, 1920, 2560]) {
  const { context, page } = await open(width, 900)
  await page.goto(`${BASE}/`, { waitUntil: 'load' })
  await page.waitForTimeout(2000)

  const before = await page.evaluate(() => {
    const bodies = Array.from(document.querySelectorAll('[data-thread-body]'))
    return bodies.map((path) => Number(path.style.strokeDashoffset || 1))
  })

  await walk(page)

  const after = await page.evaluate(() => {
    const bodies = Array.from(document.querySelectorAll('[data-thread-body]'))
    return {
      count: bodies.length,
      offsets: bodies.map((path) => Number(path.style.strokeDashoffset || 1)),
      heads: document.querySelectorAll('[data-thread-head]').length,
    }
  })

  const drawn = after.offsets.filter((offset) => offset < 0.5).length
  record(
    `the Thread branches into four and draws through the page at ${width}px`,
    after.count === 9 && drawn >= 5 && before.every((offset) => offset >= 0.99),
    `${after.count} paths, ${drawn} drawn past halfway, ${after.heads} signal heads`,
  )
  await context.close()
}

for (const width of [375, 768, 1023]) {
  const { context, page } = await open(width, 812)
  await page.goto(`${BASE}/`, { waitUntil: 'load' })
  await page.waitForTimeout(2000)
  await walk(page)

  const state = await page.evaluate(() => {
    const bodies = Array.from(document.querySelectorAll('[data-thread-body]'))
    return {
      count: bodies.length,
      d: bodies[0]?.getAttribute('d') ?? '',
      offset: Number(bodies[0]?.style.strokeDashoffset ?? 1),
    }
  })

  // One path, and its geometry is a straight vertical line: two points, same x.
  const points = state.d.match(/-?\d+(\.\d+)?/g) ?? []
  const straight = points.length === 4 && points[0] === points[2]
  record(
    `below 1024 the Thread is a single straight line at ${width}px`,
    state.count === 1 && straight && state.offset < 0.5,
    `${state.count} path, d="${state.d}", offset=${state.offset}`,
  )
  await context.close()
}

// -------------------------------------------------- entrances do not re-trigger
{
  const { context, page } = await open(1440, 900)
  await page.goto(`${BASE}/`, { waitUntil: 'load' })
  await page.waitForTimeout(2000)
  await walk(page)

  // Everything is in its final state at the bottom of the page.
  const atBottom = await page.evaluate(() =>
    Array.from(document.querySelectorAll('[data-reveal]')).map((element) =>
      element.getAttribute('data-reveal'),
    ),
  )

  // Scroll back to the top, then down again. Nothing may return to its out state.
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(1200)

  const afterScrollUp = await page.evaluate(() =>
    Array.from(document.querySelectorAll('[data-reveal]')).map((element) =>
      element.getAttribute('data-reveal'),
    ),
  )

  const regressed = afterScrollUp.filter(
    (state, index) => atBottom[index] === 'in' && state === 'out',
  )
  record(
    'no section re-triggers its entrance on scroll up',
    regressed.length === 0,
    `${atBottom.filter((s) => s === 'in').length} revealed, ${regressed.length} regressed`,
  )

  const positioningVisible = await page.evaluate(() => {
    const emphasis = document.querySelector('[data-positioning-emphasis]')
    if (!emphasis) return null
    const lines = emphasis.querySelectorAll('div')
    const target = lines.length > 0 ? lines[lines.length - 1] : emphasis
    return Number(getComputedStyle(target).opacity)
  })
  record(
    'S2 emphasis phrase finishes at full opacity',
    positioningVisible !== null && positioningVisible > 0.95,
    `opacity ${positioningVisible}`,
  )
  await context.close()
}

// ------------------------------------------------------------ hover and pointer
{
  const { context, page } = await open(1440, 900)
  await page.goto(`${BASE}/`, { waitUntil: 'load' })
  await page.waitForTimeout(2000)

  const block = page.locator('[data-thread-branch-target]').first()
  await block.scrollIntoViewIfNeeded()
  await page.waitForTimeout(800)

  const restBackground = await block.evaluate((el) => getComputedStyle(el).backgroundColor)
  await block.hover()
  await page.waitForTimeout(500)
  const hoverBackground = await block.evaluate((el) => getComputedStyle(el).backgroundColor)
  const sweep = await block.evaluate((el) => {
    const span = el.querySelector('.capability-sweep')
    return span ? getComputedStyle(span).transform : null
  })
  const indexColour = await block.evaluate((el) => {
    const label = el.querySelector('.label')
    return label ? getComputedStyle(label).color : null
  })

  record(
    'S3 hover lifts surface to surface-2, sweeps the hairline, and turns the index signal',
    restBackground !== hoverBackground &&
      sweep !== null &&
      !/matrix\(0,/.test(sweep ?? '') &&
      indexColour === 'rgb(255, 82, 31)',
    `${restBackground} to ${hoverBackground}, sweep ${sweep}, index ${indexColour}`,
  )

  const pointerVars = await page.evaluate(() => {
    const grid = document.querySelector('.capability-grid')
    if (!grid) return null
    return {
      x: grid.style.getPropertyValue('--pointer-x'),
      opacity: grid.style.getPropertyValue('--pointer-opacity'),
    }
  })
  record(
    'S3 pointer highlight is driven by custom properties, not a repaint',
    Boolean(pointerVars && pointerVars.x && pointerVars.opacity === '1'),
    JSON.stringify(pointerVars),
  )

  const card = page.locator('.work-card').first()
  await card.scrollIntoViewIfNeeded()
  // Park the pointer off the card first, or the rest state is already a hover state.
  await page.mouse.move(4, 4)
  await page.waitForTimeout(800)
  const visualRest = await card.evaluate(
    (el) => getComputedStyle(el.querySelector('.work-card-visual')).transform,
  )
  await card.hover()
  await page.waitForTimeout(700)
  const visualHover = await card.evaluate(
    (el) => getComputedStyle(el.querySelector('.work-card-visual')).transform,
  )
  const titleHover = await card.evaluate(
    (el) => getComputedStyle(el.querySelector('.work-card-title')).transform,
  )
  const cursorLabel = await card.evaluate((el) => {
    const label = el.querySelector('.cursor-label')
    return label ? label.getAttribute('data-active') : null
  })
  record(
    'S4 card hover scales the visual, shifts the title, and shows the VIEW label',
    visualRest !== visualHover &&
      /matrix\(1, 0, 0, 1, 8/.test(titleHover) &&
      cursorLabel === 'true',
    `visual ${visualRest} to ${visualHover}, title ${titleHover}, label ${cursorLabel}`,
  )

  await context.close()
}

// -------------------------------------------------------------------- S5 logos
{
  const { context, page } = await open(1440, 900)
  await page.goto(`${BASE}/`, { waitUntil: 'load' })
  await page.waitForTimeout(1500)

  const logos = await page.evaluate(() => {
    const list = Array.from(document.querySelectorAll('#clients [role="img"]'))
    return list.map((element) => ({
      name: element.getAttribute('aria-label'),
      mask: getComputedStyle(element).maskImage.includes('url'),
      colour: getComputedStyle(element).backgroundColor,
    }))
  })
  record(
    'S5 renders six real client logos as masks in muted, with real names',
    logos.length === 6 &&
      logos.every((logo) => logo.mask && logo.name) &&
      logos.every((logo) => logo.colour === 'rgb(139, 139, 149)'),
    logos.map((logo) => logo.name).join(', '),
  )

  const marquee = await page.evaluate(() => document.querySelectorAll('.marquee').length)
  record(
    'S5 uses a static row below eight logos, not a marquee',
    marquee === 0,
    `${marquee} marquees`,
  )
  await context.close()
}

// ---------------------------------------------------------------- reduced motion
{
  const { context, page, problems } = await open(1440, 900, 'static', 'reduce')
  await page.goto(`${BASE}/`, { waitUntil: 'load' })
  await page.waitForTimeout(2000)

  const state = await page.evaluate(() => ({
    canvases: document.querySelectorAll('canvas').length,
    lenis: Boolean(window.__lenis),
    hiddenReveals: Array.from(document.querySelectorAll('[data-reveal]')).filter(
      (element) => Number(getComputedStyle(element).opacity) < 0.99,
    ).length,
    threadOffsets: Array.from(document.querySelectorAll('[data-thread-body]')).map((path) =>
      path.getAttribute('stroke-dashoffset'),
    ),
    heads: document.querySelectorAll('[data-thread-head]').length,
    sections: document.querySelectorAll('main > section').length,
  }))

  record(
    'reduced motion renders the whole page in final state with nothing mounted',
    state.canvases === 0 &&
      !state.lenis &&
      state.hiddenReveals === 0 &&
      state.heads === 0 &&
      state.sections === 8,
    JSON.stringify(state),
  )
  record(
    'reduced motion renders the Thread complete at rest colour',
    state.threadOffsets.length > 0 && state.threadOffsets.every((offset) => offset === '0'),
    state.threadOffsets.join(','),
  )
  record('no console problems under reduced motion', problems.length === 0, problems.join(' | '))
  await context.close()
}

// ------------------------------------------------------------------ responsive
{
  const widths = [320, 375, 768, 1024, 1440, 1920, 2560]
  const { context, page } = await open(320, 800)
  const overflowing = []
  const smallTargets = []

  for (const width of widths) {
    await page.setViewportSize({ width, height: width < 600 ? 800 : 900 })
    await page.goto(`${BASE}/`, { waitUntil: 'load' })
    await page.waitForTimeout(1200)

    const overflow = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
    }))
    if (overflow.scroll > overflow.client + 1) overflowing.push({ width, ...overflow })

    const targets = await page.evaluate(() =>
      Array.from(document.querySelectorAll('a, button'))
        .map((element) => {
          const rect = element.getBoundingClientRect()
          return {
            text: (element.textContent || '').trim().slice(0, 24),
            w: Math.round(rect.width),
            h: Math.round(rect.height),
          }
        })
        // Visually hidden elements, the skip link included, have no touch target.
        .filter((entry) => entry.w > 4 && entry.h > 4 && entry.h < 44),
    )
    if (targets.length > 0) smallTargets.push({ width, targets })
  }

  record(
    'no horizontal scroll from 320px to 2560px',
    overflowing.length === 0,
    JSON.stringify(overflowing),
  )
  record(
    'every interactive target clears 44px of height',
    smallTargets.length === 0,
    JSON.stringify(smallTargets).slice(0, 400),
  )
  await context.close()
}

await browser.close()

const failed = results.filter((entry) => !entry.pass)
console.log(`\n${results.length - failed.length}/${results.length} checks passed`)
if (failed.length > 0) process.exitCode = 1
