/**
 * Prove the arc length table samples the same route the browser does.
 *
 * `samplePaths` stopped calling `getPointAtLength` and started walking a flattened arc length
 * table instead, for the reason in docs/BLOCKERS.md item 19. That is a numerical
 * reimplementation of a browser primitive, which is exactly the kind of change that looks
 * right and is subtly off, so this diffs the two against each other on the real route rather
 * than trusting either.
 *
 * Both samplers run in the same document, against the same path elements, at the same arc
 * lengths. The browser's answer is the reference. Nothing here copies a geometry constant: the
 * lengths walked are read from the page's own paths.
 *
 * Development only. Needs the verification server.
 */

import { chromium } from 'playwright'
import { assertBuildFresh } from './build-fresh.mjs'

const BASE = process.env.SHOOT_BASE ?? 'http://localhost:3000'
assertBuildFresh({ base: BASE })

/* Both routes matter: below 1024px the thread is one woven cubic, above it the branching set. */
const VIEWPORTS = [
  { label: 'narrow, woven route', width: 412, height: 823, mobile: true },
  { label: 'wide, branching route', width: 1440, height: 900, mobile: false },
]

/*
  Byte identical was the thing to aim at and it is not achievable, for a reason worth stating
  rather than working around: `getPointAtLength` is itself an approximation. Refining our
  subdivision drives our total arc length to 8145.714733 on the narrow route and it stays
  there, while the browser reports 8145.726074. The 1.13e-2px between them does not close at
  any subdivision, so it is the browser's flattening error and not ours.

  So the criteria are the two honest ones. Agreement is bounded well below what the render can
  express, and separately our own sampler is shown to have converged, which is what puts the
  residual on the browser's side rather than assuming it.
*/
const POSITION_TOLERANCE = 0.05

/*
  Doubling the subdivision must not move our own total. This is what makes the bound above
  meaningful: agreeing to 0.05px would prove nothing if our own number were still drifting with
  the subdivision, and this is measured in the page rather than reasoned about.

  Relative, because the paths are not the same size. An absolute bound held the 489px branches
  to the same movement as the 5282px one and called the long one a failure at 2.012e-3px, which
  is a stricter test of a longer path for no reason. One part per million of its own length is
  the scale free version of the same question.
*/
const CONVERGENCE_TOLERANCE = 1e-6

const results = []
function record(name, pass, detail = '') {
  results.push({ name, pass })
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? `\n        ${detail}` : ''}`)
}

const browser = await chromium.launch()

for (const viewport of VIEWPORTS) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    hasTouch: viewport.mobile,
    isMobile: viewport.mobile,
  })
  const page = await context.newPage()
  await page.goto(`${BASE}/`, { waitUntil: 'load' })
  await page.waitForTimeout(3000)

  const report = await page.evaluate(() => {
    const paths = Array.from(document.querySelectorAll('[data-thread-body]'))
    if (paths.length === 0) return { paths: 0, perPath: [] }

    /*
      The same flattening the component ships, written out here rather than imported: the
      bundle is minified and this function is not exposed to the page. Kept deliberately
      literal so a divergence is a divergence in the maths and not in the harness.
    */
    const flatten = (d, FLATTEN_STEPS) => {
      const tokens = d
        .trim()
        .split(/[\s,]+/)
        .filter(Boolean)
      const xs = []
      const ys = []
      let i = 0
      let cmd = ''
      let x = 0
      let y = 0
      const num = () => Number(tokens[i++])
      while (i < tokens.length) {
        if (/^[A-Za-z]$/.test(tokens[i])) cmd = tokens[i++]
        if (cmd === 'M') {
          x = num()
          y = num()
          xs.push(x)
          ys.push(y)
          cmd = 'L'
        } else if (cmd === 'L') {
          x = num()
          y = num()
          xs.push(x)
          ys.push(y)
        } else if (cmd === 'C') {
          const x1 = num()
          const y1 = num()
          const x2 = num()
          const y2 = num()
          const x3 = num()
          const y3 = num()
          const x0 = x
          const y0 = y
          for (let s = 1; s <= FLATTEN_STEPS; s += 1) {
            const t = s / FLATTEN_STEPS
            const u = 1 - t
            xs.push(u * u * u * x0 + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x3)
            ys.push(u * u * u * y0 + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y3)
          }
          x = x3
          y = y3
        } else {
          throw new Error(`unhandled path command ${cmd}`)
        }
      }
      const lengths = new Float64Array(xs.length)
      let total = 0
      for (let k = 1; k < xs.length; k += 1) {
        total += Math.hypot(xs[k] - xs[k - 1], ys[k] - ys[k - 1])
        lengths[k] = total
      }
      return { xs, ys, lengths, total }
    }

    const at = (flat, distance) => {
      const last = flat.lengths.length - 1
      if (distance <= 0) return { x: flat.xs[0], y: flat.ys[0] }
      if (distance >= flat.total) return { x: flat.xs[last], y: flat.ys[last] }
      let low = 0
      let high = last
      while (low < high) {
        const mid = (low + high) >> 1
        if (flat.lengths[mid] < distance) low = mid + 1
        else high = mid
      }
      const upper = low === 0 ? 1 : low
      const before = flat.lengths[upper - 1]
      const span = flat.lengths[upper] - before
      const t = span > 0 ? (distance - before) / span : 0
      return {
        x: flat.xs[upper - 1] + (flat.xs[upper] - flat.xs[upper - 1]) * t,
        y: flat.ys[upper - 1] + (flat.ys[upper] - flat.ys[upper - 1]) * t,
      }
    }

    const out = { paths: paths.length, perPath: [] }
    for (const element of paths) {
      const d = element.getAttribute('d') ?? ''
      const flat = flatten(d, 512)
      /* The same path at twice the subdivision, to show our own answer has stopped moving. */
      const finer = flatten(d, 1024)
      const domTotal = element.getTotalLength()

      /*
        Sampled at the arc lengths the component uses, mid step, so this walks the identical
        positions rather than a convenient grid of its own.
      */
      const count = 1222
      let worst = 0
      let worstAt = 0
      let sum = 0
      let exact = 0
      for (let step = 0; step < count; step += 1) {
        const distance = ((step + 0.5) / count) * flat.total
        const mine = at(flat, distance)
        const theirs = element.getPointAtLength(distance)
        const deviation = Math.hypot(mine.x - theirs.x, mine.y - theirs.y)
        if (deviation === 0) exact += 1
        sum += deviation
        if (deviation > worst) {
          worst = deviation
          worstAt = distance
        }
      }
      out.perPath.push({
        domTotal,
        mineTotal: flat.total,
        finerTotal: finer.total,
        convergence: Math.abs(finer.total - flat.total),
        lengthDelta: Math.abs(domTotal - flat.total),
        vertices: flat.xs.length,
        samples: count,
        exact,
        worst,
        worstAt,
        mean: sum / count,
      })
    }
    return out
  })

  if (!report.paths) {
    record(`${viewport.label}: thread paths are in the DOM to sample`, false, 'found none')
    await context.close()
    continue
  }

  record(
    `${viewport.label}: thread paths are in the DOM to sample`,
    true,
    `${report.paths} path(s)`,
  )

  const detail = report.perPath
    .map(
      (entry, index) =>
        `path ${index}: ${entry.vertices} vertices, length ${entry.mineTotal.toFixed(4)} ` +
        `against the browser's ${entry.domTotal.toFixed(4)}, delta ` +
        `${entry.lengthDelta.toExponential(3)}\n        ` +
        `          ${entry.exact} of ${entry.samples} samples bit exact, worst deviation ` +
        `${entry.worst.toExponential(3)}px at length ${entry.worstAt.toFixed(1)}, mean ` +
        `${entry.mean.toExponential(3)}px`,
    )
    .join('\n        ')
  console.log(`\n        ${detail}\n`)

  const worst = Math.max(...report.perPath.map((entry) => entry.worst))
  const worstMean = Math.max(...report.perPath.map((entry) => entry.mean))
  const worstLength = Math.max(...report.perPath.map((entry) => entry.lengthDelta))
  const worstConvergence = Math.max(
    ...report.perPath.map((entry) => entry.convergence / entry.mineTotal),
  )
  const worstConvergenceAbs = Math.max(...report.perPath.map((entry) => entry.convergence))
  const totalExact = report.perPath.reduce((sum, entry) => sum + entry.exact, 0)
  const totalSamples = report.perPath.reduce((sum, entry) => sum + entry.samples, 0)

  record(
    `${viewport.label}: every sample lands within ${POSITION_TOLERANCE}px of the browser's`,
    worst < POSITION_TOLERANCE,
    `worst ${worst.toExponential(3)}px, mean ${worstMean.toExponential(3)}px, ` +
      `${totalExact} of ${totalSamples} samples bit exact`,
  )
  record(
    `${viewport.label}: our own sampler has converged, so the residual is the browser's`,
    worstConvergence < CONVERGENCE_TOLERANCE,
    `doubling the subdivision moves our total by at most ${worstConvergenceAbs.toExponential(3)}px, ` +
      `which is ${worstConvergence.toExponential(2)} of its own length, against a standing ` +
      `${worstLength.toExponential(3)}px disagreement with getTotalLength.`,
  )

  await context.close()
}

await browser.close()

const failed = results.filter((entry) => !entry.pass)
console.log(`\n${results.length - failed.length}/${results.length} checks passed`)
if (failed.length > 0) process.exitCode = 1
