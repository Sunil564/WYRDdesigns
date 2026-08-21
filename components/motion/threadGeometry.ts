'use client'

/**
 * The Thread's geometry. One definition of the route, for every tier.
 *
 * Two jobs, deliberately in one file and deliberately free of any Three.js import
 * so the Reduced tier can use all of it:
 *
 * 1. `measure` reads the DOM and produces the SVG path data. Sections mark
 *    themselves with data attributes and nothing here is hardcoded.
 * 2. `samplePaths` walks those same paths, once they are in the DOM, and turns them
 *    into particle positions by arc length.
 *
 * The SVG paths stay the single source of truth for the route. Step 2 reads them
 * back out of the document with `getTotalLength` and `getPointAtLength` rather than
 * re-deriving the curve, so the particles cannot drift from the geometry the layout
 * produced. See docs/decisions/0020.
 */

/** A stretch of page where the ground is dark and the Thread must invert. */
export type ThreadBand = { top: number; bottom: number }

/**
 * Which part of the route a path is. The trunk carries full density, the four
 * branches and the four strands carry a fraction of it, so splitting into four
 * conserves the visual weight instead of quadrupling it.
 */
export type ThreadPathKind = 'trunk' | 'branch'

export type ThreadPath = {
  d: string
  kind: ThreadPathKind
  /** ScrollTrigger start element, as a selector. */
  start: string
  /** ScrollTrigger end element, as a selector. */
  end: string
}

export type ThreadGeometry = {
  /** Host box, in host local pixels. The SVG user space is this box, 1:1. */
  width: number
  height: number
  /** Document y of the host's top edge, so local coordinates can become document ones. */
  hostTop: number
  /** Every path on the route, in draw order: trunk, four branches, four strands. */
  paths: ThreadPath[]
  /** Stretches of page where the ground is dark, in document coordinates. */
  bands: ThreadBand[]
  /** The hero section's document box, which is the field's clip and its handoff cue. */
  hero: ThreadBand | null
}

/** Length of the accent coloured segment that follows the draw head, in px. */
export const HEAD_LENGTH = 240

/**
 * Particles per pixel of trunk at any width, chosen so the trunk reads as a
 * continuous stream rather than a dotted line. Density is per pixel of path, not a
 * total, so a taller page gets more particles rather than a sparser thread.
 *
 * The value is set from the route as measured, not guessed. Trunk plus a weighted
 * branch total is 6,669px at 1024 and 7,637px at 1920, so the whole route costs
 * `density * that`, which puts every width from 1024 up between 10,000 and 11,500
 * points at 1.5. That is mid band for `POINT_BAND` with room on both sides for the
 * page to grow. At the 2.2 this started at, the natural count was 16,181 at 1440 and
 * `MAX_POINTS` was quietly thinning it, which is why the band is now asserted below
 * rather than hoped for.
 */
const TRUNK_DENSITY = 1.5

/**
 * Branch and strand density, as a fraction of the trunk. Four branches at rather
 * less than a third each is the brief's weight conservation: the split reads as one
 * thread dividing, not as four new threads. Particle brief 2.4.
 */
const BRANCH_DENSITY = 0.28

/**
 * The loop around the client logo set. Brief item C.
 *
 * `LOOP_CLEARANCE` is how far outside the logo bounding box each arc's widest point
 * sits, and `LOOP_RISE` how far above and below the box each arc leaves and rejoins its
 * strand. Together they set the enclosed shape, which is much wider than it is tall
 * because the logo row is: a true circle would either crop the row or balloon the
 * section, which is what the brief says and what the measurements confirm.
 *
 * Clearance is measured from the box, not from a mark, so no arc can come close enough
 * to a logo to compete with it. The client logos are the only real assets on this site.
 */
const LOOP_CLEARANCE = 60
const LOOP_RISE = 56

/**
 * Cubic approximation of a quarter ellipse. The usual constant: control points at
 * 0.5523 of the radius give a curve within a thousandth of a true ellipse, which is
 * three orders of magnitude better than anything visible at this scale.
 */
const ARC_K = 0.5523

/**
 * Static perpendicular scatter, in pixels. A mathematically thin line of points
 * reads as a dashed rule. A little width across the path makes it a stream.
 */
const SPREAD = 1.7

/**
 * The particle brief 2.3 band for the whole route, at full density and any width.
 * A count outside it is a drift signal, not something to absorb: it means the page
 * has grown or the density is wrong, and either way the number to change is
 * `TRUNK_DENSITY`. Checked at full density only, since the Reduced tier is a third
 * of it by design.
 */
const POINT_BAND = { min: 8000, max: 12000 }

/**
 * Hard ceiling, whatever the page height. Nothing is allowed to run away.
 *
 * A ceiling that silently rewrites the geometry under you is a trap: the thread was
 * shipped at 16,000 points for two builds looking like a deliberate number when it
 * was the cap engaging. So both this and the band above announce themselves.
 */
const MAX_POINTS = 16000

function boxOf(element: Element, scrollY: number) {
  const rect = element.getBoundingClientRect()
  return {
    x: rect.left + rect.width / 2 + window.scrollX,
    y: rect.top + rect.height / 2 + scrollY,
    top: rect.top + scrollY,
    bottom: rect.bottom + scrollY,
    left: rect.left + window.scrollX,
    right: rect.right + window.scrollX,
  }
}

/**
 * Measure the route from the DOM.
 *
 * Above 1024px: one line down to the capabilities section, four strands from there
 * to the four cluster blocks, four strands running down the page, reconverging into
 * one line that terminates at the contact button.
 *
 * Below 1024px: a single straight vertical line. Branch geometry depends on a two
 * column grid that does not exist on mobile.
 */
export function measure(host: HTMLElement, wide: boolean): ThreadGeometry | null {
  const scrollY = window.scrollY
  const width = host.offsetWidth
  const height = host.offsetHeight
  if (width === 0 || height === 0) return null

  const hostTop = host.getBoundingClientRect().top + scrollY
  const toLocal = (value: number) => value - hostTop

  const origin = document.querySelector('[data-thread-origin]')
  const branchPoint = document.querySelector('[data-thread-branch-point]')
  const targets = Array.from(document.querySelectorAll('[data-thread-branch-target]'))
  const nodes = Array.from(document.querySelectorAll('[data-thread-node]'))
  const converge = document.querySelector('[data-thread-converge]')

  /*
    Every full bleed dark block on the page, in document coordinates. The Thread
    has to change colour for exactly these stretches or it disappears into them.
    Document rather than host local, because the particle renderers are fixed to
    the viewport and the footer is outside the host entirely.
  */
  const bands: ThreadBand[] = Array.from(document.querySelectorAll('[data-inverse-band]')).map(
    (element) => {
      const box = boxOf(element, scrollY)
      return { top: box.top, bottom: box.bottom }
    },
  )

  const heroElement = document.querySelector('#hero')
  const heroBox = heroElement ? boxOf(heroElement, scrollY) : null
  const hero = heroBox ? { top: heroBox.top, bottom: heroBox.bottom } : null

  const centreX = width / 2
  const startY = origin ? toLocal(boxOf(origin, scrollY).bottom) : 0
  const endY = converge ? toLocal(boxOf(converge, scrollY).top) : height
  const convergeX = converge ? boxOf(converge, scrollY).x : centreX

  // Mobile and anything narrow: one straight vertical line, nothing else.
  if (!wide || targets.length !== 4 || !branchPoint) {
    return {
      width,
      height,
      hostTop,
      paths: [
        {
          d: `M ${centreX} ${startY} L ${centreX} ${endY}`,
          kind: 'trunk',
          start: '[data-thread-origin]',
          end: '[data-thread-converge]',
        },
      ],
      bands,
      hero,
    }
  }

  const branch = boxOf(branchPoint, scrollY)
  const branchY = toLocal(branch.top)

  // The trunk: hero bottom, through any nodes above the branch point, to the branch.
  const spinePoints = nodes
    .map((node) => boxOf(node, scrollY))
    .filter((point) => toLocal(point.y) > startY && toLocal(point.y) < branchY)
    .map((point) => ({ x: centreX, y: toLocal(point.y) }))

  let spine = `M ${centreX} ${startY}`
  for (const point of spinePoints) {
    spine += ` L ${point.x} ${point.y}`
  }
  spine += ` L ${centreX} ${branchY}`

  // Four branches, from the branch point to the top centre of each cluster block.
  const branchTargets = targets.map((target) => boxOf(target, scrollY))
  const branches = branchTargets.map((target) => {
    const x = target.x
    const y = toLocal(target.top)
    const midY = (branchY + y) / 2
    // A cubic that leaves the trunk vertically and arrives vertically, so the
    // split reads as a strand separating rather than a diagonal line.
    return `M ${centreX} ${branchY} C ${centreX} ${midY} ${x} ${midY} ${x} ${y}`
  })

  // Four strands from the bottom of each cluster block down the page, converging
  // on the contact button. They pass behind the sections between, which is what
  // makes the page read as one continuous thing.
  const strandStartY = Math.max(...branchTargets.map((target) => toLocal(target.bottom)))
  /*
    The client logo set, if it is on the page, as the box the loop encloses.

    Measured from the DOM like everything else on this route: the row's width is
    intrinsic to the six marks and is not a fraction of the viewport, so it cannot be
    derived from the layout grid. At 1440 it measures 751 by 40, and 751 by 40 at 1024
    and 1920 too, which is why the arcs bow much further at the narrow width.
  */
  const loopHost = document.querySelector('[data-thread-loop]')
  const loop = (() => {
    if (!loopHost) return null
    /*
      The union of the host's children, not the host's own box.

      The host is a flex row that spans the content column, so its box is 1344px wide at
      1440 while the six marks inside it occupy 751. Measuring the host put the arcs at
      x -12, off the left edge of the viewport at two of three widths. The logo set is the
      marks, which is what the brief means and what has to be cleared.
    */
    const marks = Array.from(loopHost.children).filter((child) => {
      const rect = child.getBoundingClientRect()
      return rect.width > 0 && rect.height > 0
    })
    if (marks.length === 0) return null
    const boxes = marks.map((mark) => boxOf(mark, scrollY))
    return {
      left: Math.min(...boxes.map((box) => box.left)),
      right: Math.max(...boxes.map((box) => box.right)),
      top: toLocal(Math.min(...boxes.map((box) => box.top))),
      bottom: toLocal(Math.max(...boxes.map((box) => box.bottom))),
    }
  })()

  const strands = branchTargets.map((target) => {
    const x = target.x
    const settleY = strandStartY + (endY - strandStartY) * 0.25
    const gatherY = endY - (endY - strandStartY) * 0.18

    /*
      The loop. Each strand bows outward around the logo set and rejoins its own column
      below it, so the two columns together enclose the row.

      This is not the single split point the brief describes, and the reason is the route
      rather than a preference: the thread does not arrive here as one line. It arrives as
      four strands in two columns, at x 372 and 1068 at 1440, both of them inside the
      logo box horizontally, so today they pass behind the marks. There is nothing to
      split. Bowing the strands they already are keeps the arcs attached to the route at
      both ends, conserves weight without a density change because no path is added, and
      stops the strands crossing the logos on the way. See ADR 0020.
    */
    const arc =
      loop && loop.bottom > toLocal(target.bottom) && loop.top < gatherY
        ? (() => {
            const outward =
              x < centreX ? loop.left - LOOP_CLEARANCE : loop.right + LOOP_CLEARANCE
            const topY = loop.top - LOOP_RISE
            const bottomY = loop.bottom + LOOP_RISE
            const midY = (loop.top + loop.bottom) / 2
            const reach = (outward - x) * ARC_K
            return [
              `L ${x} ${topY}`,
              `C ${x + reach} ${topY} ${outward} ${midY - (midY - topY) * ARC_K} ${outward} ${midY}`,
              `C ${outward} ${midY + (bottomY - midY) * ARC_K} ${x + reach} ${bottomY} ${x} ${bottomY}`,
              `L ${x} ${gatherY}`,
            ]
          })()
        : [`C ${x} ${settleY} ${x} ${settleY} ${x} ${gatherY}`]

    return [
      `M ${x} ${toLocal(target.bottom)}`,
      ...arc,
      `C ${x} ${endY} ${convergeX} ${gatherY} ${convergeX} ${endY}`,
    ].join(' ')
  })

  return {
    width,
    height,
    hostTop,
    paths: [
      {
        d: spine,
        kind: 'trunk',
        start: '[data-thread-origin]',
        end: '[data-thread-branch-point]',
      },
      ...branches.map((d): ThreadPath => ({
        d,
        kind: 'branch',
        start: '[data-thread-branch-point]',
        end: '#capabilities',
      })),
      ...strands.map((d): ThreadPath => ({
        d,
        kind: 'branch',
        start: '#work',
        end: '[data-thread-converge]',
      })),
    ],
    bands,
    hero,
  }
}

export type ThreadSamples = {
  count: number
  /** Document pixels, xyz per point. z is always 0: the stream is one plane. */
  positions: Float32Array
  /** Unit normal to the path at that point, xy per point. Idle motion runs along it. */
  normals: Float32Array
  /** Normalised position along its own path, 0 to 1. The reveal compares against this. */
  along: Float32Array
  /** Which path this point belongs to, as an index into `paths`. */
  group: Float32Array
  /** Per point random, stable for a given layout. Size, alpha, and phase read it. */
  random: Float32Array
  groupCount: number
}

/**
 * Turn the paths into particles, distributed by arc length.
 *
 * Arc length, not segments and not the parameter: `getPointAtLength` walks the real
 * curve, so a cubic gets the same particles per pixel as a straight run. Sampling
 * by segment index is what makes the curves at the branch point look starved.
 *
 * Normals come from the sampled neighbours rather than from three more
 * `getPointAtLength` calls each, which is the difference between one DOM call per
 * particle and three.
 *
 * @param density Multiplier on the base density. The Reduced tier passes a third.
 */
export function samplePaths(
  elements: SVGPathElement[],
  kinds: ThreadPathKind[],
  hostTop: number,
  density = 1,
  seed = 1,
): ThreadSamples | null {
  const groupCount = elements.length
  if (groupCount === 0) return null

  const lengths = new Float32Array(groupCount)
  const counts: number[] = []
  let total = 0

  for (let group = 0; group < groupCount; group += 1) {
    const length = elements[group]!.getTotalLength()
    lengths[group] = length
    const perPixel = TRUNK_DENSITY * (kinds[group] === 'trunk' ? 1 : BRANCH_DENSITY) * density
    const count = Math.max(2, Math.round(length * perPixel))
    counts.push(count)
    total += count
  }

  /*
    Neither of the two limits below is allowed to pass unremarked.

    The band is the brief's, and leaving it means the route changed size. That is a
    real event and the fix is a density change, so it is reported with the number to
    change and the number to change it to. Full density only: the Reduced tier is
    deliberately a third of the band.
  */
  if (density === 1 && (total < POINT_BAND.min || total > POINT_BAND.max)) {
    const suggestion = ((TRUNK_DENSITY * ((POINT_BAND.min + POINT_BAND.max) / 2)) / total).toFixed(2)
    console.error(
      `[thread] ${total} points is outside the ${POINT_BAND.min} to ${POINT_BAND.max} band. ` +
        `The route has changed length. Set TRUNK_DENSITY to about ${suggestion} in ` +
        `components/motion/threadGeometry.ts, do not leave the cap to absorb it.`,
    )
  }

  /*
    The ceiling is a runaway guard, not a tuning knob. Reaching it means the geometry
    the renderer draws is no longer the geometry the density asked for, so in
    development it stops the page rather than thinning: a wrong thread that looks
    plausible costs more to find than one that refuses to draw. Production still
    thins, because a shipped page degrading is better than a shipped page erroring,
    but it says so first.
  */
  if (total > MAX_POINTS) {
    const message =
      `[thread] ${total} points exceeds the ${MAX_POINTS} ceiling. Thinning would ` +
      `change the geometry without saying so. Lower TRUNK_DENSITY instead.`
    if (process.env.NODE_ENV !== 'production') throw new Error(message)
    console.error(message)

    // Thin every path by the same factor rather than truncating the last one, which
    // would end the thread early.
    const factor = MAX_POINTS / total
    total = 0
    for (let group = 0; group < groupCount; group += 1) {
      counts[group] = Math.max(2, Math.round(counts[group]! * factor))
      total += counts[group]!
    }
  }

  const positions = new Float32Array(total * 3)
  const normals = new Float32Array(total * 2)
  const along = new Float32Array(total)
  const group = new Float32Array(total)
  const random = new Float32Array(total)

  // A plain linear congruential step. Deterministic for a given layout, which is
  // all that is needed: the same page measures to the same thread twice.
  let state = (seed * 1103515245 + 12345) >>> 0
  const next = () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 4294967296
  }

  let cursor = 0
  const scratchX = new Float64Array(Math.max(...counts) + 1)
  const scratchY = new Float64Array(Math.max(...counts) + 1)

  for (let index = 0; index < groupCount; index += 1) {
    const element = elements[index]!
    const length = lengths[index]!
    const count = counts[index]!

    for (let step = 0; step < count; step += 1) {
      const point = element.getPointAtLength(((step + 0.5) / count) * length)
      scratchX[step] = point.x
      scratchY[step] = point.y
    }

    for (let step = 0; step < count; step += 1) {
      const previous = Math.max(0, step - 1)
      const following = Math.min(count - 1, step + 1)
      let tangentX = scratchX[following]! - scratchX[previous]!
      let tangentY = scratchY[following]! - scratchY[previous]!
      const magnitude = Math.hypot(tangentX, tangentY)
      if (magnitude > 1e-6) {
        tangentX /= magnitude
        tangentY /= magnitude
      } else {
        tangentX = 0
        tangentY = 1
      }

      // Left hand normal. Sign does not matter, the scatter is symmetric.
      const normalX = -tangentY
      const normalY = tangentX
      const scatter = (next() - 0.5) * SPREAD

      positions[cursor * 3] = scratchX[step]! + normalX * scatter
      positions[cursor * 3 + 1] = scratchY[step]! + hostTop + normalY * scatter
      positions[cursor * 3 + 2] = 0
      normals[cursor * 2] = normalX
      normals[cursor * 2 + 1] = normalY
      along[cursor] = (step + 0.5) / count
      group[cursor] = index
      random[cursor] = next()
      cursor += 1
    }
  }

  return {
    count: total,
    positions,
    normals,
    along,
    group,
    random,
    groupCount,
  }
}
