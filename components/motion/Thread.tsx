'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { loadGsap } from '@/components/motion/gsap'
import { useReducedMotion } from '@/components/motion/useReducedMotion'

/**
 * The Thread. Brief section 2.2 and 5.3, ADR 0018.
 *
 * In the old sense wyrd was a thread: spun, measured, cut. This is the structural
 * spine of the whole page, not decoration, and it is why every other motion
 * decision on the site has a reason to exist.
 *
 * Geometry is measured from the DOM rather than hardcoded. Sections mark themselves
 * with data attributes and this component reads their positions:
 *
 *   [data-thread-origin]          the hero hand off, bottom centre
 *   [data-thread-node]            a point the spine passes through
 *   [data-thread-branch-point]    where one line becomes four
 *   [data-thread-branch-target]   the four cluster blocks
 *   [data-thread-converge]        the contact button, where four become one
 *
 * Above 1024px: one line down to the capabilities section, four strands from there
 * to the four cluster blocks, four strands running down the page, reconverging into
 * one line that terminates at the contact button.
 *
 * Below 1024px: a single straight vertical line. Branch geometry depends on a two
 * column grid that does not exist on mobile, and the brief says not to pay the
 * layout cost. The line still draws on scroll.
 *
 * Reduced motion: every path renders complete, at rest colour, with no draw and no
 * travelling segment.
 */

/** Length of the accent coloured segment that follows the draw head, in px. */
const HEAD_LENGTH = 240

type Geometry = {
  width: number
  height: number
  spine: string
  branches: string[]
  strands: string[]
  converge: string
}

function centreOf(element: Element, scrollY: number) {
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

function measure(host: HTMLElement, wide: boolean): Geometry | null {
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

  const centreX = width / 2
  const startY = origin ? toLocal(centreOf(origin, scrollY).bottom) : 0
  const endY = converge ? toLocal(centreOf(converge, scrollY).top) : height
  const convergeX = converge ? centreOf(converge, scrollY).x : centreX

  // Mobile and anything narrow: one straight vertical line, nothing else.
  if (!wide || targets.length !== 4 || !branchPoint) {
    return {
      width,
      height,
      spine: `M ${centreX} ${startY} L ${centreX} ${endY}`,
      branches: [],
      strands: [],
      converge: '',
    }
  }

  const branch = centreOf(branchPoint, scrollY)
  const branchY = toLocal(branch.top)

  // The spine: hero bottom, through any nodes above the branch point, to the branch.
  const spinePoints = nodes
    .map((node) => centreOf(node, scrollY))
    .filter((point) => toLocal(point.y) > startY && toLocal(point.y) < branchY)
    .map((point) => ({ x: centreX, y: toLocal(point.y) }))

  let spine = `M ${centreX} ${startY}`
  for (const point of spinePoints) {
    spine += ` L ${point.x} ${point.y}`
  }
  spine += ` L ${centreX} ${branchY}`

  // Four branches, from the branch point to the top centre of each cluster block.
  const branchTargets = targets.map((target) => centreOf(target, scrollY))
  const branches = branchTargets.map((target) => {
    const x = target.x
    const y = toLocal(target.top)
    const midY = (branchY + y) / 2
    // A cubic that leaves the spine vertically and arrives vertically, so the
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
    spine,
    branches,
    strands,
    converge: `M ${convergeX} ${endY} L ${convergeX} ${endY + 8}`,
  }
}

export function Thread() {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const [geometry, setGeometry] = useState<Geometry | null>(null)
  const reduced = useReducedMotion()

  const remeasure = useCallback(() => {
    const host = hostRef.current
    if (!host) return
    const wide = window.matchMedia('(width >= 64rem)').matches
    setGeometry(measure(host, wide))
  }, [])

  // Measure after layout, and again when the layout can have changed. Fonts are
  // the usual culprit: a headline reflowing moves every anchor below it.
  useEffect(() => {
    remeasure()

    const onResize = () => remeasure()
    window.addEventListener('resize', onResize)

    let observer: ResizeObserver | undefined
    if (typeof ResizeObserver !== 'undefined' && hostRef.current?.parentElement) {
      observer = new ResizeObserver(() => remeasure())
      observer.observe(hostRef.current.parentElement)
    }

    void document.fonts?.ready.then(() => remeasure())

    return () => {
      window.removeEventListener('resize', onResize)
      observer?.disconnect()
    }
  }, [remeasure])

  // Draw on scroll. One ScrollTrigger per path group, each scrubbed, each with its
  // own accent coloured head segment chasing the draw position.
  useEffect(() => {
    if (!geometry || reduced) return
    const host = hostRef.current
    if (!host) return

    let cancelled = false
    let cleanup: (() => void) | undefined

    const run = async () => {
      const { gsap, ScrollTrigger } = await loadGsap()
      if (cancelled || !hostRef.current) return

      const context = gsap.context(() => {
        const groups = Array.from(host.querySelectorAll<SVGGElement>('[data-thread-group]'))

        for (const group of groups) {
          const body = group.querySelector<SVGPathElement>('[data-thread-body]')
          const head = group.querySelector<SVGPathElement>('[data-thread-head]')
          if (!body) continue

          const total = body.getTotalLength()
          const startSelector = group.dataset.start
          const endSelector = group.dataset.end
          const trigger = startSelector ? document.querySelector(startSelector) : null
          const endTrigger = endSelector ? document.querySelector(endSelector) : null

          // The body path carries pathLength="1", so its dash space is normalised
          // and no length has to be measured to hide it before this runs. The head
          // still needs the real length, because its window is 240 real pixels.
          body.style.strokeDasharray = '1'
          body.style.strokeDashoffset = '1'
          if (head) {
            gsap.set(head, {
              strokeDasharray: `${HEAD_LENGTH} ${total + HEAD_LENGTH}`,
              strokeDashoffset: HEAD_LENGTH,
              opacity: 0,
            })
          }

          const state = { progress: 0 }

          gsap.to(state, {
            progress: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: trigger ?? host,
              start: trigger ? 'top 85%' : 'top top',
              endTrigger: endTrigger ?? undefined,
              end: endTrigger ? 'bottom 60%' : 'bottom bottom',
              // The brief's scrub: 1. The head lags the pointer of the scroll by a
              // beat, which is what makes the line feel drawn rather than clipped.
              scrub: 1,
            },
            onUpdate: () => {
              const drawn = total * state.progress
              body.style.strokeDashoffset = String(1 - state.progress)
              if (head) {
                // The visible window sits at [drawn - HEAD_LENGTH, drawn], so the
                // signal segment travels with the live tip and the body sits back.
                head.style.strokeDashoffset = String(HEAD_LENGTH - drawn)
                head.style.opacity = state.progress > 0.001 && state.progress < 0.999 ? '1' : '0'
              }
            },
          })
        }
      }, host)

      cleanup = () => {
        context.revert()
        ScrollTrigger.refresh()
      }
    }

    void run()

    return () => {
      cancelled = true
      cleanup?.()
    }
  }, [geometry, reduced])

  return (
    <div
      ref={hostRef}
      aria-hidden="true"
      // Above the grain, below content. The Thread is never interactive.
      className="pointer-events-none absolute inset-0 z-[2] overflow-hidden"
    >
      {geometry && (
        <svg
          width={geometry.width}
          height={geometry.height}
          viewBox={`0 0 ${geometry.width} ${geometry.height}`}
          preserveAspectRatio="none"
          fill="none"
          className="absolute inset-0 h-full w-full"
        >
          <ThreadGroup
            d={geometry.spine}
            start="[data-thread-origin]"
            end="[data-thread-branch-point]"
            reduced={reduced}
          />

          {geometry.branches.map((d, index) => (
            <ThreadGroup
              key={`branch-${index}`}
              d={d}
              start="[data-thread-branch-point]"
              end="#capabilities"
              reduced={reduced}
            />
          ))}

          {geometry.strands.map((d, index) => (
            <ThreadGroup
              key={`strand-${index}`}
              d={d}
              start="#work"
              end="[data-thread-converge]"
              reduced={reduced}
            />
          ))}
        </svg>
      )}
    </div>
  )
}

function ThreadGroup({
  d,
  start,
  end,
  reduced,
}: {
  d: string
  start: string
  end: string
  reduced: boolean
}) {
  return (
    <g data-thread-group data-start={start} data-end={end}>
      {/*
        pathLength="1" normalises the dash space, so the path can be hidden with a
        static attribute before any JavaScript runs and there is never a frame where
        a fully drawn thread flashes. Reduced motion sets the offset to 0, which is
        the finished line at rest colour.
      */}
      <path
        data-thread-body
        d={d}
        stroke="var(--color-border)"
        strokeWidth="1"
        pathLength={1}
        strokeDasharray="1"
        strokeDashoffset={reduced ? 0 : 1}
      />
      {!reduced && (
        <path data-thread-head d={d} stroke="var(--color-accent)" strokeWidth="1.5" opacity="0" />
      )}
    </g>
  )
}
