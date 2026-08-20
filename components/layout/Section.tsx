import type { ReactNode } from 'react'
import { Container } from '@/components/layout/Container'
import { cn } from '@/lib/utils'

/** Which token set this section renders from. Phase 4b criterion 12. */
export type SectionVariant = 'light' | 'inverse'

type SectionProps = {
  children: ReactNode
  /** Anchor id. The hero actions and the header both scroll to these. */
  id?: string
  /** Screen reader label for the section landmark when it has no visible heading. */
  label?: string
  /**
   * `inverse` makes this a full bleed dark block. Passed explicitly, never
   * inferred from a parent. Dark blocks are punctuation, so only the sections
   * named in Phase 4b section 4 pass it.
   */
  variant?: SectionVariant
  /** Vertical rhythm from `--section-y`, 128px mobile and 192px desktop. */
  rhythm?: boolean
  /** Full bleed sections keep the gutter and drop the 1440px ceiling. */
  bleed?: boolean
  /** A top hairline is how one section announces itself against the last. */
  divider?: boolean
  className?: string
  innerClassName?: string
}

/**
 * Section landmark plus vertical rhythm plus the horizontal frame. Every homepage
 * section is one of these, so the page has one rhythm and not nine.
 *
 * An inverse section paints its dark ground as a sibling layer at `z-1` rather than
 * as its own background. That is what lets the Thread, at `z-2`, cross the dark
 * block and stay visible: ground, then Thread, then content at `z-10`. The wrapper
 * is `relative` with no z-index, so it does not create a stacking context and those
 * three layers all participate in the page's. See docs/decisions/0019.
 *
 * The ground is real markup, not something JavaScript paints, so a dark block is
 * dark before hydration and with scripting off.
 */
export function Section({
  children,
  id,
  label,
  variant = 'light',
  rhythm = true,
  bleed = false,
  divider = false,
  className,
  innerClassName,
}: SectionProps) {
  const inner = (
    <section
      id={id}
      aria-label={label}
      // z-10 keeps section content above the Thread overlay, which sits at z-2,
      // above the grain at z-1. The Thread is never in front of content.
      className={cn('relative z-10', rhythm && 'section-y', divider && 'hairline-t', className)}
    >
      <Container bleed={bleed} className={innerClassName}>
        {children}
      </Container>
    </section>
  )

  if (variant === 'light') return inner

  return (
    <div className="relative">
      {/*
        The dark ground, and the light grain that gives it texture. Marked as a
        band so the Thread knows which stretch of itself to draw in the inverse
        hairline colour.
      */}
      <div
        aria-hidden="true"
        data-inverse-band
        className="bg-bg-inverse absolute inset-0 z-[1] overflow-hidden"
      >
        <span className="grain-inverse" />
      </div>
      {inner}
    </div>
  )
}
