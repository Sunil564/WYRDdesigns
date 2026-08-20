/**
 * Ink measurement on a patch of canvas. Development only.
 *
 * The brief judges the particle field by eye, and a compressed screenshot in a
 * report is not the eye. This puts numbers next to the picture: how much of a text
 * free patch the field actually darkens, how far from white the darkest point gets,
 * and what fraction of the patch carries the accent. Phase 4b tuned the field the
 * same way, so the before and after numbers are comparable.
 *
 * Usage:
 *   node scripts/measure-ink.mjs                        the hero patch at 1440
 *   node scripts/measure-ink.mjs --scroll 4200          a patch further down
 *   node scripts/measure-ink.mjs --clip 200,480,1100,400
 *   node scripts/measure-ink.mjs --tier reduced
 */

import { chromium } from 'playwright'

const BASE = process.env.SHOOT_BASE ?? 'http://localhost:3000'
const args = process.argv.slice(2)
const value = (name, fallback) => {
  const index = args.indexOf(`--${name}`)
  return index === -1 ? fallback : args[index + 1]
}

const width = Number(value('width', 1440))
const height = Number(value('height', 900))
const tier = value('tier', 'full')
const scrollTo = Number(value('scroll', 0))
const settle = Number(value('settle', 4000))
const label = value('label', 'patch')
// A text free patch of the hero at 1440: below the headline, left of nothing.
const clip = (value('clip', '200,470,1100,410') ?? '').split(',').map(Number)

const browser = await chromium.launch()
const context = await browser.newContext({ viewport: { width, height } })
const page = await context.newPage()
/*
  Load twice. The first load of a cold server compiles and fetches, the scene
  mounts late, and its opacity is still ramping when the shot is taken: the first
  measurement of a session came in 14 percent light and sent the tuning pass the
  wrong way once already. The second load is warm and repeatable to two decimal
  places.
*/
await page.goto(`${BASE}/?tier=${tier}`, { waitUntil: 'load' })
await page.waitForTimeout(1500)
await page.reload({ waitUntil: 'load' })
if (scrollTo > 0) {
  await page.evaluate((y) => window.scrollTo(0, y), scrollTo)
}
await page.waitForTimeout(settle)

const shot = await page.screenshot({
  clip: { x: clip[0], y: clip[1], width: clip[2], height: clip[3] },
})

const stats = await page.evaluate(async (base64) => {
  const blob = await (await fetch(`data:image/png;base64,${base64}`)).blob()
  const bitmap = await createImageBitmap(blob)
  const surface = new OffscreenCanvas(bitmap.width, bitmap.height)
  const ctx = surface.getContext('2d')
  ctx.drawImage(bitmap, 0, 0)
  const { data } = ctx.getImageData(0, 0, bitmap.width, bitmap.height)

  let sum = 0
  let sumSquares = 0
  let darkest = 255
  let inked = 0
  let strongInk = 0
  let accent = 0
  const pixels = data.length / 4

  for (let index = 0; index < data.length; index += 4) {
    const r = data[index]
    const g = data[index + 1]
    const b = data[index + 2]
    // Perceived lightness is not needed here, a plain mean channel is enough and
    // is directly comparable to the level values Phase 4b recorded.
    const level = (r + g + b) / 3
    sum += level
    sumSquares += level * level
    if (level < darkest) darkest = level
    // The grain alone lands within a level or two of white, so the threshold is
    // set where a particle starts and the texture stops.
    if (level < 250) inked += 1
    if (level < 235) strongInk += 1
    // Orange: red well clear of blue. Neutral particles have r, g, b together.
    if (r - b > 40 && r > 140) accent += 1
  }

  const mean = sum / pixels
  return {
    width: bitmap.width,
    height: bitmap.height,
    mean: Number(mean.toFixed(2)),
    deviation: Number(Math.sqrt(sumSquares / pixels - mean * mean).toFixed(2)),
    darkest: Number(darkest.toFixed(0)),
    // Level-pixels of ink per thousand pixels, which is the figure that tracks
    // "how heavy does this read" better than a coverage percentage alone.
    inkPerThousand: Number((((255 - mean) * 1000) / 255).toFixed(2)),
    inkedPercent: Number(((inked / pixels) * 100).toFixed(2)),
    strongInkPercent: Number(((strongInk / pixels) * 100).toFixed(2)),
    accentPercent: Number(((accent / pixels) * 100).toFixed(3)),
  }
}, shot.toString('base64'))

console.log(
  `${label}  ${tier} @${width}x${height} scroll=${scrollTo} clip=${clip.join(',')}\n` +
    `  mean ${stats.mean} of 255, sd ${stats.deviation}, darkest ${stats.darkest}\n` +
    `  ink ${stats.inkPerThousand} per thousand, ${stats.inkedPercent}% of pixels below 250, ` +
    `${stats.strongInkPercent}% below 235\n` +
    `  accent ${stats.accentPercent}% of pixels`,
)

await browser.close()
