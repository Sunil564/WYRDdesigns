/**
 * Route level checks every Phase 5 page needs. Development only.
 *
 * These exist once because they were about to exist twice. `/work` and `/work/[slug]` want
 * the same six assertions, and two copies of an assertion is the same fault as two copies of
 * a constant: they drift, and the drift is silent. See CLAUDE.md, Verification.
 *
 * Every check here follows the rules carried out of the thread work. Nothing forces a tier,
 * so a page resolves the way the emulated device would. Nothing asserts on a computed style
 * standing in for a visual outcome.
 */

import { chromium } from 'playwright'

/**
 * The analytics scripts, which only exist in production. Nothing else.
 *
 * Every route entry that was ever in here has come out as its route landed: `/studio`,
 * `/contact`, `/work/<slug>`, and finally `/privacy` and `/terms`. There is no route mask
 * left, which is the state to keep it in. A masking pattern that outlives its reason is how a
 * real failure stays invisible, and this list is where that would happen first.
 */
const DEFAULT_EXPECTED_404 = /_vercel\/(insights|speed-insights)/

/**
 * @param expectedErrorPaths Pathnames whose own 4xx response is the point rather than a fault.
 *   Only the 404 route needs this: every check navigates to a page that legitimately answers
 *   404, and without it the shared response collector reports the page under test as a problem
 *   with itself. Matched on pathname, so it cannot accidentally excuse a different URL.
 */
export function createHarness({ base, expected404 = DEFAULT_EXPECTED_404, expectedErrorPaths = [] }) {
  const expectedPaths = new Set(expectedErrorPaths)

  const results = []
  let browser = null

  function record(name, pass, detail = '') {
    results.push({ name, pass, detail })
    console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? `\n        ${detail}` : ''}`)
  }

  async function launch() {
    browser = await chromium.launch()
  }

  /**
   * A page with problem collection wired up. No tier is written, ever: forcing one means
   * measuring a page no user sees.
   */
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
      if (response.status() < 400) return
      if (expected404.test(response.url())) return
      let pathname = ''
      try {
        pathname = new URL(response.url()).pathname
      } catch {
        pathname = ''
      }
      if (expectedPaths.has(pathname)) return
      problems.push(`${response.status()} ${response.url()}`)
    })
    return { context, page, problems }
  }

  /**
   * Title, description, canonical, one h1, one of each landmark, and a clean console.
   *
   * `expectCanonical: false` inverts the canonical check rather than skipping it. The 404 has
   * none on purpose, because a canonical says this URL is the preferred address for this
   * content and a 404 addresses nothing, so the absence is the criterion.
   */
  async function checkHead(route, { titlePrefix = 'WYRD Designs, digital', expectCanonical = true } = {}) {
    const { context, page, problems } = await open(1440, 900)
    await page.goto(`${base}${route}`, { waitUntil: 'load' })
    await page.waitForTimeout(2500)

    const head = await page.evaluate(() => ({
      title: document.title,
      description:
        document.querySelector('meta[name="description"]')?.getAttribute('content') ?? '',
      canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? '',
      h1Count: document.querySelectorAll('h1').length,
      h1: document.querySelector('h1')?.textContent?.trim() ?? '',
      main: document.querySelectorAll('main').length,
      header: document.querySelectorAll('header').length,
      footer: document.querySelectorAll('footer').length,
    }))
    record(
      `${route} has its own title and description, and exactly one h1`,
      head.title.length > 0 &&
        !head.title.startsWith(titlePrefix) &&
        head.description.length > 0 &&
        head.h1Count === 1,
      `title "${head.title}", h1 "${head.h1}", description ${head.description.length} chars`,
    )
    record(
      expectCanonical
        ? `${route} canonical is absolute with no domain hardcoded in it`
        : `${route} declares no canonical, because it addresses nothing`,
      expectCanonical
        ? head.canonical.startsWith('http') && !/wyrddesigns\.in/.test(head.canonical)
        : head.canonical === '',
      `canonical ${head.canonical || '(none)'}`,
    )
    record(
      `${route} has one main, one header, one footer`,
      head.main === 1 && head.header === 1 && head.footer === 1,
      `main ${head.main}, header ${head.header}, footer ${head.footer}`,
    )
    record(`${route} logs no console problems`, problems.length === 0, problems.join(' | '))
    await context.close()
  }

  /** Every keyboard stop rendered and ringed, and every target 44px tall. */
  async function checkKeyboardAndTargets(route, { stops = 24 } = {}) {
    const { context, page } = await open(1440, 900)
    await page.goto(`${base}${route}`, { waitUntil: 'load' })
    await page.waitForTimeout(2000)

    const walk = []
    for (let step = 0; step < stops; step += 1) {
      await page.keyboard.press('Tab')
      const stop = await page.evaluate(() => {
        const element = document.activeElement
        if (!element || element === document.body) return null
        const style = getComputedStyle(element)
        const box = element.getBoundingClientRect()
        return {
          tag: element.tagName.toLowerCase(),
          name: (element.getAttribute('aria-label') ?? element.textContent ?? '')
            .trim()
            .slice(0, 24),
          ring: style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) > 0,
          rendered: box.width > 0 && box.height > 0,
        }
      })
      if (stop) walk.push(stop)
    }
    const unrendered = walk.filter((stop) => !stop.rendered)
    const ringless = walk.filter((stop) => !stop.ring)
    record(
      `${route} keyboard stops are all rendered and ringed`,
      walk.length > 0 && unrendered.length === 0 && ringless.length === 0,
      `${walk.length} stops, ${unrendered.length} not rendered, ${ringless.length} without a ring. ` +
        `Order: ${walk.slice(0, 12).map((stop) => stop.name || stop.tag).join(' > ')}`,
    )

    const small = await page.evaluate(() => {
      const out = []
      for (const element of document.querySelectorAll('a, button, input, select, textarea')) {
        const rect = element.getBoundingClientRect()
        /*
          A few pixels either way means visually hidden rather than small, the skip link
          included: it renders 1 by 1 until focused and is not a touch target.
        */
        if (rect.width <= 4 || rect.height <= 4) continue
        /*
          And anything parked off screen is not a touch target either, whatever its own box
          says. The contact form's honeypot sits at left -9999px and measures 168 by 26 in
          its own right, so a size test alone reports it as a control too small to tap when
          nobody can reach it at all.
        */
        if (rect.right < 0 || rect.bottom < 0 || rect.left > window.innerWidth) continue
        /*
          Inline links inside a sentence are exempt, and this is WCAG's own exception rather
          than a convenience: 2.5.8 excludes a target whose size is constrained by the
          line-height of the non-target text around it. A mailto in the middle of a legal
          paragraph is 20px tall because the paragraph is, and growing it to 44 would break
          the prose it sits in. The test is structural, an inline element with text beside it
          in the same parent, so a standalone link styled inline still counts.
        */
        const inlineInProse =
          getComputedStyle(element).display.startsWith('inline') &&
          Array.from(element.parentElement?.childNodes ?? []).some(
            (node) => node.nodeType === Node.TEXT_NODE && (node.textContent ?? '').trim().length > 0,
          )
        if (inlineInProse) continue
        if (rect.height < 44) {
          out.push(`${element.tagName.toLowerCase()} ${Math.round(rect.height)}px`)
        }
      }
      return out
    })
    record(
      `${route} interactive targets all clear 44px of height`,
      small.length === 0,
      small.join(', '),
    )
    await context.close()
  }

  /** Composed, nothing mounted, no console noise, under prefers-reduced-motion. */
  async function checkReducedMotion(route, { expect = () => true, describe = () => '' } = {}) {
    const { context, page, problems } = await open(1440, 900, 'reduce')
    await page.goto(`${base}${route}`, { waitUntil: 'load' })
    await page.waitForTimeout(2000)
    const state = await page.evaluate(() => ({
      hiddenReveals: Array.from(document.querySelectorAll('[data-reveal]')).filter(
        (element) => Number(getComputedStyle(element).opacity) < 0.99,
      ).length,
      canvases: document.querySelectorAll('canvas').length,
      lenis: Boolean(window.__lenis),
      /*
        Scoped to main. The header's wordmark is an interim placeholder site wide, per
        BLOCKERS item 2, so counting the whole document tells you about the shell rather than
        about the route.
      */
      placeholders: document.querySelectorAll('main [data-placeholder]').length,
      /*
        Images the browser actually decoded. Routes whose visuals became real files no
        longer have placeholders to count, and an element count would not have told them
        apart from a broken src anyway.
      */
      loadedImages: Array.from(document.querySelectorAll('main img')).filter(
        (img) => img.complete && img.naturalWidth > 0,
      ).length,
    }))
    record(
      `${route} renders composed under reduced motion, with nothing mounted`,
      state.hiddenReveals === 0 && state.canvases === 0 && !state.lenis && expect(state),
      `${state.hiddenReveals} unrevealed, ${state.canvases} canvases, lenis ${state.lenis}` +
        (describe(state) ? `, ${describe(state)}` : ''),
    )
    record(
      `${route} logs no console problems under reduced motion`,
      problems.length === 0,
      problems.join(' | '),
    )
    await context.close()
  }

  /** No horizontal scroll across the full width range. */
  async function checkOverflow(route, widths = [320, 375, 768, 1024, 1440, 1920, 2560]) {
    const overflowing = []
    for (const width of widths) {
      const { context, page } = await open(width, 900)
      await page.goto(`${base}${route}`, { waitUntil: 'load' })
      await page.waitForTimeout(1200)
      const over = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth + 1,
      )
      if (over) overflowing.push(width)
      await context.close()
    }
    record(
      `${route} has no horizontal scroll from ${widths[0]}px to ${widths[widths.length - 1]}px`,
      overflowing.length === 0,
      overflowing.length
        ? `overflows at ${overflowing.join(', ')}px`
        : `checked ${widths.join(', ')}px`,
    )
  }

  async function finish() {
    if (browser) await browser.close()
    const failed = results.filter((result) => !result.pass)
    console.log(`\n${results.length - failed.length}/${results.length} checks passed`)
    if (failed.length > 0) process.exitCode = 1
  }

  return {
    launch,
    open,
    record,
    checkHead,
    checkKeyboardAndTargets,
    checkReducedMotion,
    checkOverflow,
    finish,
  }
}
