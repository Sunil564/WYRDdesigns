/**
 * Thread capture and weight measurement. Development only.
 *
 * Criteria 7 and 10 of the particle brief are comparisons: the stream has to follow
 * the exact route the old line followed, and it has to carry the same visual weight
 * the old hairline had. Both need the same frames from before and after, taken at
 * the same widths and the same scroll offsets, or the comparison is a guess.
 *
 * Screenshots are viewport shots, not full page ones, because the particle
 * renderers are fixed to the viewport: a full page capture would paint them once
 * and tile everything else.
 *
 * Scroll offsets are derived from anchors measured in the page, so the same stop
 * means the same section in both runs even if the page height differs by a pixel.
 *
 * Usage:
 *   SHOOT_BASE=http://localhost:3100 node scripts/shoot-thread.mjs --label before
 *   SHOOT_BASE=http://localhost:3100 node scripts/shoot-thread.mjs --label after --tier reduced
 */

import { chromium } from 'playwright'
import { mkdir, writeFile } from 'node:fs/promises'
import { assertBuildFresh } from './build-fresh.mjs'

const BASE = process.env.SHOOT_BASE ?? 'http://localhost:3000'

/*
  Refuse to measure a build older than the source. The harness serves a prebuilt
  directory with no HMR, so without this it will quietly report on code that is not
  the code under test. See scripts/build-fresh.mjs.
*/
assertBuildFresh({ base: BASE })
const OUT = 'build-logs/screens'
const args = process.argv.slice(2)
const value = (name, fallback) => {
  const index = args.indexOf(`--${name}`)
  return index === -1 ? fallback : args[index + 1]
}

const label = value('label', 'thread')
const tier = value('tier', 'full')
const widths = (value('widths', '1024,1440,1920') ?? '').split(',').map(Number)

/**
 * Anchors down the page, each a selector plus how far into it to sit. These are the
 * moments the Thread has to be judged at: the trunk below the hero, the branch
 * point, the four strands, and the dark block it terminates in.
 */
const STOPS = [
  { name: 'trunk', selector: '#positioning', offset: -0.25 },
  { name: 'branch', selector: '[data-thread-branch-point]', offset: -0.35 },
  { name: 'clusters', selector: '[data-thread-branch-target]', offset: 0.2 },
  { name: 'strands', selector: '#work', offset: 0.1 },
  { name: 'gather', selector: '#process', offset: 0 },
  { name: 'converge', selector: '#contact-cta', offset: -0.1 },
]

/**
 * The weight measurement, run in the page against a screenshot of it.
 *
 * A column down the page centre is where the trunk runs, but it is also where
 * centred headlines and dark cards run, and a first attempt at this averaged those
 * in and reported a contrast of 240 against a ground of 252. So a row only counts if
 * what it contains looks like a thread: exactly one contiguous feature, no wider
 * than a hairline plus the stream's scatter, on a uniform ground. Everything else in
 * the column is discarded.
 *
 * Three figures. Contrast is the peak deviation from the ground, which for the old
 * hairline is the 1.33:1 the palette specifies. Ink per row is the summed deviation
 * across the feature, which is what answers "does it carry the same weight".
 * Coverage is the share of rows with a feature at all, which is where a stream
 * differs from a solid line: a stream can match the ink per row and still read
 * lighter if it occupies only two rows in three.
 */
async function profileOf(page) {
  const shot = (await page.screenshot()).toString('base64')
  return page.evaluate(async (base64) => {
    const blob = await (await fetch(`data:image/png;base64,${base64}`)).blob()
    const bitmap = await createImageBitmap(blob)
    const surface = new OffscreenCanvas(bitmap.width, bitmap.height)
    const ctx = surface.getContext('2d')
    ctx.drawImage(bitmap, 0, 0)
    const { data } = ctx.getImageData(0, 0, bitmap.width, bitmap.height)
    const level = (x, y) => {
      const index = (y * bitmap.width + x) * 4
      return (data[index] + data[index + 1] + data[index + 2]) / 3
    }

    const half = Math.floor(bitmap.width / 2)
    const span = 30
    const MAX_FEATURE = 12
    const NOISE = 4

    let rows = 0
    let featured = 0
    const contrasts = []
    const inks = []
    const grounds = []

    for (let y = 110; y < bitmap.height - 110; y += 2) {
      const edges = []
      for (let x = 4; x < 56; x += 4) edges.push(level(x, y))
      for (let x = bitmap.width - 56; x < bitmap.width - 4; x += 4) edges.push(level(x, y))
      edges.sort((a, b) => a - b)
      const ground = edges[Math.floor(edges.length / 2)]
      // A row whose own margins disagree is a row crossing a block edge.
      if (edges[edges.length - 1] - edges[0] > 24) continue
      rows += 1
      grounds.push(ground)

      const runs = []
      let run = null
      for (let x = half - span; x <= half + span; x += 1) {
        const deviation = Math.abs(level(x, y) - ground)
        if (deviation > NOISE) {
          run = run ?? { width: 0, peak: 0, ink: 0 }
          run.width += 1
          run.ink += deviation
          run.peak = Math.max(run.peak, deviation)
        } else if (run) {
          runs.push(run)
          run = null
        }
      }
      if (run) runs.push(run)

      if (runs.length !== 1) continue
      if (runs[0].width > MAX_FEATURE) continue
      featured += 1
      contrasts.push(runs[0].peak)
      inks.push(runs[0].ink)
    }

    const mean = (list) =>
      list.length ? list.reduce((sum, value) => sum + value, 0) / list.length : 0
    return {
      rows,
      featured,
      ground: Number(mean(grounds).toFixed(1)),
      coverage: rows ? Number(((featured / rows) * 100).toFixed(1)) : 0,
      contrast: Number(mean(contrasts).toFixed(1)),
      inkPerRow: Number(mean(inks).toFixed(1)),
    }
  }, shot)
}

await mkdir(OUT, { recursive: true })
const browser = await chromium.launch()
const report = []

for (const width of widths) {
  const context = await browser.newContext({ viewport: { width, height: 900 } })
  const page = await context.newPage()
  await page.goto(`${BASE}/?tier=${tier}`, { waitUntil: 'load' })
  await page.waitForTimeout(1200)
  // Warm, for the same reason measure-ink reloads: a cold first paint mounts the
  // scene late and the frame is not the frame a visitor sees.
  await page.reload({ waitUntil: 'load' })
  await page.waitForTimeout(2500)

  // Walk the whole page once so every ScrollTrigger exists and every reveal has
  // fired. Reveal is scrubbed, so a given offset gives the same state whichever
  // direction it was reached from.
  await page.evaluate(async () => {
    const step = window.innerHeight * 0.6
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y)
      await new Promise((resolve) => setTimeout(resolve, 60))
    }
  })
  await page.waitForTimeout(800)

  for (const stop of STOPS) {
    const target = await page.evaluate(
      ([selector, offset]) => {
        const element = document.querySelector(selector)
        if (!element) return null
        const box = element.getBoundingClientRect()
        return Math.max(0, Math.round(box.top + window.scrollY + box.height * offset))
      },
      [stop.selector, stop.offset],
    )
    if (target === null) {
      report.push(`${width} ${stop.name}: selector ${stop.selector} not found`)
      console.log(report[report.length - 1])
      continue
    }

    await page.evaluate((y) => window.scrollTo(0, y), target)
    // Long enough for scrub: 1 to settle and for Lenis to stop easing.
    await page.waitForTimeout(1400)

    const file = `${OUT}/thread-${width}-${stop.name}-${label}.png`
    await page.screenshot({ path: file })
    const profile = await profileOf(page)

    report.push(
      `${width} ${stop.name} y=${target} -> ${file}\n` +
        `    ground ${profile.ground} contrast ${profile.contrast} ink/row ${profile.inkPerRow} ` +
        `coverage ${profile.coverage}% (${profile.featured}/${profile.rows} rows)`,
    )
    console.log(report[report.length - 1])
  }

  await context.close()
}

await browser.close()
await writeFile(`build-logs/thread-${label}-${tier}.txt`, `${report.join('\n')}\n`, 'utf8')
console.log(`\nwrote build-logs/thread-${label}-${tier}.txt`)
