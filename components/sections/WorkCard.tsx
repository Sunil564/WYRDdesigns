'use client'

import Link from 'next/link'
import { useRef } from 'react'
import { CursorLabel } from '@/components/ui/CursorLabel'
import { Placeholder } from '@/components/ui/Placeholder'
import type { Project } from '@/content/projects'
import { cn } from '@/lib/utils'

type WorkCardProps = {
  project: Project
  /** 4 / 5 for the tall lead card, 16 / 9 for the stacked pair. */
  aspect: number
  /**
   * Heading level for the card title, as a number.
   *
   * It cannot be baked in. On the homepage the grid sits under an S4 `h2`, so the card is an
   * `h3`. On `/work` the grid sits directly under the page `h1`, so an `h3` skips a level and
   * Lighthouse fails `heading-order`, which is what it did. The caller knows what it nested
   * the card inside; the card does not.
   */
  headingLevel?: 2 | 3
  className?: string
}

/**
 * A project card. Used by S4 and by the `/work` grid, so it is one component.
 * Brief 6.1 S4 and 6.2.
 *
 * The visual sits inside a fixed frame and scales within it, so the frame never
 * moves and the card cannot shift the layout. On hover the visual goes to 1.04 and
 * the title shifts right by 8px, both on transform.
 *
 * A placeholder card says so, on the card. No client name, no year, and no outcome
 * is rendered while `placeholder` is true, because none of those facts exist yet.
 */
export function WorkCard({ project, aspect, headingLevel = 3, className }: WorkCardProps) {
  const Heading = `h${headingLevel}` as const
  const cardRef = useRef<HTMLElement | null>(null)

  return (
    <article ref={cardRef} className={cn('work-card group relative', className)}>
      <Link href={`/work/${project.slug}`} className="block focus-visible:outline-offset-8">
        {/* The fixed frame. The visual scales inside it and never outside it. */}
        <div className="border-border relative overflow-hidden border">
          <div className="work-card-visual">
            <Placeholder
              seed={project.seed}
              variant={project.visual}
              aspect={aspect}
              note={`Lead visual for ${project.title}, pending cleared project imagery`}
            />
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2">
          <Heading className="work-card-title text-title text-fg font-bold">{project.title}</Heading>
          <p className="measure text-body text-fg-muted">{project.summary}</p>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
            {project.services.map((service) => (
              <span key={service} className="label text-fg-muted">
                {service}
              </span>
            ))}
            {/* Year and client render only when they are real. */}
            {project.year !== null && <span className="label text-fg-muted">{project.year}</span>}
            {project.placeholder && (
              <span className="label rounded-pill border-border text-fg-muted border px-3 py-1">
                Pending clearance
              </span>
            )}
          </div>
        </div>
      </Link>

      <CursorLabel targetRef={cardRef} label="View" />
    </article>
  )
}
