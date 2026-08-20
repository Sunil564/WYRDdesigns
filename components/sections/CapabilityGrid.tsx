'use client'

import { useCallback, useRef, type PointerEvent } from 'react'
import { Reveal } from '@/components/ui/Reveal'
import type { Cluster } from '@/content/services'

/**
 * The 2x2 cluster grid. Brief 6.1 S3, inverted in Phase 4b section 4.
 *
 * These four are dark cards on a white canvas. They are the section that most
 * benefits from the contrast, and it gives the four strands of the Thread somewhere
 * with weight to land.
 *
 * Hover: the block lifts a step off `--bg-inverse`, the index digit goes to
 * `--accent-on-inverse`, and a hairline sweeps left to right across the top edge.
 * No scale transform, no shadow. All of it is CSS on `:hover` and `:focus-within`,
 * so there is no JavaScript on the hover path.
 *
 * The pointer highlight is a soft radial that follows the cursor across the grid.
 * It writes two CSS custom properties on `pointermove` and lets the compositor
 * paint the gradient. There is no per frame JavaScript repaint, which is the
 * requirement in brief 6.1 S3 and in criterion 6.
 */
export function CapabilityGrid({ clusters }: { clusters: Cluster[] }) {
  const gridRef = useRef<HTMLDivElement | null>(null)
  const frame = useRef(0)

  const onPointerMove = useCallback((event: PointerEvent<HTMLDivElement>) => {
    const grid = gridRef.current
    if (!grid) return
    // Coarse pointers get no highlight. A finger has no hover.
    if (event.pointerType !== 'mouse') return

    const x = event.clientX
    const y = event.clientY

    if (frame.current) return
    frame.current = window.requestAnimationFrame(() => {
      frame.current = 0
      const rect = grid.getBoundingClientRect()
      grid.style.setProperty('--pointer-x', `${x - rect.left}px`)
      grid.style.setProperty('--pointer-y', `${y - rect.top}px`)
      grid.style.setProperty('--pointer-opacity', '1')
    })
  }, [])

  const onPointerLeave = useCallback(() => {
    gridRef.current?.style.setProperty('--pointer-opacity', '0')
  }, [])

  return (
    <div
      ref={gridRef}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      className="capability-grid mt-[var(--gutter)] grid gap-[var(--gutter)] md:grid-cols-2"
    >
      {clusters.map((cluster, index) => (
        <Reveal key={cluster.slug} delay={index * 60}>
          <article
            data-thread-branch-target={cluster.slug}
            className="capability-block group border-border-inverse bg-bg-inverse relative flex h-full flex-col overflow-hidden border p-8 md:p-12"
          >
            {/* The light grain, so a dark card carries texture rather than flat ink. */}
            <span aria-hidden="true" className="grain-inverse" />

            {/* The hairline that sweeps the top edge on hover. */}
            <span aria-hidden="true" className="capability-sweep" />

            <p className="label text-fg-inverse-muted group-hover:text-accent-on-inverse relative transition-colors duration-[var(--dur-fast)]">
              {cluster.index}
            </p>

            <h3 className="text-title text-fg-inverse relative mt-8 font-bold">{cluster.name}</h3>
            <p className="measure text-lead text-fg-inverse-muted relative mt-4">{cluster.line}</p>

            <ul className="relative mt-10 flex flex-col gap-4">
              {cluster.services.map((service) => (
                <li key={service.name} className="border-border-inverse border-t pt-4">
                  <p className="text-body text-fg-inverse">{service.name}</p>
                  <p className="measure text-body text-fg-inverse-muted mt-1">{service.line}</p>
                </li>
              ))}
            </ul>
          </article>
        </Reveal>
      ))}
    </div>
  )
}
