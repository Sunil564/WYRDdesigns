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
  /** Body copy the trail recedes behind rather than crossing at full strength. */
  text: ThreadTextRects
  /** The hero section's document box, which is the field's clip and its handoff cue. */
  hero: ThreadBand | null
  /**
   * Where the stream blooms outward and re-gathers, in document coordinates, with the
   * maximum spread it reaches at the band's centre. Null when the client logo row is not
   * on the page. Item C.
   */
  disperse: ThreadDispersion | null
}

/**
 * Boxes of body copy the trail dims over, in document coordinates, four floats each as
 * left, top, right, bottom. Item 1 of the dimming brief.
 */
export type ThreadTextRects = { rects: Float32Array; count: number }

export type ThreadDispersion = {
  top: number
  bottom: number
  spreadX: number
  spreadY: number
  /** Document x of the logo row's centre. Which side of it a particle is on decides
   * which way its spread leans, so the two clouds throw toward each other. */
  centreX: number
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
 * `density * that`. At the 2.2 this started at, the natural count was 16,181 at 1440 and
 * `MAX_POINTS` was quietly thinning it, which is why the band is asserted below rather
 * than hoped for.
 *
 * Halved from 1.5 by the dimming brief, which puts the route at 5,000 to 5,730 across the
 * widths. `POINT_BAND` moved with it, deliberately and in the same commit: a count change
 * that leaves the tripwire behind is the tripwire firing on a decision rather than on drift,
 * which teaches everyone to ignore it.
 */
const TRUNK_DENSITY = 0.75

/**
 * Branch and strand density, as a fraction of the trunk. Four branches at rather
 * less than a third each is the brief's weight conservation: the split reads as one
 * thread dividing, not as four new threads. Particle brief 2.4.
 */
const BRANCH_DENSITY = 0.28

/**
 * Uniform array size for the text boxes the trail dims over.
 *
 * 40 is chosen against the guaranteed budget, not against the page. ESSL 1.00 guarantees
 * only 128 vertex uniform vectors and each rect costs one, so the raw 87 boxes this page
 * has would have risked a shader that fails to compile on a conforming minimum
 * implementation, which fails as a thread that silently does not draw.
 *
 * Merging adjacent blocks brings 87 down to 36 at 375px and 38 at 1440, 1024 and 1920, so
 * the cap is not reached and nothing is dropped. If a longer page ever exceeds it, the
 * largest boxes by area win and `samplePaths` is not the place that says so: the collector
 * below reports it.
 */
export const MAX_TEXT_RECTS = 40

/** Selector for the copy that counts. Headings and body, not decoration and not whitespace. */
const TEXT_SELECTOR = 'h1,h2,h3,h4,h5,h6,p,li,blockquote,figcaption,dt,dd,label,address'

/**
 * Vertical and horizontal slack when merging neighbouring boxes into one.
 *
 * Merging is what makes the cap reachable, and it is also the better rendering: a box per
 * line or per list item dims in stripes, where a box per block recedes the trail across the
 * whole passage. The cost is that the gaps inside a block dim too, which is a smaller error
 * than half the page not dimming at all.
 */
const TEXT_MERGE_GAP = 28

/**
 * How far above and below the logo marks the dispersion band runs.
 *
 * The band is where particles bloom outward and re-gather, so it needs more run than the
 * 40px the marks themselves occupy or the whole thing happens in one scroll frame. 200px
 * either side gives a 440px band, which at a viewport height of 900 is about half a
 * screen: long enough that the bloom and the re-gather are both legible as movement.
 *
 * This was two arcs bowing around the marks first. That is reverted, and why is recorded
 * in ADR 0020 section 10: the marks are 751 by 40 at every width while the strand columns
 * move outward with the viewport, so above 1024 each arc came out taller than it was wide
 * and read as a bracket rather than an enclosure. A cloud has no shape it has to fit.
 */
const DISPERSE_RISE = 200

/**
 * Maximum spread at the centre of the band, as fractions of the marks box.
 *
 * Was a third of the row's width, which put each cloud's reach at 405px against a 751px row
 * with the two strands 696px apart, so the clouds flanked the row and the middle marks had
 * open space behind them. 0.64 was tried next and measured 0.33 ink per column at the row's
 * centre against 1.44 at the marks, so the clouds were adjacent rather than overlapping:
 * reaching the centre needed a particle in the top fifth of the cosine distribution.
 *
 * 0.85 puts the inward reach at 638px against a 696px gap between the strands, so roughly
 * a third of each cloud's particles cross the centre rather than a fifth.
 *
 * Vertical stays at the row's own height. The wider horizontal did not make it read flat.
 */
const DISPERSE_WIDTH_FRACTION = 0.85
const DISPERSE_HEIGHT_FRACTION = 1


/**
 * Static perpendicular scatter, in pixels. A mathematically thin line of points
 * reads as a dashed rule. A little width across the path makes it a stream.
 */
const SPREAD = 1.7

/**
 * The band for the whole route, at full density and any width. Was 8,000 to 12,000 from
 * particle brief 2.3, halved with `TRUNK_DENSITY` by the dimming brief.
 * A count outside it is a drift signal, not something to absorb: it means the page
 * has grown or the density is wrong, and either way the number to change is
 * `TRUNK_DENSITY`. Checked at full density only, since the Reduced tier is a third
 * of it by design.
 */
export const POINT_BAND = { min: 4000, max: 6000 }

/**
 * Hard ceiling, whatever the page height. Nothing is allowed to run away.
 *
 * A ceiling that silently rewrites the geometry under you is a trap: the thread was
 * shipped at 16,000 points for two builds looking like a deliberate number when it
 * was the cap engaging. So both this and the band above announce themselves.
 *
 * Halved to 8,000 with the band, keeping the same third of headroom above the band's top
 * that 16,000 had over 12,000. A ceiling that stays put while the band halves stops being a
 * runaway guard and becomes decoration.
 */
const MAX_POINTS = 8000

/**
 * Body copy boxes, merged and capped, in document coordinates.
 *
 * Runs in the same layout pass as the route, so the rects and the geometry describe the same
 * frame. Merging is repeated a few times because one pass leaves neighbours that only became
 * adjacent through an earlier merge.
 */
function collectTextRects(scrollY: number): ThreadTextRects {
  type Box = { left: number; top: number; right: number; bottom: number }
  const raw: Box[] = []
  for (const element of Array.from(document.querySelectorAll(TEXT_SELECTOR))) {
    if (!element.textContent || !element.textContent.trim()) continue
    const rect = element.getBoundingClientRect()
    if (rect.width < 8 || rect.height < 8) continue
    raw.push({
      left: rect.left + window.scrollX,
      right: rect.right + window.scrollX,
      top: rect.top + scrollY,
      bottom: rect.bottom + scrollY,
    })
  }

  const mergeOnce = (list: Box[]): Box[] => {
    const out: Box[] = []
    for (const box of [...list].sort((a, b) => a.top - b.top)) {
      const near = out.find(
        (other) =>
          box.left < other.right + TEXT_MERGE_GAP &&
          box.right > other.left - TEXT_MERGE_GAP &&
          box.top < other.bottom + TEXT_MERGE_GAP &&
          box.bottom > other.top - TEXT_MERGE_GAP,
      )
      if (!near) {
        out.push({ ...box })
        continue
      }
      near.left = Math.min(near.left, box.left)
      near.right = Math.max(near.right, box.right)
      near.top = Math.min(near.top, box.top)
      near.bottom = Math.max(near.bottom, box.bottom)
    }
    return out
  }

  let merged = raw
  for (let pass = 0; pass < 5; pass += 1) {
    const next = mergeOnce(merged)
    if (next.length === merged.length) break
    merged = next
  }

  if (merged.length > MAX_TEXT_RECTS) {
    console.error(
      `[thread] ${merged.length} text boxes exceeds the ${MAX_TEXT_RECTS} uniform slots. ` +
        `Keeping the largest by area, so the smallest ${merged.length - MAX_TEXT_RECTS} will ` +
        `not dim the trail. Raise MAX_TEXT_RECTS in components/motion/threadGeometry.ts and ` +
        `check it against the vertex uniform budget.`,
    )
    merged.sort(
      (a, b) =>
        (b.right - b.left) * (b.bottom - b.top) - (a.right - a.left) * (a.bottom - a.top),
    )
    merged = merged.slice(0, MAX_TEXT_RECTS)
  }

  const rects = new Float32Array(MAX_TEXT_RECTS * 4)
  merged.forEach((box, index) => {
    rects[index * 4] = box.left
    rects[index * 4 + 1] = box.top
    rects[index * 4 + 2] = box.right
    rects[index * 4 + 3] = box.bottom
  })
  return { rects, count: merged.length }
}

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

  const text = collectTextRects(scrollY)

  const heroElement = document.querySelector('#hero')
  const heroBox = heroElement ? boxOf(heroElement, scrollY) : null
  const hero = heroBox ? { top: heroBox.top, bottom: heroBox.bottom } : null

  const centreX = width / 2
  const startY = origin ? toLocal(boxOf(origin, scrollY).bottom) : 0
  const endY = converge ? toLocal(boxOf(converge, scrollY).top) : height
  const convergeX = converge ? boxOf(converge, scrollY).x : centreX

  /*
    The client logo set, if it is on the page, as the box the dispersion is built from.

    Measured from the DOM like everything else on this route, and from the host's children
    rather than the host itself: the host is a flex row spanning the content column, 1344px
    wide at 1440, while the six marks inside it occupy 751. That correction was made during
    the arc attempt and it stands without it, because the cloud is sized off this box too.

    The row measures 751 by 40 at 1024, 1440 and 1920 alike, since its size is intrinsic to
    six marks rather than a fraction of the viewport.
  */
  const loopHost = document.querySelector('[data-thread-loop]')
  const disperse = (() => {
    if (!loopHost) return null
    const marks = Array.from(loopHost.children).filter((child) => {
      const rect = child.getBoundingClientRect()
      return rect.width > 0 && rect.height > 0
    })
    if (marks.length === 0) return null
    const boxes = marks.map((mark) => boxOf(mark, scrollY))
    const left = Math.min(...boxes.map((box) => box.left))
    const right = Math.max(...boxes.map((box) => box.right))
    const marksTop = Math.min(...boxes.map((box) => box.top))
    const marksBottom = Math.max(...boxes.map((box) => box.bottom))
    return {
      // Document coordinates: the shader tests a particle's own document Y against these.
      top: marksTop - DISPERSE_RISE,
      bottom: marksBottom + DISPERSE_RISE,
      spreadX: (right - left) * DISPERSE_WIDTH_FRACTION,
      spreadY: (marksBottom - marksTop) * DISPERSE_HEIGHT_FRACTION,
      centreX: (left + right) / 2,
    }
  })()

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
      text,
      hero,
      /*
        The narrow route is one straight line down the page centre, and it passes through
        the clients section like everything else, so it disperses too. At reduced
        magnitude: there is far less horizontal room, and a cloud reaching a third of the
        row's width either side would leave the viewport. Half of it, reported in ADR 0020.
      */
      disperse: disperse ? { ...disperse, spreadX: disperse.spreadX * 0.5 } : null,
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
  // Straight runs through the clients section. The dispersion is a rendering behaviour,
  // not a route, so nothing here changes for it: no added length, no density change, and
  // the tripwire in samplePaths stays quiet.
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
    text,
    hero,
    disperse,
  }
}

export type ThreadSamples = {
  count: number
  /** Document pixels, xyz per point. z is always 0: the stream is one plane. */
  positions: Float32Array
  /** Unit normal to the path at that point, xy per point. Idle motion runs along it. */
  normals: Float32Array
  /** Normalised position along its own path, 0 to 1. Carried for the step 8 handoff. */
  along: Float32Array
  /**
   * Arc length in pixels from the start of its own path. The spiral's phase advances on
   * this rather than on `along`, because `along` is normalised and the paths run from
   * 1,252px to 5,236px, so one rotation per unit of `along` would be four times faster on
   * the trunk than on a strand.
   */
  distance: Float32Array
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
  const distance = new Float32Array(total)
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
      distance[cursor] = ((step + 0.5) / count) * length
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
    distance,
    group,
    random,
    groupCount,
  }
}
