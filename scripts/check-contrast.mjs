/**
 * Phase 4b criterion 3. Development only, run against a production build.
 *
 * Enumerates every element that renders text on every route, resolves the colour it
 * is painted in and the background it is actually painted on, and computes the
 * contrast ratio. Not one automated check on one page: every pair, on every route,
 * at three widths, in both the light and the inverse context.
 *
 * The threshold follows WCAG 1.4.3: 3:1 for large text, which is 24px or larger, or
 * 18.66px or larger at 700 weight, and 4.5:1 for everything else.
 *
 * Usage: npm run build && npm start, then node scripts/check-contrast.mjs
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
const ROUTES = ['/', '/tokens', '/tiers', '/work', '/work/ecommerce-garments']
const WIDTHS = [375, 768, 1440]

const collect = () => {
  const parse = (value) => {
    const match = value.match(/rgba?\(([^)]+)\)/)
    if (!match) return null
    const parts = match[1].split(',').map((n) => parseFloat(n.trim()))
    return { r: parts[0], g: parts[1], b: parts[2], a: parts.length > 3 ? parts[3] : 1 }
  }

  const over = (top, bottom) => {
    // Composite a translucent colour over an opaque one.
    const a = top.a
    return {
      r: top.r * a + bottom.r * (1 - a),
      g: top.g * a + bottom.g * (1 - a),
      b: top.b * a + bottom.b * (1 - a),
      a: 1,
    }
  }

  const luminance = ({ r, g, b }) => {
    const channel = (v) => {
      const s = v / 255
      return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
    }
    return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
  }

  const ratio = (fg, bg) => {
    const l1 = luminance(fg)
    const l2 = luminance(bg)
    const hi = Math.max(l1, l2)
    const lo = Math.min(l1, l2)
    return (hi + 0.05) / (lo + 0.05)
  }

  /** Walk up until an opaque background is found, compositing on the way. */
  const backgroundOf = (element) => {
    let node = element
    const stack = []
    while (node && node !== document.documentElement) {
      const bg = parse(getComputedStyle(node).backgroundColor)
      if (bg && bg.a > 0) {
        stack.push(bg)
        if (bg.a >= 0.999) break
      }
      node = node.parentElement
    }
    let result = { r: 255, g: 255, b: 255, a: 1 }
    for (let i = stack.length - 1; i >= 0; i -= 1) {
      result = over(stack[i], result)
    }
    return result
  }

  const results = []
  const elements = Array.from(document.querySelectorAll('body *'))

  for (const element of elements) {
    if (element.getAttribute('aria-hidden') === 'true') continue
    if (element.closest('[aria-hidden="true"]')) continue

    // Only elements with their own visible text, so a colour is judged once where
    // it is actually painted rather than once per ancestor.
    const ownText = Array.from(element.childNodes)
      .filter((node) => node.nodeType === 3)
      .map((node) => node.textContent.trim())
      .join(' ')
      .trim()
    if (!ownText) continue

    const style = getComputedStyle(element)
    if (style.visibility === 'hidden' || style.display === 'none') continue
    if (parseFloat(style.opacity) < 0.05) continue

    const rect = element.getBoundingClientRect()
    if (rect.width < 1 || rect.height < 1) continue

    const colour = parse(style.color)
    if (!colour) continue

    const background = backgroundOf(element)
    const painted = colour.a < 1 ? over(colour, background) : colour

    const size = parseFloat(style.fontSize)
    const weight = parseInt(style.fontWeight, 10) || 400
    const large = size >= 24 || (size >= 18.66 && weight >= 700)
    const required = large ? 3 : 4.5
    const value = ratio(painted, background)

    results.push({
      text: ownText.slice(0, 42),
      tag: element.tagName.toLowerCase(),
      size: Math.round(size * 10) / 10,
      weight,
      large,
      ratio: Math.round(value * 100) / 100,
      required,
      pass: value >= required - 0.005,
      fg: `rgb(${Math.round(painted.r)}, ${Math.round(painted.g)}, ${Math.round(painted.b)})`,
      bg: `rgb(${Math.round(background.r)}, ${Math.round(background.g)}, ${Math.round(background.b)})`,
    })
  }

  return results
}

const browser = await chromium.launch()
const failures = []
let checked = 0
const pairs = new Map()

for (const route of ROUTES) {
  for (const width of WIDTHS) {
    const context = await browser.newContext({
      viewport: { width, height: width < 600 ? 812 : 900 },
      hasTouch: width < 600,
      isMobile: width < 600,
    })
    const page = await context.newPage()
    await page.addInitScript(() => window.localStorage.setItem('wyrd:tier', 'static'))
    await page.goto(`${BASE}${route}`, { waitUntil: 'load' })
    await page.waitForTimeout(1500)

    const results = await page.evaluate(collect)
    for (const entry of results) {
      checked += 1
      const key = `${entry.fg} on ${entry.bg} @${entry.size}px/${entry.weight}`
      if (!pairs.has(key)) pairs.set(key, { ...entry, where: `${route} @${width}` })
      if (!entry.pass) failures.push({ ...entry, route, width })
    }

    await context.close()
  }
}

await browser.close()

console.log(
  `${checked} rendered text elements measured across ${ROUTES.length} routes at ${WIDTHS.join(', ')}px`,
)
console.log(`${pairs.size} distinct colour, size and weight combinations\n`)

const sorted = Array.from(pairs.values()).sort((a, b) => a.ratio - b.ratio)
for (const entry of sorted) {
  console.log(
    `${entry.pass ? 'PASS' : 'FAIL'}  ${String(entry.ratio).padStart(6)}  need ${entry.required}  ` +
      `${entry.size}px/${entry.weight}${entry.large ? ' large' : ''}  ${entry.fg} on ${entry.bg}  ` +
      `${entry.tag}: ${entry.text}`,
  )
}

if (failures.length > 0) {
  console.log(`\n${failures.length} failing element instances`)
  process.exitCode = 1
} else {
  console.log('\nEvery rendered text and background pair meets WCAG AA')
}
