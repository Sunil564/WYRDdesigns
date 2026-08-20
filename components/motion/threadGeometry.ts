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
 */
const TRUNK_DENSITY = 2.2

/**
 * Branch and strand density, as a fraction of the trunk. Four branches at rather
 * less than a third each is the brief's weight conservation: the split reads as one
 * thread dividing, not as four new threads. Particle brief 2.4.
 */
const BRANCH_DENSITY = 0.28

/**
 * Static perpendicular scatter, in pixels. A mathematically thin line of points
 * reads as a dashed rule. A little width across the path makes it a stream.
 */
const SPREAD = 1.7

/** Hard ceiling, whatever the page height. Nothing is allowed to run away. */
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
  const strands = branchTargets.map((target) => {
    const x = target.x
    const settleY = strandStartY + (endY - strandStartY) * 0.25
    const gatherY = endY - (endY - strandStartY) * 0.18
    return [
      `M ${x} ${toLocal(target.bottom)}`,
      `C ${x} ${settleY} ${x} ${settleY} ${x} ${gatherY}`,
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
  /** Path length in pixels, per group. */
  lengths: Float32Array
  /** `HEAD_LENGTH` as a fraction of that group's length, per group. */
  headFraction: Float32Array
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

  // If the page is tall enough to blow the ceiling, thin every path by the same
  // factor rather than truncating the last one, which would end the thread early.
  if (total > MAX_POINTS) {
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
  const headFraction = new Float32Array(groupCount)

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
    headFraction[index] = length > 0 ? Math.min(1, HEAD_LENGTH / length) : 1

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
    lengths,
    headFraction,
    groupCount,
  }
}
