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

/*
  The analytics scripts only. Every route this once masked now exists, so every route entry
  has come out. A masking pattern that outlives its reason is how a real 404 goes unnoticed.
*/
const EXPECTED_404 = /_vercel\/(insights|speed-insights)/

const browser = await chromium.launch()

/**
 * @param tier Pass a tier only for a criterion that is explicitly about that tier. Leaving it
 *   null is the default and the right one: the page then resolves the tier the way a real
 *   device does. It used to default to 'full', which meant every narrow width criterion here
 *   measured a page no phone can see. `useRenderTier` returns Reduced for any coarse pointer,
 *   and this helper emulates touch below 600px and then overrode the decision that touch
 *   drives. See CLAUDE.md, Verification.
 */
async function open(width, height, tier = null, reducedMotion = 'no-preference') {
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
  if (tier) {
    await page.addInitScript((value) => window.localStorage.setItem('wyrd:tier', value), tier)
  }
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
 *
 * **The probe follows the route, row by row.** It used to read `getPointAtLength(0).x` once
 * and hold that column for every row, which was correct only while every route below 1024px
 * was a straight vertical line. When the narrow route began to weave, the fixed column
 * measured 19 inked rows of 331 at 375px and 0 at 768px on a build that was drawing
 * perfectly well. The probe was reporting where it was looking, not what was painted.
 */
async function threadOnColumn(page) {
  /*
    The route's x at every row of the measured band, in viewport pixels. Sampled from the
    path itself rather than assumed, so a straight route and a woven one are measured the
    same way and neither needs a special case.
  */
  const rowX = await page.evaluate(() => {
    const trunk = document.querySelector('[data-thread-body]')
    if (!trunk) return null
    const box = trunk.ownerSVGElement.getBoundingClientRect()
    const length = trunk.getTotalLength()
    const steps = Math.max(400, Math.ceil(length / 3))
    const rows = new Array(331).fill(null)
    for (let i = 0; i <= steps; i += 1) {
      const point = trunk.getPointAtLength((i / steps) * length)
      const y = Math.round(point.y + box.top)
      if (y >= 250 && y <= 580) rows[y - 250] = Math.round(point.x + box.left)
    }
    // Fill any row the sampling stepped over, so every row in the band has a column.
    for (let i = 1; i < rows.length; i += 1) if (rows[i] === null) rows[i] = rows[i - 1]
    for (let i = rows.length - 2; i >= 0; i -= 1) if (rows[i] === null) rows[i] = rows[i + 1]
    return rows
  })
  if (rowX === null || rowX[0] === null) {
    return { routeX: null, onRows: 0, ctrlRows: 0, onMean: 0, ctrlMean: 0, redPeak: 0 }
  }
  const routeX = rowX[Math.floor(rowX.length / 2)]

  const base64 = (await page.screenshot()).toString('base64')
  return page.evaluate(
    async ({ base64, routeX, rowX }) => {
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
      /*
        The control is the emptiest candidate column, not a fixed offset.

        A single offset lands on body copy at some widths: at 1920 the old +200 put the
        control inside the centred positioning text, which inked 155 of 331 rows on its own
        and left the thread only 54 rows clear of a threshold needing 60. The control is
        meant to stand for "this page without a thread on it", so the least inked candidate
        is the closest thing to that, and picking it costs nothing when none of them is
        contaminated.
      */
      const minRoute = Math.min(...rowX)
      const maxRoute = Math.max(...rowX)
      const candidates = []
      for (const offset of [150, 200, 250, 300]) {
        for (const sign of [1, -1]) {
          // Offsets are from the route's own extremes, so a control never lands inside the
          // band a woven route sweeps through.
          const x = sign > 0 ? maxRoute + offset : minRoute - offset
          if (x - 76 > 0 && x + 76 < width) candidates.push({ offset: sign * offset, x })
        }
      }
      if (candidates.length === 0) {
        const fallback = maxRoute + 80 + 76 < width ? { offset: 80, x: maxRoute + 80 } : { offset: -80, x: minRoute - 80 }
        candidates.push(fallback)
      }
      const peakNear = (centre, y, ground) => {
        let peak = 0
        for (let x = centre - 6; x <= centre + 6; x += 1) peak = Math.max(peak, Math.abs(lum(x, y) - ground))
        return peak
      }

      // `at` gives the column to probe for a row: the route itself, or a fixed offset from
      // the band it sweeps. Either way it is evaluated per row, never once for the band.
      const measure = (at) => {
        let rows = 0
        let inked = 0
        let sum = 0
        for (let y = 250; y <= 580; y += 1) {
          const here = rowX[y - 250]
          const strip = []
          for (let x = here - 70; x <= here + 70; x += 1) strip.push(lum(x, y))
          const ground = [...strip].sort((a, b) => a - b)[Math.floor(strip.length / 2)]
          const centre = at(y)
          if (centre - 6 < 0 || centre + 6 >= width) continue
          const peak = peakNear(centre, y, ground)
          rows += 1
          sum += peak
          if (peak > 15) inked += 1
        }
        return { rows, inked, mean: rows ? sum / rows : 0 }
      }
      const controls = candidates.map((c) => ({
        x: c.x,
        ...measure(() => c.x),
      }))
      const control = controls.reduce((best, c) => (c.inked < best.inked ? c : best), controls[0])
      const controlX = control.x

      let rows = 0
      let onRows = 0
      const ctrlRows = control.inked
      let onSum = 0
      const ctrlSum = control.mean * control.rows
      let redPeak = 0
      for (let y = 250; y <= 580; y += 1) {
        const here = rowX[y - 250]
        for (let x = here - 6; x <= here + 6; x += 1) {
          const i = (width * y + x) * 4
          redPeak = Math.max(redPeak, data[i] - Math.max(data[i + 1], data[i + 2]))
        }
        const strip = []
        for (let x = here - 70; x <= here + 70; x += 1) strip.push(lum(x, y))
        const ground = [...strip].sort((a, b) => a - b)[Math.floor(strip.length / 2)]
        const on = peakNear(here, y, ground)
        rows += 1
        onSum += on
        if (on > 15) onRows += 1
      }
      return {
        routeX,
        controlX,
        rows,
        onRows,
        ctrlRows,
        onMean: Number((onSum / rows).toFixed(1)),
        ctrlMean: Number((ctrlSum / Math.max(1, control.rows)).toFixed(1)),
        redPeak,
      }
    },
    { base64, routeX, rowX },
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
  // Full is asked for here because the criterion names it. These widths resolve to Full on a
  // fine pointer anyway, so the override only pins what detection would already decide.
  const { context, page } = await open(width, 900, 'full')
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
  /*
    The band comes from the page, not from a copy kept here. It has moved twice, from
    8,000 to 12,000 down to 4,000 to 6,000, and the copy that used to live on this line
    went stale the second time and failed four criteria on a correct build. See CLAUDE.md,
    Verification: assert on what the renderer reports, including what it reports about its
    own limits.
  */
  const band = ((await page.getAttribute('[data-thread-stream]', 'data-thread-band')) ?? '')
    .split('-')
    .map(Number)
  const inBand = band.length === 2 && reported >= band[0] && reported <= band[1]
  record(
    `the Thread paints at ${width}px on the Full tier`,
    painted(ink) && inBand,
    `${inkDetail(ink)}, renderer reports ${reported} points against its stated band ${band.join(' to ')}`,
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
  // No tier forced. At 375 this helper emulates touch, so the page resolves to Reduced, which
  // is what a phone does and what these criteria are supposed to be about.
  const { context, page } = await open(width, 812)
  await page.goto(`${BASE}/`, { waitUntil: 'load' })
  await page.waitForTimeout(2500)

  /*
    One path, and it weaves. This asserted a straight vertical line until the narrow route
    was given a weave; the amplitude is read off the path rather than compared against a
    number copied from the source, so a tuning change moves the measurement with it.
  */
  const route = await page.evaluate(() => {
    const bodies = Array.from(document.querySelectorAll('[data-thread-body]'))
    const trunk = bodies[0]
    if (!trunk) return { count: bodies.length, turns: 0, amplitude: 0, width: 0 }
    const length = trunk.getTotalLength()
    const xs = []
    for (let i = 0; i <= 400; i += 1) xs.push(trunk.getPointAtLength((i / 400) * length).x)
    const centre = (Math.min(...xs) + Math.max(...xs)) / 2
    let turns = 0
    for (let i = 1; i < xs.length - 1; i += 1) {
      const before = xs[i] - xs[i - 1]
      const after = xs[i + 1] - xs[i]
      if (before > 0 !== after > 0 && Math.abs(xs[i] - centre) > 4) turns += 1
    }
    return {
      count: bodies.length,
      turns,
      amplitude: Math.round((Math.max(...xs) - Math.min(...xs)) / 2),
      width: Math.round(trunk.ownerSVGElement.getBoundingClientRect().width),
    }
  })
  const fraction = route.width ? route.amplitude / route.width : 0
  record(
    `below 1024 the Thread route is one path that weaves at ${width}px`,
    route.count === 1 && route.turns >= 4 && fraction > 0.1 && fraction < 0.25,
    `${route.count} path, ${route.turns} turning points, amplitude ${route.amplitude}px` +
      ` on ${route.width}px = ${(fraction * 100).toFixed(1)}% of width`,
  )

  await revealInPositioning(page)
  const ink = await threadOnColumn(page)
  const resolved = await page.getAttribute('[data-tier]', 'data-tier')
  record(
    `below 1024 the Thread paints at ${width}px`,
    painted(ink),
    `tier resolved to ${resolved}, ${inkDetail(ink)}`,
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
  /*
    Read the token the page resolved rather than a colour copied into this file. This
    criterion held `rgb(255, 82, 31)` as a literal and would have failed on a correct build
    the moment the accent changed, which is the stale-copied-constant fault the Verification
    rules in CLAUDE.md name. The comparison is done in the page so both sides come from the
    same computed-style pass and the format matches without parsing.
  */
  const indexColour = await block.evaluate((el) => {
    const label = el.querySelector('.label')
    if (!label) return null
    const probe = document.createElement('span')
    probe.style.color = 'var(--color-accent-on-inverse)'
    el.append(probe)
    const expected = getComputedStyle(probe).color
    probe.remove()
    return { actual: getComputedStyle(label).color, expected }
  })

  record(
    'S3 hover lifts the dark card a step, sweeps the hairline, and turns the index accent',
    restBackground !== hoverBackground &&
      sweep !== null &&
      !/matrix\(0,/.test(sweep ?? '') &&
      indexColour !== null &&
      indexColour.actual === indexColour.expected,
    `${restBackground} to ${hoverBackground}, sweep ${sweep}, index ${indexColour?.actual}` +
      ` against --accent-on-inverse ${indexColour?.expected}`,
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
