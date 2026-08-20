/**
 * JavaScript over the wire, per tier, on the homepage. Development only.
 *
 * Section 11's budget is a number of kilobytes downloaded by a real browser, not a
 * number Next prints at the end of a build: the Full tier's Three.js arrives from a
 * dynamic import after the tier resolves, so it is invisible to the build summary
 * and it is most of the payload. This drives a browser, waits for the field to
 * mount, and adds up every script response.
 *
 * It also greps chunk bodies rather than chunk names for Three.js, because a chunk
 * called 255-abc.js can contain the whole renderer.
 *
 * Two numbers per tier. The transfer figure is the encoded body, which is what the
 * budget in section 11 counts and what the Phase 4 report recorded. The decoded
 * figure is what the browser parses, roughly three times larger, and is the one a
 * build summary shows.
 *
 * Usage: NEXT_DIST_DIR=.next-verify npx next build && npx next start -p 3100
 *        SHOOT_BASE=http://localhost:3100 node scripts/check-bundle.mjs
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

/**
 * Module paths that only exist inside Three.js, R3F, or drei. Matched against the
 * chunk body, so a renamed chunk cannot hide them.
 */
const THREE_MARKERS = [
  'WebGLRenderer',
  'BufferGeometry',
  'ShaderMaterial',
  'PerspectiveCamera',
  '@react-three/fiber',
]

const browser = await chromium.launch()

async function measure(tier, { width, height, reducedMotion = 'no-preference', mobile = false }) {
  const context = await browser.newContext({
    viewport: { width, height },
    reducedMotion,
    hasTouch: mobile,
    isMobile: mobile,
  })
  const page = await context.newPage()

  const scripts = new Map()
  let threeTransfer = 0
  const threeChunks = []

  page.on('response', async (response) => {
    const url = response.url()
    if (!/\.js(\?|$)/.test(url)) return
    if (scripts.has(url)) return
    let body
    let transfer = 0
    try {
      body = await response.body()
      const sizes = await response.request().sizes()
      transfer = sizes.responseBodySize || body.length
    } catch {
      return
    }
    scripts.set(url, { transfer, decoded: body.length })

    const text = body.toString('utf8')
    if (THREE_MARKERS.some((marker) => text.includes(marker))) {
      threeTransfer += transfer
      threeChunks.push(`${url.split('/').pop()} ${(transfer / 1024).toFixed(1)}kb`)
    }
  })

  const query = tier === 'detect' ? '' : `?tier=${tier}`
  await page.goto(`${BASE}/${query}`, { waitUntil: 'load' })
  // Long enough for the tier to resolve, the dynamic import to land, and the
  // scene to mount. The Thread also samples after fonts settle.
  await page.waitForTimeout(4000)
  // Scroll the whole page so anything lazy below the fold is fetched too.
  await page.evaluate(async () => {
    const step = window.innerHeight * 0.8
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y)
      await new Promise((resolve) => requestAnimationFrame(resolve))
    }
    window.scrollTo(0, 0)
  })
  await page.waitForTimeout(1500)

  const state = await page.evaluate(() => ({
    tiers: Array.from(document.querySelectorAll('[data-tier]')).map((node) => node.dataset.tier),
    webgl: document.querySelectorAll('[data-field="webgl"] canvas').length,
    two: document.querySelectorAll('[data-field="2d"]').length,
    canvases: document.querySelectorAll('canvas').length,
    threadPaths: document.querySelectorAll('[data-thread-body]').length,
    streamPoints: Number(
      document.querySelector('[data-thread-stream]')?.getAttribute('data-thread-stream') ?? 0,
    ),
  }))

  let transfer = 0
  let decoded = 0
  for (const size of scripts.values()) {
    transfer += size.transfer
    decoded += size.decoded
  }

  await context.close()
  return { transfer, decoded, threeTransfer, threeChunks, files: scripts.size, state }
}

const rows = []
for (const [tier, options] of [
  ['full', { width: 1440, height: 900 }],
  ['reduced', { width: 900, height: 800 }],
  ['static', { width: 1440, height: 900, reducedMotion: 'reduce' }],
]) {
  const result = await measure(tier, options)
  rows.push([tier, result])
  console.log(
    `${tier.padEnd(8)} ${(result.transfer / 1024).toFixed(1)}kb over the wire` +
      ` (${(result.decoded / 1024).toFixed(1)}kb decoded) in ${result.files} files` +
      `  three=${(result.threeTransfer / 1024).toFixed(1)}kb` +
      `\n         tiers=${JSON.stringify(result.state.tiers)} webgl=${result.state.webgl}` +
      ` 2d=${result.state.two} canvases=${result.state.canvases}` +
      ` paths=${result.state.threadPaths} streamPoints=${result.state.streamPoints}` +
      (result.threeChunks.length ? `\n         ${result.threeChunks.join(', ')}` : ''),
  )
}

await browser.close()

const failures = rows.filter(([tier, result]) => tier !== 'full' && result.threeTransfer > 0)
if (failures.length > 0) {
  console.log(`\nFAIL  Three.js bytes reached ${failures.map(([tier]) => tier).join(', ')}`)
  process.exitCode = 1
} else {
  console.log('\nPASS  zero Three.js bytes on the reduced and static tiers')
}
