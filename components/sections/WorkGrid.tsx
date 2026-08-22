'use client'

import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { WorkCard } from '@/components/sections/WorkCard'
import { Chip } from '@/components/ui/Chip'
import { clusters } from '@/content/services'
import type { Project } from '@/content/projects'
import { workPage } from '@/content/work'

/** Mirrors --dur-base and --ease-out. Motion needs numbers where CSS has tokens. */
const DURATION = 0.5
const EASE = [0.16, 1, 0.3, 1] as const

type WorkGridProps = { projects: Project[] }

/**
 * The `/work` grid and its cluster filter. Brief 6.2.
 *
 * Filtering animates position rather than reflowing: each card is a `layout` child, and
 * `AnimatePresence mode="popLayout"` takes a leaving card out of flow immediately so the
 * ones that stay animate to their new places instead of jumping. Reduced motion is already
 * handled globally by `MotionConfig reducedMotion="user"` in `SiteMotion`, so there is no
 * branch here and no second implementation of that rule.
 *
 * A cluster with no projects gets a disabled chip, not a clickable route into an empty
 * state. The count comes from the list, so a chip enables itself the moment a project in
 * that cluster is cleared.
 *
 * The card is the homepage's card, unchanged. One component, per brief 6.2.
 */
export function WorkGrid({ projects }: WorkGridProps) {
  const [active, setActive] = useState<string | null>(null)

  /** How many projects each cluster holds, so the chips describe the real list. */
  const counts = useMemo(() => {
    const map = new Map<string, number>()
    for (const project of projects) {
      map.set(project.cluster, (map.get(project.cluster) ?? 0) + 1)
    }
    return map
  }, [projects])

  const visible = useMemo(
    () => (active === null ? projects : projects.filter((project) => project.cluster === active)),
    [active, projects],
  )

  if (projects.length === 0) {
    return (
      <p className="measure text-lead text-fg-muted mt-16">{workPage.empty}</p>
    )
  }

  return (
    <>
      <div
        className="mt-12 flex flex-wrap gap-3"
        role="group"
        aria-label="Filter work by cluster"
      >
        <Chip selected={active === null} onClick={() => setActive(null)}>
          {workPage.allLabel}
        </Chip>
        {clusters.map((cluster) => {
          const id = cluster.name.toLowerCase()
          const count = counts.get(id) ?? 0
          return (
            <Chip
              key={cluster.name}
              selected={active === id}
              disabled={count === 0}
              onClick={() => setActive(id)}
              /*
                A disabled chip still has to say why it is disabled, or a keyboard user
                meets a dead control with no explanation.
              */
              title={count === 0 ? `No ${cluster.name} projects cleared yet` : undefined}
              className={count === 0 ? 'cursor-not-allowed opacity-40' : undefined}
            >
              {cluster.name}
            </Chip>
          )
        })}
      </div>

      <motion.ul className="mt-16 grid gap-[var(--gutter)] md:grid-cols-2" layout>
        <AnimatePresence mode="popLayout" initial={false}>
          {visible.map((project) => (
            <motion.li
              key={project.slug}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: DURATION, ease: EASE }}
            >
              {/* Directly under the page h1, so the card title is an h2 here. */}
              <WorkCard project={project} aspect={4 / 5} headingLevel={2} sizes="(min-width: 64rem) 646px, 92vw" />
            </motion.li>
          ))}
        </AnimatePresence>
      </motion.ul>
    </>
  )
}
