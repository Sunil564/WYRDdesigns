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
import { assertBuildFresh } from './build-fresh.mjs'

const BASE = process.env.SHOOT_BASE ?? 'http://localhost:3000'

/*
  Refuse to measure a build older than the source. The harness serves a prebuilt
  directory with no HMR, so without this it will quietly report on code that is not
  the code under test. See scripts/build-fresh.mjs.
*/
assertBuildFresh({ base: BASE })
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

  // Any depth, not `main > section`. An inverse section is wrapped one level deeper
  // so its dark ground can sit below the Thread, which is a layering detail rather
  // than a change to the page's structure. Phase 4b step 6.
  const order = await page.evaluate(() =>
    Array.from(document.querySelectorAll('main section[id]')).map((section) => section.id),
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
/*
  These criteria used to read `stroke-dashoffset` off the carrier paths. Those paths
  are `opacity: 0` on every particle tier, so the old assertions passed on a page that
  drew no Thread at all, and they kept passing after the reveal moved to document Y and
  the dash state stopped describing anything. See CLAUDE.md, Verification.

  So: painting is asserted on pixels, by hiding whatever renderer is responsible and
  diffing, which works the same on all three tiers without knowing which one is up.
  Geometry is asserted on the geometry, and says so in its own name rather than being
  dressed up as evidence that something was drawn.
*/

/**
 * Is the Thread painted on its own column, at the current scroll?
 *
 * One screenshot, and a spatial comparison inside it: the Thread is a narrow feature on
 * a column the geometry can name, so its column is compared against a control column at
 * the same rows, with a per row local ground so a heading or a dark block cannot skew it.
 *
 * Time never enters the measurement, and that is the whole point. The first version of
 * this hid the renderers and diffed two screenshots taken 400ms apart, which reported
 * 789 Thread pixels on a Reduced tier that draws no Thread at all: the hero field
 * animates between the two frames and the difference was charged to the Thread. Two
 * frames of an animated page are never a control for each other.
 *
 * Geometry is used to locate the column and for nothing else. Whether anything is
 * painted there is decided by pixels.
 */
async function threadOnColumn(page) {
  const routeX = await page.evaluate(() => {
    const trunk = document.querySelector('[data-thread-body]')
    if (!trunk) return null
    return Math.round(trunk.getPointAtLength(0).x + trunk.ownerSVGElement.getBoundingClientRect().left)
  })
  if (routeX === null) return { routeX: null, onRows: 0, ctrlRows: 0, onMean: 0, ctrlMean: 0, redPeak: 0 }

  const base64 = (await page.screenshot()).toString('base64')
  return page.evaluate(
    async ({ base64, routeX }) => {
      const blob = await (await fetch(`data:image/png;base64,${base64}`)).blob()
      const bitmap = await createImageBitmap(blob)
      const canvas = new OffscreenCanvas(bitmap.width, bitmap.height)
      const context = canvas.getContext('2d')
      context.drawImage(bitmap, 0, 0)
      const { data, width } = context.getImageData(0, 0, bitmap.width, bitmap.height)
      const lum = (x, y) => {
        const i = (width * y + x) * 4
        return (data[i] + data[i + 1] + data[i + 2]) / 3
      }
      // The widest control offset that still fits the viewport with its own ground strip.
      const offset = [200, 150, 100, 80].find(
        (value) => routeX + value + 76 < width || routeX - value - 76 > 0,
      )
      const controlX = routeX + offset + 76 < width ? routeX + offset : routeX - offset
      const peakNear = (centre, y, ground) => {
        let peak = 0
        for (let x = centre - 6; x <= centre + 6; x += 1) peak = Math.max(peak, Math.abs(lum(x, y) - ground))
        return peak
      }

      let rows = 0
      let onRows = 0
      let ctrlRows = 0
      let onSum = 0
      let ctrlSum = 0
      let redPeak = 0
      for (let y = 250; y <= 580; y += 1) {
        for (let x = routeX - 6; x <= routeX + 6; x += 1) {
          const i = (width * y + x) * 4
          redPeak = Math.max(redPeak, data[i] - Math.max(data[i + 1], data[i + 2]))
        }
        const strip = []
        for (let x = routeX - 70; x <= routeX + 70; x += 1) strip.push(lum(x, y))
        const ground = [...strip].sort((a, b) => a - b)[Math.floor(strip.length / 2)]
        const on = peakNear(routeX, y, ground)
        const control = peakNear(controlX, y, ground)
        rows += 1
        onSum += on
        ctrlSum += control
        if (on > 15) onRows += 1
        if (control > 15) ctrlRows += 1
      }
      return {
        routeX,
        controlX,
        rows,
        onRows,
        ctrlRows,
        onMean: Number((onSum / rows).toFixed(1)),
        ctrlMean: Number((ctrlSum / rows).toFixed(1)),
        redPeak,
      }
    },
    { base64, routeX },
  )
}

/**
 * Painted, if the Thread's own column carries markedly more ink than a control column
 * beside it. Measured margins: Full tier +194 rows and +67 mean deviation, Static +116
 * and +13, Reduced +13 and +6 because nothing paints there at all.
 */
function painted(ink) {
  return ink.onRows >= ink.ctrlRows + 60 && ink.onMean >= ink.ctrlMean + 10
}

function inkDetail(ink) {
  return (
    `column x${ink.routeX} inked ${ink.onRows}/${ink.rows} rows at mean deviation ${ink.onMean}, ` +
    `control x${ink.controlX} inked ${ink.ctrlRows} at ${ink.ctrlMean}`
  )
}

/**
 * Put the reveal line inside the positioning section, which the occlusion inventory in
 * ADR 0020 section 7 records as carrying the Thread with nothing in front of it, and far
 * enough down that the hero field is off screen and cannot contribute ink.
 *
 * Through Lenis when it is running, because that is the number the stream places itself
 * from. `window.scrollTo` would leave the two disagreeing.
 */
async function revealInPositioning(page) {
  await page.evaluate(() => {
    if (window.__lenis) window.__lenis.scrollTo(1100, { immediate: true })
    else window.scrollTo(0, 1100)
  })
  await page.waitForTimeout(1400)
}

for (const width of [1024, 1440, 1920, 2560]) {
  const { context, page } = await open(width, 900)
  await page.goto(`${BASE}/`, { waitUntil: 'load' })
  await page.waitForTimeout(2500)

  const route = await page.evaluate(() => {
    const bodies = Array.from(document.querySelectorAll('[data-thread-body]'))
    return { count: bodies.length, lengths: bodies.map((path) => Math.round(path.getTotalLength())) }
  })
  record(
    `the Thread route is nine sampled paths at ${width}px`,
    route.count === 9 && route.lengths.every((length) => length > 100),
    `${route.count} paths, lengths ${route.lengths.join(', ')}px`,
  )

  await revealInPositioning(page)
  const ink = await threadOnColumn(page)
  const reported = Number(
    (await page.getAttribute('[data-thread-stream]', 'data-thread-stream')) ?? 0,
  )
  record(
    `the Thread paints at ${width}px on the Full tier`,
    painted(ink) && reported >= 8000 && reported <= 12000,
    `${inkDetail(ink)}, renderer reports ${reported} points`,
  )
  await context.close()
}

for (const tier of ['reduced', 'static']) {
  const { context, page } = await open(1440, 900, tier)
  await page.goto(`${BASE}/`, { waitUntil: 'load' })
  await page.waitForTimeout(2500)
  await revealInPositioning(page)
  const ink = await threadOnColumn(page)
  const resolved = await page.getAttribute('[data-tier]', 'data-tier')
  record(
    `the Thread paints at 1440px on the ${tier} tier`,
    painted(ink),
    `tier resolved to ${resolved}, ${inkDetail(ink)}`,
  )
  await context.close()
}

for (const width of [375, 768, 1023]) {
  const { context, page } = await open(width, 812)
  await page.goto(`${BASE}/`, { waitUntil: 'load' })
  await page.waitForTimeout(2500)

  const route = await page.evaluate(() => {
    const bodies = Array.from(document.querySelectorAll('[data-thread-body]'))
    return { count: bodies.length, d: bodies[0]?.getAttribute('d') ?? '' }
  })
  // One path, and its geometry is a straight vertical line: two points, same x.
  const points = route.d.match(/-?\d+(\.\d+)?/g) ?? []
  const straight = points.length === 4 && points[0] === points[2]
  record(
    `below 1024 the Thread route is a single straight line at ${width}px`,
    route.count === 1 && straight,
    `${route.count} path, d="${route.d}"`,
  )

  await revealInPositioning(page)
  const ink = await threadOnColumn(page)
  record(`below 1024 the Thread paints at ${width}px`, painted(ink), inkDetail(ink))
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
    'S3 hover lifts the dark card a step, sweeps the hairline, and turns the index accent',
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
    const masks = Array.from(document.querySelectorAll('#clients [role="img"]')).map((element) => ({
      name: element.getAttribute('aria-label'),
      mask: getComputedStyle(element).maskImage.includes('url'),
      colour: getComputedStyle(element).backgroundColor,
    }))
    const images = Array.from(document.querySelectorAll('#clients img')).map((element) => ({
      name: element.getAttribute('alt'),
      src: element.getAttribute('src'),
    }))
    return { masks, images }
  })

  /*
    Six logos, five of them tinted masks in --fg-muted. SITEO ships as original
    artwork because it does not survive monochroming on the light canvas, so it is
    an img with its real name as alt rather than a mask. Phase 4b section 8 and
    docs/BLOCKERS.md item 8.
  */
  record(
    'S5 renders six real client logos, five as muted masks and SITEO as original artwork',
    logos.masks.length === 5 &&
      logos.masks.every((logo) => logo.mask && logo.name) &&
      logos.masks.every((logo) => logo.colour === 'rgb(94, 94, 102)') &&
      logos.images.length === 1 &&
      logos.images[0]?.name === 'SITEO',
    `${logos.masks.length} masks: ${logos.masks.map((l) => l.name).join(', ')} | ${logos.images.length} original: ${logos.images.map((l) => l.name).join(', ')}`,
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
    sections: document.querySelectorAll('main section[id]').length,
  }))

  record(
    'reduced motion renders the whole page in final state with nothing mounted',
    state.canvases === 0 &&
      !state.lenis &&
      state.hiddenReveals === 0 &&
      state.sections === 8,
    JSON.stringify(state),
  )
  /*
    Pixels, not the dash attribute. "Complete at rest colour" is a claim about what the
    page looks like, so it is measured on the column: ink present along it, and no accent
    anywhere on it, since the travelling head must not exist on this tier.
  */
  await revealInPositioning(page)
  const restInk = await threadOnColumn(page)
  record(
    'reduced motion renders the Thread complete at rest colour',
    painted(restInk) && restInk.redPeak < 40,
    `${inkDetail(restInk)}, reddest pixel on the column ${restInk.redPeak}`,
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
