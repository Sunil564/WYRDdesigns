'use client'

import { useCallback, useRef, type PointerEvent } from 'react'
import { Reveal } from '@/components/ui/Reveal'
import type { Cluster } from '@/content/services'

/** Which ground a cluster card renders on, and with it the text pair that is legal there. */
export type CapabilityVariant = 'royal' | 'lime'

/**
 * The 2x2 cluster grid. Brief 6.1 S3, inverted in Phase 4b section 4, coloured in 0029.
 *
 * The four cards alternate between two grounds, royal and lime, and the two take opposite
 * contrast pairs: royal reads the inverse text set, lime reads the light set. A card names
 * its variant and nothing else, and the pair follows from it in `app/globals.css`. That is
 * the point of the change rather than a detail of it, because the version before this
 * hardcoded the inverse set on every card and had no way to say which ground a card was on.
 *
 * `variant` is named for `Section`'s, which does the same job one level up, though the values
 * differ because a section chooses a token set and a card chooses a ground.
 *
 * Hover: the block deepens a step, and a hairline sweeps left to right across the top edge.
 * No scale transform, no shadow. All of it is CSS on `:hover` and `:focus-within`, so there
 * is no JavaScript on the hover path.
 *
 * No accent appears anywhere inside these cards. `--accent` measures 1.41:1 on royal and
 * 3.32:1 on lime and is unusable on both, so the index digit that used to turn accent on
 * hover no longer changes colour and the sweep carries the hover signal on its own.
 *
 * The pointer highlight is a soft radial that follows the cursor across the grid.
 * It writes two CSS custom properties on `pointermove` and lets the compositor
 * paint the gradient. There is no per frame JavaScript repaint, which is the
 * requirement in brief 6.1 S3 and in criterion 6.
 */
/** Royal first, then alternating. The table in CLUSTER-CARD-COLOURS.md section 1. */
function variantFor(index: number): CapabilityVariant {
  return index % 2 === 0 ? 'royal' : 'lime'
}

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
            /*
              Alternating, so 01 and 03 are royal and 02 and 04 are lime. Derived from the
              position rather than stored on the cluster: the colour is a property of the
              grid's rhythm, not a fact about the service.
            */
            data-variant={variantFor(index)}
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
