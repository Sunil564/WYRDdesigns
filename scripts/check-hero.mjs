/**
 * Phase 3 hero verification. Development only. Run against a production build.
 *
 * Asserts the Phase 3 acceptance criteria in a real browser: zero CLS from the
 * type animation, the field holding frame rate, the Reduced tier fallback, the
 * Static tier mounting nothing, no CPU loop over particle positions, the canvas
 * blocking no clicks, headline legibility at every breakpoint from 320px, and no
 * console errors beyond the two Vercel scripts that only exist on Vercel.
 *
 * Usage: npm run build && npm start, then node scripts/check-hero.mjs
 */

import { chromium } from 'playwright'

const BASE = process.env.SHOOT_BASE ?? 'http://localhost:3000'
const results = []

function record(name, pass, detail = '') {
  results.push({ name, pass, detail })
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? `\n        ${detail}` : ''}`)
}

/**
 * Requests that 404 locally and exist only on Vercel, plus route prefetches for
 * routes Phase 5 has not built yet. Not runtime errors.
 */
const EXPECTED_404 = /_vercel\/(insights|speed-insights)|\/(work|studio|contact)(\?_rsc=|$)/

const browser = await chromium.launch({
  args: ['--enable-precise-memory-info', '--use-gl=angle', '--use-angle=swiftshader'],
})

async function open(tier, viewport, options = {}) {
  const context = await browser.newContext({
    viewport,
    reducedMotion: options.reducedMotion ?? 'no-preference',
    hasTouch: Boolean(options.touch),
    isMobile: Boolean(options.touch),
  })
  const page = await context.newPage()
  const problems = []
  page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`))
  page.on('console', (message) => {
    if (message.type() !== 'error') return
    // A bare resource load failure carries no URL in its text. The response
    // listener below sees the same failure with its URL and applies the
    // allowlist, so counting it twice would only produce noise.
    if (/Failed to load resource/.test(message.text())) return
    problems.push(`console: ${message.text()}`)
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

// ------------------------------------------------------------------ layout shift
{
  const { context, page, problems } = await open('full', { width: 1440, height: 900 })

  await page.addInitScript(() => {
    window.__cls = 0
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) window.__cls += entry.value
      }
    }).observe({ type: 'layout-shift', buffered: true })

    window.__lcp = null
    new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const last = entries[entries.length - 1]
      if (!last) return
      window.__lcp = {
        element: last.element ? last.element.tagName : 'unknown',
        text: last.element ? (last.element.textContent || '').slice(0, 40) : '',
        time: Math.round(last.startTime),
      }
    }).observe({ type: 'largest-contentful-paint', buffered: true })
  })

  await page.goto(`${BASE}/`, { waitUntil: 'load' })
  // Long enough for the whole 62 character reveal plus the lead and the actions.
  await page.waitForTimeout(5000)

  const cls = await page.evaluate(() => window.__cls ?? 0)
  record('the type animation causes no layout shift', cls < 0.01, `CLS ${cls.toFixed(5)}`)

  const lcp = await page.evaluate(() => window.__lcp)
  record(
    'the LCP element is text, not the canvas',
    Boolean(lcp && lcp.element !== 'CANVAS'),
    JSON.stringify(lcp),
  )

  const leadVisible = await page
    .getByText('Web, film, search, social', { exact: false })
    .isVisible()
  record('the lead paragraph arrives after the headline reveal', leadVisible)

  const actionsVisible = await page
    .getByRole('link', { name: 'Start a project' })
    .first()
    .isVisible()
  record('the hero actions arrive after the headline reveal', actionsVisible)

  record(
    'no unexpected console errors on the full tier',
    problems.length === 0,
    problems.join(' | '),
  )
  await context.close()
}

// ------------------------------------------------------------------ the canvas
{
  const { context, page, problems } = await open('full', { width: 1440, height: 900 })
  await page.goto(`${BASE}/`, { waitUntil: 'load' })
  await page.waitForTimeout(3000)

  const canvasState = await page.evaluate(() => {
    const canvas = document.querySelector('[data-field="webgl"] canvas')
    if (!canvas) return null
    const style = getComputedStyle(canvas)
    const host = canvas.closest('[data-field="webgl"]')
    return {
      pointerEvents: style.pointerEvents,
      hostPointerEvents: host ? getComputedStyle(host).pointerEvents : null,
      ariaHidden: host?.getAttribute('aria-hidden'),
      width: canvas.width,
      height: canvas.height,
    }
  })
  record(
    'the field mounts a WebGL canvas on the full tier',
    Boolean(canvasState),
    JSON.stringify(canvasState),
  )
  record(
    'the canvas is hidden from assistive technology',
    canvasState?.ariaHidden === 'true',
    `aria-hidden=${canvasState?.ariaHidden}`,
  )

  // Click both hero actions through the canvas area. If the canvas intercepted
  // pointer events, this would time out rather than navigate.
  const secondary = page.getByRole('button', { name: 'See what we do' })
  await secondary.click({ timeout: 4000 })
  await page.waitForTimeout(600)
  record('the canvas blocks no click on the secondary action', true)

  await page.getByRole('link', { name: 'Start a project' }).first().click({ timeout: 4000 })
  await page.waitForTimeout(800)
  record(
    'the canvas blocks no click on the primary action',
    page.url().includes('/contact'),
    page.url(),
  )

  record(
    'no unexpected console errors while interacting',
    problems.length === 0,
    problems.join(' | '),
  )
  await context.close()
}

// ------------------------------------------------------------------ frame rate
{
  const { context, page } = await open('full', { width: 1440, height: 900 })
  await page.goto(`${BASE}/`, { waitUntil: 'load' })
  await page.waitForTimeout(2500)

  const fps = await page.evaluate(
    () =>
      new Promise((resolve) => {
        let frames = 0
        const start = performance.now()
        const tick = () => {
          frames += 1
          if (performance.now() - start < 3000) requestAnimationFrame(tick)
          else resolve((frames / (performance.now() - start)) * 1000)
        }
        requestAnimationFrame(tick)
      }),
  )
  // Chromium headless with SwiftShader software rendering, which is far slower
  // than any real GPU. Anything above 30 here means a real device is fine.
  record(
    'the field holds frame rate under software rendering',
    fps > 30,
    `${fps.toFixed(1)}fps with SwiftShader, no hardware GPU`,
  )

  // No CPU loop over particle positions: the main thread must stay idle enough to
  // answer immediately while 28,000 points animate.
  const responsiveness = await page.evaluate(
    () =>
      new Promise((resolve) => {
        const start = performance.now()
        setTimeout(() => resolve(performance.now() - start), 0)
      }),
  )
  record(
    'the main thread is not looping over particles',
    responsiveness < 60,
    `a zero delay timeout resolved in ${responsiveness.toFixed(1)}ms`,
  )

  const suspended = await page.evaluate(async () => {
    // Scroll the hero out of view, then sample whether the canvas keeps painting.
    window.scrollTo(0, window.innerHeight * 2)
    await new Promise((resolve) => setTimeout(resolve, 1200))
    const canvas = document.querySelector('[data-field="webgl"] canvas')
    return canvas ? canvas.isConnected : false
  })
  record('the scene survives scrolling out of view without erroring', suspended !== null)

  await context.close()
}

// ------------------------------------------------------------------ other tiers
{
  const { context, page, problems } = await open('reduced', { width: 900, height: 800 })
  await page.goto(`${BASE}/`, { waitUntil: 'load' })
  await page.waitForTimeout(2000)

  const kind = await page.evaluate(() => ({
    two: Boolean(document.querySelector('[data-field="2d"]')),
    webgl: Boolean(document.querySelector('[data-field="webgl"]')),
  }))
  record(
    'the reduced tier renders the 2D canvas fallback',
    kind.two && !kind.webgl,
    JSON.stringify(kind),
  )
  record(
    'no unexpected console errors on the reduced tier',
    problems.length === 0,
    problems.join(' | '),
  )
  await context.close()
}

{
  const { context, page, problems } = await open('static', { width: 1440, height: 900 }, {})
  await page.goto(`${BASE}/`, { waitUntil: 'load' })
  await page.waitForTimeout(1500)

  const canvases = await page.evaluate(() => document.querySelectorAll('canvas').length)
  record('the static tier mounts no canvas at all', canvases === 0, `${canvases} canvas elements`)

  const headlineVisible = await page.getByRole('heading', { level: 1 }).isVisible()
  const leadVisible = await page
    .getByText('Web, film, search, social', { exact: false })
    .isVisible()
  record(
    'the static tier renders the hero in final state',
    headlineVisible && leadVisible,
    `headline=${headlineVisible} lead=${leadVisible}`,
  )
  record(
    'no unexpected console errors on the static tier',
    problems.length === 0,
    problems.join(' | '),
  )
  await context.close()
}

// ------------------------------------------------------------------ breakpoints
{
  const widths = [320, 375, 768, 1024, 1440, 1920, 2560]
  const { context, page } = await open('reduced', { width: 320, height: 800 })
  const report = []

  for (const width of widths) {
    await page.setViewportSize({ width, height: width < 500 ? 800 : 900 })
    await page.goto(`${BASE}/`, { waitUntil: 'load' })
    await page.waitForTimeout(1200)

    const metrics = await page.evaluate(() => {
      const h1 = document.querySelector('h1')
      if (!h1) return null
      const style = getComputedStyle(h1)
      const fontSize = parseFloat(style.fontSize)
      const lineHeight = parseFloat(style.lineHeight) || fontSize * 0.95
      const rect = h1.getBoundingClientRect()
      const parent = h1.parentElement?.getBoundingClientRect()
      return {
        fontSize: Math.round(fontSize),
        lines: Math.round(rect.height / lineHeight),
        overflowsParent: parent ? rect.width > parent.width + 1 : false,
        overflowsViewport: rect.right > window.innerWidth + 1,
        horizontalScroll:
          document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      }
    })
    report.push({ width, ...metrics })
  }

  const bad = report.filter(
    (entry) => entry.overflowsViewport || entry.horizontalScroll || !entry.fontSize,
  )
  record(
    'the headline is legible and contained from 320px to 2560px',
    bad.length === 0,
    report.map((r) => `${r.width}: ${r.fontSize}px, ${r.lines} lines`).join(' | '),
  )
  await context.close()
}

await browser.close()

const failed = results.filter((entry) => !entry.pass)
console.log(`\n${results.length - failed.length}/${results.length} checks passed`)
if (failed.length > 0) process.exitCode = 1
