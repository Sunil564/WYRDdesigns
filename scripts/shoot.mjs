/**
 * Screenshot harness. Development only, never imported by the app.
 *
 * The brief requires each section checked at 375, 768, and 1440 before a
 * criterion is claimed. No Playwright or DevTools MCP is available in this
 * environment, so this drives the already installed Playwright chromium
 * directly.
 *
 * Usage:
 *   node scripts/shoot.mjs                          all routes, three widths
 *   node scripts/shoot.mjs /tokens                  one route
 *   node scripts/shoot.mjs / --reduced              emulate prefers-reduced-motion
 *   node scripts/shoot.mjs / --width 1440 --full    full page at one width
 *   node scripts/shoot.mjs / --scroll 2400          scroll before shooting
 *
 * Output goes to build-logs/screens, which is gitignored. It also reports
 * console errors, page errors, failed requests, horizontal overflow, and any
 * Three.js bytes downloaded, since those are acceptance criteria too.
 */

import { chromium } from 'playwright'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const BASE = process.env.SHOOT_BASE ?? 'http://localhost:3002'
const OUT = 'build-logs/screens'
const WIDTHS = [375, 768, 1440]

const args = process.argv.slice(2)
const flag = (name) => args.includes(`--${name}`)
const value = (name, fallback) => {
  const index = args.indexOf(`--${name}`)
  return index === -1 ? fallback : args[index + 1]
}

const routes = args.filter((arg) => arg.startsWith('/'))
const targets = routes.length > 0 ? routes : ['/', '/tokens']
const widths = flag('width') ? [Number(value('width'))] : WIDTHS
const reduced = flag('reduced')
const fullPage = flag('full')
const scrollTo = Number(value('scroll', 0))
const label = value('label', reduced ? 'reduced' : 'default')

await mkdir(OUT, { recursive: true })

const browser = await chromium.launch()
const report = []

for (const route of targets) {
  for (const width of widths) {
    const context = await browser.newContext({
      viewport: { width, height: width < 500 ? 812 : 900 },
      deviceScaleFactor: 1,
      reducedMotion: reduced ? 'reduce' : 'no-preference',
    })
    const page = await context.newPage()

    const consoleErrors = []
    const pageErrors = []
    const failed = []
    const threeBytes = []

    page.on('console', (message) => {
      if (message.type() === 'error' || message.type() === 'warning') {
        consoleErrors.push(`${message.type()}: ${message.text()}`)
      }
    })
    page.on('pageerror', (error) => pageErrors.push(error.message))
    page.on('requestfailed', (request) =>
      failed.push(`${request.url()} ${request.failure()?.errorText ?? ''}`),
    )
    page.on('response', (response) => {
      const url = response.url()
      if (/three|r3f|fiber|drei/i.test(url)) threeBytes.push(url)
    })

    await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle' })
    if (scrollTo > 0) {
      await page.evaluate((y) => window.scrollTo(0, y), scrollTo)
      await page.waitForTimeout(1200)
    }
    await page.waitForTimeout(900)

    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }))

    const slug = route === '/' ? 'home' : route.replace(/\//g, '-').replace(/^-/, '')
    const suffix = scrollTo > 0 ? `-y${scrollTo}` : ''
    const file = path.join(OUT, `${slug}-${width}-${label}${suffix}${fullPage ? '-full' : ''}.png`)
    await page.screenshot({ path: file, fullPage })

    report.push({
      route,
      width,
      label,
      file,
      horizontalOverflow: overflow.scrollWidth > overflow.clientWidth + 1 ? overflow : false,
      consoleErrors,
      pageErrors,
      failed,
      threeRequests: threeBytes,
    })

    await context.close()
  }
}

await browser.close()
await writeFile(path.join(OUT, `report-${label}.json`), JSON.stringify(report, null, 2))

for (const entry of report) {
  const problems = [
    entry.horizontalOverflow && `OVERFLOW ${JSON.stringify(entry.horizontalOverflow)}`,
    entry.consoleErrors.length && `CONSOLE ${entry.consoleErrors.join(' | ')}`,
    entry.pageErrors.length && `PAGEERROR ${entry.pageErrors.join(' | ')}`,
    entry.failed.length && `FAILED ${entry.failed.join(' | ')}`,
    entry.threeRequests.length && `THREE ${entry.threeRequests.length} requests`,
  ].filter(Boolean)
  console.log(
    `${entry.route} @${entry.width} ${entry.label} -> ${entry.file}${
      problems.length ? '\n  ' + problems.join('\n  ') : '  clean'
    }`,
  )
}
