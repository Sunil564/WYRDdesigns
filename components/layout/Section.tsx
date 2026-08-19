import type { ReactNode } from 'react'
import { Container } from '@/components/layout/Container'
import { cn } from '@/lib/utils'

type SectionProps = {
  children: ReactNode
  /** Anchor id. The hero actions and the header both scroll to these. */
  id?: string
  /** Screen reader label for the section landmark when it has no visible heading. */
  label?: string
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
 * Section landmark plus vertical rhythm plus the horizontal frame. Every
 * homepage section is one of these, so the page has one rhythm and not nine.
 */
export function Section({
  children,
  id,
  label,
  rhythm = true,
  bleed = false,
  divider = false,
  className,
  innerClassName,
}: SectionProps) {
  return (
    <section
      id={id}
      aria-label={label}
      className={cn('relative', rhythm && 'section-y', divider && 'hairline-t', className)}
    >
      <Container bleed={bleed} className={innerClassName}>
        {children}
      </Container>
    </section>
  )
}
