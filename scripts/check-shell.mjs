/**
 * Phase 2 shell verification. Development only.
 *
 * Drives the real browser and asserts the Phase 2 acceptance criteria rather than
 * inferring them from the code: header transition, mobile menu focus trap, Escape
 * and route change closing, anchor scrolling under Lenis, touch target sizes, and
 * no horizontal scroll from 320 to 2560.
 *
 * Usage: node scripts/check-shell.mjs
 */

import { chromium } from 'playwright'

const BASE = process.env.SHOOT_BASE ?? 'http://localhost:3000'
const results = []

function record(name, pass, detail = '') {
  results.push({ name, pass, detail })
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? `  ${detail}` : ''}`)
}

const browser = await chromium.launch()

// ---------------------------------------------------------------- header state
{
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()
  /*
    Route prefetches for routes Phase 5 has not built, and the two Vercel analytics
    scripts, which only exist on Vercel. Both 404 locally and neither is a runtime
    error. The same allowlist is in check-hero and check-home.
  */
  const EXPECTED_404 =
    /_vercel\/(insights|speed-insights)|\/(work|studio|contact|privacy|terms)(\?_rsc=|\/|$)/
  const errors = []
  page.on('console', (m) => {
    if (m.type() !== 'error') return
    // A bare resource load failure carries no URL in its text. The response
    // listener below sees the same failure with its URL and applies the allowlist.
    if (/Failed to load resource/.test(m.text())) return
    errors.push(m.text())
  })
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('response', (response) => {
    if (response.status() >= 400 && !EXPECTED_404.test(response.url())) {
      errors.push(`${response.status()} ${response.url()}`)
    }
  })

  await page.goto(`${BASE}/tokens`, { waitUntil: 'load' })
  await page.waitForTimeout(600)

  const atTop = await page.getAttribute('header', 'data-state')
  record('header is transparent over the top of the page', atTop === 'transparent', `got ${atTop}`)

  const topStyles = await page.evaluate(() => {
    const header = document.querySelector('header')
    if (!header) return null
    const style = getComputedStyle(header)
    return { background: style.backgroundColor, borderColor: style.borderBottomColor }
  })

  await page.evaluate(() => window.scrollTo(0, 400))
  await page.waitForTimeout(900)

  const scrolled = await page.getAttribute('header', 'data-state')
  record('header goes solid past 80px of scroll', scrolled === 'solid', `got ${scrolled}`)

  const scrolledStyles = await page.evaluate(() => {
    const header = document.querySelector('header')
    if (!header) return null
    const style = getComputedStyle(header)
    return { background: style.backgroundColor, borderColor: style.borderBottomColor }
  })

  record(
    'header background and hairline actually change',
    topStyles?.background !== scrolledStyles?.background &&
      topStyles?.borderColor !== scrolledStyles?.borderColor,
    JSON.stringify({ topStyles, scrolledStyles }),
  )

  // Lenis has to be running and driving the scroll on a fine pointer desktop.
  const lenisRunning = await page.evaluate(() => Boolean(window.__lenis))
  record('Lenis is mounted on the Full tier', lenisRunning)

  const htmlClass = await page.getAttribute('html', 'class')
  record(
    'html.lenis is set so native smooth scroll steps aside',
    Boolean(htmlClass?.includes('lenis')),
  )

  // Anchor scrolling, against a target far enough down the page that a real jump
  // is measurable. Lenis must not swallow it.
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(500)
  const anchorTarget = await page.evaluate(() => {
    const sections = Array.from(document.querySelectorAll('section'))
    const target = sections[sections.length - 1]
    if (!target) return 0
    target.id = 'deep-anchor-probe'
    const link = document.createElement('a')
    link.href = '#deep-anchor-probe'
    link.id = 'deep-anchor-link'
    link.textContent = 'probe'
    document.body.appendChild(link)
    return target.getBoundingClientRect().top + window.scrollY
  })
  await page.click('#deep-anchor-link')
  await page.waitForTimeout(1500)
  const afterAnchor = await page.evaluate(() => window.scrollY)
  record(
    'in page hash link still scrolls with Lenis mounted',
    anchorTarget > 1000 && Math.abs(afterAnchor - anchorTarget) < 200,
    `target=${Math.round(anchorTarget)} landed=${Math.round(afterAnchor)}`,
  )

  // Programmatic scrolling through Lenis, which is what the hero's second action
  // and the mobile menu use.
  await page.evaluate(() => window.__lenis?.scrollTo(0, { immediate: true }))
  await page.waitForTimeout(600)
  const backToTop = await page.evaluate(() => window.scrollY)
  record('lenis.scrollTo drives the document', backToTop < 10, `y=${backToTop}`)

  record('no console errors on the shell', errors.length === 0, errors.join(' | '))
  await context.close()
}

// ---------------------------------------------------------------- mobile menu
{
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
    hasTouch: true,
    isMobile: true,
  })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))

  await page.goto(`${BASE}/tokens`, { waitUntil: 'load' })
  await page.waitForTimeout(400)

  const openButton = page.getByRole('button', { name: 'Open menu' })
  const openBox = await openButton.boundingBox()
  record(
    'menu button clears a 44px touch target',
    Boolean(openBox && openBox.width >= 44 && openBox.height >= 44),
    JSON.stringify(openBox),
  )

  await openButton.click()
  await page.waitForTimeout(600)

  const dialogVisible = await page.getByRole('dialog').isVisible()
  record('menu opens as a modal dialog', dialogVisible)

  const focusInside = await page.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"]')
    return Boolean(dialog && document.activeElement && dialog.contains(document.activeElement))
  })
  record('focus moves into the menu on open', focusInside)

  // Tab through more elements than the menu contains. If focus is trapped it
  // stays inside for all of them.
  let stayedInside = true
  for (let i = 0; i < 12; i += 1) {
    await page.keyboard.press('Tab')
    const inside = await page.evaluate(() => {
      const dialog = document.querySelector('[role="dialog"]')
      return Boolean(dialog && document.activeElement && dialog.contains(document.activeElement))
    })
    if (!inside) {
      stayedInside = false
      break
    }
  }
  record('focus is trapped inside the menu', stayedInside)

  const scrollLocked = await page.evaluate(() => document.body.style.overflow === 'hidden')
  record('body scroll is locked while the menu is open', scrollLocked)

  await page.keyboard.press('Escape')
  await page.waitForTimeout(600)
  const closedByEscape = (await page.getByRole('dialog').count()) === 0
  record('Escape closes the menu', closedByEscape)

  const focusRestored = await page.evaluate(
    () => document.activeElement?.getAttribute('aria-label') === 'Open menu',
  )
  record('focus returns to the button that opened the menu', focusRestored)

  const scrollUnlocked = await page.evaluate(() => document.body.style.overflow !== 'hidden')
  record('body scroll is released on close', scrollUnlocked)

  // Route change closes it. Open, then navigate through a link inside the menu.
  await openButton.click()
  await page.waitForTimeout(500)
  await page.getByRole('dialog').getByRole('link', { name: 'Studio' }).click()
  await page.waitForTimeout(1200)
  const closedByRoute = (await page.getByRole('dialog').count()) === 0
  record('a route change closes the menu', closedByRoute, page.url())

  record('no page errors on mobile', errors.length === 0, errors.join(' | '))
  await context.close()
}

// ---------------------------------------------------------------- overflow sweep
{
  const widths = [320, 375, 768, 1024, 1440, 1920, 2560]
  const context = await browser.newContext()
  const page = await context.newPage()
  const overflowing = []

  for (const width of widths) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto(`${BASE}/tokens`, { waitUntil: 'load' })
    await page.waitForTimeout(400)
    const overflow = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
    }))
    if (overflow.scroll > overflow.client + 1) overflowing.push({ width, ...overflow })
  }

  record(
    'no horizontal scroll from 320 to 2560',
    overflowing.length === 0,
    JSON.stringify(overflowing),
  )
  await context.close()
}

// ---------------------------------------------------------------- reduced motion
{
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: 'reduce',
  })
  const page = await context.newPage()
  await page.goto(`${BASE}/tokens`, { waitUntil: 'load' })
  await page.waitForTimeout(900)

  const lenisMounted = await page.evaluate(() => Boolean(window.__lenis))
  record('Lenis is not mounted under reduced motion', !lenisMounted)

  const revealsShown = await page.evaluate(() =>
    Array.from(document.querySelectorAll('[data-reveal]')).every(
      (element) => getComputedStyle(element).opacity === '1',
    ),
  )
  record('every reveal renders in final state under reduced motion', revealsShown)

  await context.close()
}

await browser.close()

const failed = results.filter((entry) => !entry.pass)
console.log(`\n${results.length - failed.length}/${results.length} checks passed`)
if (failed.length > 0) process.exitCode = 1
