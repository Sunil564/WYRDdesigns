'use client'

import { useCallback, useRef, type CSSProperties, type PointerEvent } from 'react'
import { Reveal } from '@/components/ui/Reveal'
import type { Cluster } from '@/content/services'

/**
 * The 2x2 cluster grid. Brief 6.1 S3, inverted in Phase 4b section 4.
 *
 * These four were dark cards on a white canvas until the neon change. They are now four
 * bright grounds, one per cluster, and they are **light context blocks**: `--fg`,
 * `--border` and the light set, over a coloured ground. That is not a preference. White on
 * the dimmest neon measures 3.19:1 and on the brightest 1.18:1, so a neon bright enough to
 * read as neon can only carry dark text. ADR 0029.
 *
 * `data-variant="neon"` is the card level equivalent of `Section`'s `variant`, and it is
 * deliberately not a third value on `SectionVariant`. No section is neon, and section 1.3
 * of the brief forbids the contact band, the footer and the case study frames from ever
 * becoming one. Adding a value to a section level union that no section may use would
 * invite exactly the spread it rules out.
 *
 * Hover: the block lifts a step **toward white**, the index digit goes from
 * `--fg-neon-muted` to `--fg`, and a hairline sweeps left to right across the top edge.
 * No scale transform, no shadow. All of it is CSS on `:hover` and `:focus-within`, so
 * there is no JavaScript on the hover path.
 *
 * The index keeps a colour change rather than dropping to the sweep alone, which item 1.2
 * offered as the alternative. Muted to full weight is the same gesture the accent step
 * was, in the only direction the ground now allows, and dropping it would leave the digit
 * as the one element on the card that does not respond.
 *
 * The pointer highlight is a soft radial that follows the cursor across the grid.
 * It writes two CSS custom properties on `pointermove` and lets the compositor
 * paint the gradient. There is no per frame JavaScript repaint, which is the
 * requirement in brief 6.1 S3 and in criterion 6.
 */
/**
 * The four grounds, written out in full.
 *
 * **Every token name has to appear literally in the source.** This was
 * `var(--neon-0${'$'}{index + 1})` first, and Tailwind's scanner, which reads source as text,
 * never saw the names: it emitted `--neon-01` and `--neon-04` and tree-shook the other two.
 * Cards 02 and 03 rendered on a transparent ground with no error anywhere, and the page
 * looked broken only if you happened to scroll to it. Anything referenced through a
 * template literal is invisible to that scanner.
 */
const NEON_GROUNDS = [
  'var(--neon-01)',
  'var(--neon-02)',
  'var(--neon-03)',
  'var(--neon-04)',
] as const

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
            data-variant="neon"
            /*
              The ground is set here rather than by nth-child so the colour follows the
              cluster it belongs to and survives the list being reordered or filtered.
            */
            style={{ '--neon': NEON_GROUNDS[index % NEON_GROUNDS.length] } as CSSProperties}
            className="capability-block group relative flex h-full flex-col overflow-hidden border border-[color-mix(in_oklab,var(--color-fg)_22%,transparent)] p-8 md:p-12"
          >
            {/* The light grain, so a dark card carries texture rather than flat ink. */}
            <span aria-hidden="true" className="grain-inverse" />

            {/* The hairline that sweeps the top edge on hover. */}
            <span aria-hidden="true" className="capability-sweep" />

            <p className="label text-fg-neon-muted group-hover:text-fg relative transition-colors duration-[var(--dur-fast)]">
              {cluster.index}
            </p>

            <h3 className="text-title text-fg relative mt-8 font-bold">{cluster.name}</h3>
            <p className="measure text-lead text-fg-neon-muted relative mt-4">{cluster.line}</p>

            <ul className="relative mt-10 flex flex-col gap-4">
              {cluster.services.map((service) => (
                <li key={service.name} className="capability-rule border-t pt-4">
                  <p className="text-body text-fg">{service.name}</p>
                  <p className="measure text-body text-fg-neon-muted mt-1">{service.line}</p>
                </li>
              ))}
            </ul>
          </article>
        </Reveal>
      ))}
    </div>
  )
}
