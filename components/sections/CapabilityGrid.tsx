'use client'

import { useCallback, useRef, type PointerEvent } from 'react'
import { Reveal } from '@/components/ui/Reveal'
import type { Cluster } from '@/content/services'

/**
 * The 2x2 cluster grid. Brief 6.1 S3, inverted in Phase 4b section 4, coloured in 0029.
 *
 * All four cards render on one black ground with a gloss raked across it. Hover, keyboard
 * focus and press take them to `--color-accent-strong`, the same blue as the filled "Start a
 * project" button, faded in as a layer so the gradient can transition at all.
 *
 * This replaces the alternating royal and lime grounds. There is no per card variant any
 * more: the four are identical and the ground lives in one rule in `app/globals.css`.
 *
 * No accent appears as a foreground anywhere inside these cards. The index digit does not
 * change colour on hover and the hairline sweep carries the signal.
 *
 * The pointer highlight is a soft radial that follows the cursor across the grid.
 * It writes two CSS custom properties on `pointermove` and lets the compositor
 * paint the gradient. There is no per frame JavaScript repaint, which is the
 * requirement in brief 6.1 S3 and in criterion 6.
 */
/*
  The service row rule, taking the card's own hairline rather than a fixed token. Inline
  because the divider is one declaration and a utility class for it would be a second name
  for `--card-hairline`.
*/
const hairline = { borderColor: 'var(--card-hairline)' }

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
            className="capability-block group relative flex h-full flex-col overflow-hidden border p-8 md:p-12"
          >
            {/* Grain, so a card carries texture rather than flat ink. Dark on lime, light on royal. */}
            <span aria-hidden="true" className="grain-inverse" />

            {/* The hairline that sweeps the top edge on hover. */}
            <span aria-hidden="true" className="capability-sweep" />

            <p className="label card-muted relative">{cluster.index}</p>

            <h3 className="text-title relative mt-8 font-bold">{cluster.name}</h3>
            <p className="measure text-lead card-muted relative mt-4">{cluster.line}</p>

            <ul className="relative mt-10 flex flex-col gap-4">
              {cluster.services.map((service) => (
                <li key={service.name} className="border-t pt-4" style={hairline}>
                  <p className="text-body">{service.name}</p>
                  <p className="measure text-body card-muted mt-1">{service.line}</p>
                </li>
              ))}
            </ul>
          </article>
        </Reveal>
      ))}
    </div>
  )
}
