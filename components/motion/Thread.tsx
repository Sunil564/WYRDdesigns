'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  measure,
  samplePaths,
  type ThreadGeometry,
} from '@/components/motion/threadGeometry'
import { clearThread, MAX_BANDS, publishThread } from '@/components/motion/threadStore'
import { useRenderTier } from '@/components/motion/useRenderTier'

/**
 * The Thread. Brief section 2.2 and 5.3, ADR 0018, ADR 0020.
 *
 * In the old sense wyrd was a thread: spun, measured, cut. This is the structural
 * spine of the whole page, not decoration, and it is why every other motion
 * decision on the site has a reason to exist.
 *
 * Geometry is measured from the DOM rather than hardcoded. Sections mark themselves
 * with data attributes and `threadGeometry` reads their positions:
 *
 *   [data-thread-origin]          the hero hand off, bottom centre
 *   [data-thread-node]            a point the spine passes through
 *   [data-thread-branch-point]    where one line becomes four
 *   [data-thread-branch-target]   the four cluster blocks
 *   [data-thread-converge]        the contact button, where four become one
 *   [data-inverse-band]           a stretch of page where the ground is dark
 *
 * What this component is now. It is the geometry authority and the scroll authority
 * for the Thread, and on two of the three tiers it renders nothing you can see:
 *
 * - The SVG paths stay in the DOM as invisible geometry carriers. They are the single
 *   source of truth for the route, they are what `getPointAtLength` samples, and no
 *   route is defined twice. Particle brief 2.2.
 * - Sampled positions are published to `threadStore`, where the Full tier's WebGL
 *   scene and the Reduced tier's 2D overlay pick them up.
 * - One ScrollTrigger per path, exactly as before, writing reveal progress into the
 *   store. It also keeps writing `stroke-dashoffset` on the invisible paths, which
 *   costs what it always cost and leaves the reveal readable from the DOM.
 * - On the Static tier the paths get their stroke back and render complete. No
 *   canvas is mounted anywhere on the page and nothing animates.
 *
 * Where the Thread crosses a dark block it has to change colour or vanish into it.
 * The Static tier's SVG solves that with two paths, one masked, per ADR 0019. The
 * particle tiers test each particle's own document y against the same measured
 * bands, per ADR 0020.
 */

type Band = { top: number; bottom: number }

/** Sample density on the Reduced tier, as a fraction of the Full tier's. */
const REDUCED_DENSITY = 1 / 3

export function Thread() {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const svgRef = useRef<SVGSVGElement | null>(null)
  const [geometry, setGeometry] = useState<ThreadGeometry | null>(null)
  const { tier } = useRenderTier()

  const still = tier === 'static'
  const streaming = tier === 'full' || tier === 'reduced'

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

    let frame = 0
    const debounced = () => {
      if (frame) window.cancelAnimationFrame(frame)
      frame = window.requestAnimationFrame(() => {
        frame = 0
        remeasure()
      })
    }

    window.addEventListener('resize', debounced)

    let observer: ResizeObserver | undefined
    if (typeof ResizeObserver !== 'undefined' && hostRef.current?.parentElement) {
      observer = new ResizeObserver(debounced)
      observer.observe(hostRef.current.parentElement)
    }

    void document.fonts?.ready.then(() => remeasure())

    return () => {
      if (frame) window.cancelAnimationFrame(frame)
      window.removeEventListener('resize', debounced)
      observer?.disconnect()
    }
  }, [remeasure])

  /*
    Sample the paths that are now in the DOM and publish them.

    This runs after the SVG has rendered, which is why it reads the elements out of
    the document rather than being handed them: `getTotalLength` and
    `getPointAtLength` only exist on a real SVGPathElement, and using them is the
    whole point. The route is defined once, in the path data, and the particles are
    a reading of it. Particle brief 2.2 and 2.5.

    Resampling happens here, on layout and on resize, never on scroll.
  */
  useEffect(() => {
    if (!geometry || !streaming) return
    const svg = svgRef.current
    if (!svg) return

    const elements = Array.from(svg.querySelectorAll<SVGPathElement>('[data-thread-body]'))
    if (elements.length !== geometry.paths.length) return

    const samples = samplePaths(
      elements,
      geometry.paths.map((path) => path.kind),
      geometry.hostTop,
      tier === 'reduced' ? REDUCED_DENSITY : 1,
      Math.round(geometry.width),
    )
    if (!samples) return

    const bandTops = new Float32Array(MAX_BANDS)
    const bandBottoms = new Float32Array(MAX_BANDS)
    const bands = geometry.bands.slice(0, MAX_BANDS)
    bands.forEach((band, index) => {
      bandTops[index] = band.top
      bandBottoms[index] = band.bottom
    })

    publishThread({
      samples,
      bandTops,
      bandBottoms,
      bandCount: bands.length,
      hero: geometry.hero,
      disperse: geometry.disperse,
    })

    return () => clearThread()
  }, [geometry, streaming, tier])

  const bands: Band[] = geometry?.bands ?? []
  // Bands are measured in document coordinates. The SVG's user space is host local,
  // so the Static tier's mask and clip have to shift them back.
  const hostTop = geometry?.hostTop ?? 0

  return (
    <div
      ref={hostRef}
      aria-hidden="true"
      // Above the grain, below content. The Thread is never interactive.
      className="pointer-events-none absolute inset-0 z-[2] overflow-hidden"
    >
      {geometry && (
        <svg
          ref={svgRef}
          width={geometry.width}
          height={geometry.height}
          viewBox={`0 0 ${geometry.width} ${geometry.height}`}
          preserveAspectRatio="none"
          fill="none"
          className="absolute inset-0 h-full w-full"
          /*
            Invisible on the particle tiers, where these paths are geometry carriers
            and nothing else, and on the tier that has not resolved yet, so a fully
            drawn line never flashes before the answer arrives. Opacity rather than
            display or visibility, because getPointAtLength needs a rendered element.
            Particle brief 2.2.
          */
          style={{ opacity: still ? 1 : 0 }}
        >
          {/*
            Each path is drawn twice, once per ground, and each copy is limited to
            the stretch of page where its colour is correct.

            The inverse copy is clipped to the dark bands. The light copy is masked
            so the bands are cut out of it, which a clipPath cannot express, since
            clipping is additive and this needs a subtraction. Without the mask the
            light hairline stays visible inside the dark block at 17:1 and the
            inverse copy underneath it is pointless.

            Blend modes were the other option and they lose: see docs/decisions/0019.
          */}
          <defs>
            <clipPath id="wyrd-thread-inverse">
              {bands.map((band, index) => (
                <rect
                  key={`band-${index}`}
                  x={0}
                  y={band.top - hostTop}
                  width={geometry.width}
                  height={Math.max(0, band.bottom - band.top)}
                />
              ))}
            </clipPath>

            <mask id="wyrd-thread-light" maskUnits="userSpaceOnUse">
              {/* White and black here are mask luminance, opaque and cut out, not colours. */}
              <rect x={0} y={0} width={geometry.width} height={geometry.height} fill="white" />
              {bands.map((band, index) => (
                <rect
                  key={`band-mask-${index}`}
                  x={0}
                  y={band.top - hostTop}
                  width={geometry.width}
                  height={Math.max(0, band.bottom - band.top)}
                  fill="black"
                />
              ))}
            </mask>
          </defs>

          {geometry.paths.map((path, index) => (
            <ThreadGroup
              key={`path-${index}`}
              d={path.d}
              start={path.start}
              end={path.end}
              still={still}
              hasBands={bands.length > 0}
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
  still,
  hasBands,
}: {
  d: string
  start: string
  end: string
  still: boolean
  hasBands: boolean
}) {
  return (
    <g data-thread-group data-start={start} data-end={end}>
      {/*
        pathLength="1" normalises the dash space, so the path can be hidden with a
        static attribute before any JavaScript runs and there is never a frame where
        a fully drawn thread flashes. The Static tier sets the offset to 0, which is
        the finished line at rest colour.
      */}
      <path
        data-thread-body
        d={d}
        stroke="var(--color-border)"
        strokeWidth="1"
        pathLength={1}
        strokeDasharray="1"
        strokeDashoffset={still ? 0 : 1}
        mask={hasBands ? 'url(#wyrd-thread-light)' : undefined}
      />
      {/*
        The same path in the inverse hairline colour, clipped to the dark blocks.
        On the light canvas it is clipped away entirely, inside a dark block it is
        the only one of the pair that shows.
      */}
      {hasBands && (
        <path
          data-thread-body-inverse
          d={d}
          stroke="var(--color-border-inverse)"
          strokeWidth="1"
          pathLength={1}
          strokeDasharray="1"
          strokeDashoffset={still ? 0 : 1}
          clipPath="url(#wyrd-thread-inverse)"
        />
      )}

    </g>
  )
}
