/**
 * Phase 2b tier verification. Development only.
 *
 * Criterion 5 in section 11: zero Three.js bytes on the Reduced and Static tiers.
 * Nothing else in the performance budget matters if this fails, so it is measured
 * from the real network log under a throttled mobile profile rather than reasoned
 * about from the import graph.
 *
 * Usage: node scripts/check-tiers.mjs
 * Run against a production build for real numbers: npm run build && npm start
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
const ROUTE = process.env.TIER_ROUTE ?? '/tiers'
const results = []

function record(name, pass, detail = '') {
  results.push({ name, pass, detail })
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? `\n        ${detail}` : ''}`)
}

/** Chunk names and module paths that mean Three.js, R3F, or drei arrived. */
const THREE_PATTERN = /three|fiber|drei|r3f|webgl/i

async function trace(tier, { throttle = false, reducedMotion = 'no-preference' } = {}) {
  const browser = await chromium.launch()
  const context = await browser.newContext({
    viewport: throttle ? { width: 390, height: 844 } : { width: 1440, height: 900 },
    reducedMotion,
    hasTouch: throttle,
    isMobile: throttle,
  })
  const page = await context.newPage()

  if (throttle) {
    // Slow 4G, roughly. Enough to make a 200kb chunk obvious in the log.
    const session = await context.newCDPSession(page)
    await session.send('Network.enable')
    await session.send('Network.emulateNetworkConditions', {
      offline: false,
      latency: 150,
      downloadThroughput: (1.6 * 1024 * 1024) / 8,
      uploadThroughput: (750 * 1024) / 8,
    })
    await session.send('Emulation.setCPUThrottlingRate', { rate: 4 })
  }

  const scripts = []
  page.on('response', async (response) => {
    const url = response.url()
    if (!/\.js(\?|$)/.test(url)) return
    let size = 0
    try {
      const body = await response.body()
      size = body.length
    } catch {
      size = 0
    }
    scripts.push({ url, size })
  })

  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))

  // Set the override before the app boots, so the very first render already knows
  // its tier and no other branch is ever mounted.
  await page.addInitScript((value) => {
    window.localStorage.setItem('wyrd:tier', value)
  }, tier)

  await page.goto(`${BASE}${ROUTE}`, { waitUntil: 'load' })
  await page.waitForTimeout(2500)

  const rendered = await page.getAttribute('[data-tier]', 'data-tier')
  const canvasKind = await page.evaluate(() => {
    const webgl = document.querySelector('[data-field="webgl"] canvas')
    const two = document.querySelector('[data-field="2d"]')
    if (webgl) return 'webgl'
    if (two) return '2d'
    return 'none'
  })

  const threeScripts = scripts.filter((entry) => THREE_PATTERN.test(entry.url))
  const totalBytes = scripts.reduce((sum, entry) => sum + entry.size, 0)
  const threeBytes = threeScripts.reduce((sum, entry) => sum + entry.size, 0)

  // Transfer size, which is what the budget in section 11 is denominated in.
  // encodedBodySize is the compressed bytes actually sent over the wire.
  const transferBytes = await page.evaluate(() =>
    performance
      .getEntriesByType('resource')
      .filter((entry) => entry.name.endsWith('.js'))
      .reduce((sum, entry) => sum + (entry.encodedBodySize || 0), 0),
  )

  // Chunk names are hashed, so a name match is not proof either way. Read the
  // chunk contents and look for Three.js's own identifiers.
  let threeInBodies = []
  for (const entry of scripts) {
    try {
      const response = await page.request.get(entry.url)
      const text = await response.text()
      if (/WebGLRenderer|BufferGeometry|ShaderMaterial|react-three/.test(text)) {
        threeInBodies.push({ url: entry.url, size: entry.size })
      }
    } catch {
      // A chunk that cannot be refetched is not evidence of anything.
    }
  }

  await browser.close()

  return {
    tier,
    rendered,
    canvasKind,
    scriptCount: scripts.length,
    totalBytes,
    transferBytes,
    threeBytes,
    threeScripts,
    threeInBodies,
    errors,
  }
}

const full = await trace('full')
const reduced = await trace('reduced', { throttle: true })
const still = await trace('static', { reducedMotion: 'reduce' })

const kb = (bytes) => `${(bytes / 1024).toFixed(1)}kb`

record(
  'forcing full renders the full branch',
  full.rendered === 'full',
  `data-tier=${full.rendered}`,
)
record('full tier mounts a WebGL canvas', full.canvasKind === 'webgl', full.canvasKind)
record(
  'full tier actually downloads Three.js',
  full.threeInBodies.length > 0,
  `${full.threeInBodies.length} chunks carry Three.js identifiers, ${kb(full.transferBytes)} JS over the wire, ${kb(full.totalBytes)} decompressed`,
)

record(
  'forcing reduced renders the reduced branch',
  reduced.rendered === 'reduced',
  `data-tier=${reduced.rendered}`,
)
record('reduced tier mounts the 2D canvas', reduced.canvasKind === '2d', reduced.canvasKind)
record(
  'ZERO Three.js bytes on the reduced tier',
  reduced.threeInBodies.length === 0 && reduced.threeBytes === 0,
  `${kb(reduced.transferBytes)} JS over the wire, three-ish chunks: ${JSON.stringify(reduced.threeScripts.map((s) => s.url))}, bodies: ${JSON.stringify(reduced.threeInBodies.map((s) => s.url))}`,
)

record(
  'forcing static renders the static branch',
  still.rendered === 'static',
  `data-tier=${still.rendered}`,
)
record('static tier mounts no canvas at all', still.canvasKind === 'none', still.canvasKind)
record(
  'ZERO Three.js bytes on the static tier',
  still.threeInBodies.length === 0 && still.threeBytes === 0,
  `${kb(still.transferBytes)} JS over the wire`,
)

record(
  'reduced tier JS stays under the 250kb gzipped budget',
  reduced.transferBytes < 250 * 1024,
  `${kb(reduced.transferBytes)} over the wire on ${ROUTE}`,
)
record(
  'full tier JS stays under the 500kb gzipped budget',
  full.transferBytes < 500 * 1024,
  `${kb(full.transferBytes)} over the wire on ${ROUTE}`,
)

record(
  'no page errors on any tier',
  full.errors.length === 0 && reduced.errors.length === 0 && still.errors.length === 0,
  [...full.errors, ...reduced.errors, ...still.errors].join(' | '),
)

// -------------------------------------------------------- context loss and leaks
{
  const browser = await chromium.launch()
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()
  await page.addInitScript(() => window.localStorage.setItem('wyrd:tier', 'full'))
  await page.goto(`${BASE}${ROUTE}`, { waitUntil: 'load' })
  await page.waitForTimeout(1500)

  await page.getByTestId('lose-context').click()
  await page.waitForTimeout(1500)

  const afterLoss = await page.getAttribute('[data-tier]', 'data-tier')
  const canvasAfterLoss = await page.evaluate(() => {
    const webgl = document.querySelector('[data-field="webgl"] canvas')
    const two = document.querySelector('[data-field="2d"]')
    if (two) return '2d'
    if (webgl) return 'webgl'
    return 'none'
  })
  record(
    'context loss falls back to the reduced tier, not a black rectangle',
    afterLoss === 'reduced' && canvasAfterLoss === '2d',
    `data-tier=${afterLoss} canvas=${canvasAfterLoss}`,
  )

  // Ten mount and unmount cycles, watching live WebGL contexts and JS heap.
  await page.reload({ waitUntil: 'load' })
  await page.waitForTimeout(1500)

  const before = await page.evaluate(async () => {
    if (window.gc) window.gc()
    const memory = performance.memory
    return memory ? memory.usedJSHeapSize : 0
  })

  await page.getByTestId('cycle').click()
  await page.waitForTimeout(6000)
  const cycles = await page.getByTestId('cycles').textContent()

  const after = await page.evaluate(() => {
    const memory = performance.memory
    return memory ? memory.usedJSHeapSize : 0
  })

  const contexts = await page.evaluate(
    () => document.querySelectorAll('[data-field="webgl"] canvas').length,
  )

  const growth = before > 0 ? (after - before) / before : 0
  record(
    'ten mount and unmount cycles leave one canvas and no runaway heap',
    contexts <= 1 && growth < 0.6,
    `cycles=${cycles} canvases=${contexts} heap ${kb(before)} to ${kb(after)} (${(growth * 100).toFixed(1)}%)`,
  )

  await browser.close()
}

const failed = results.filter((entry) => !entry.pass)
console.log(`\n${results.length - failed.length}/${results.length} checks passed`)
if (failed.length > 0) process.exitCode = 1
