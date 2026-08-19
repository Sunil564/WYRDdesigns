/**
 * Projects.
 *
 * Every entry here is a **placeholder**, flagged as such, and shown as such on the
 * site. There is no client name, no outcome metric, no year, and no invented
 * detail anywhere in this file.
 *
 * What the entries do say is sourced. `docs/brand.md` section 6 lists the true
 * statements available today: studio work spans web, marketing, video, and
 * on-ground events, and there are clients in manufacturing, garments, and
 * hospitality. Named case studies are pending clearance. So each card names a
 * discipline and one of those three sectors, and says plainly that the detail is
 * pending. Nothing implies a finished, cleared case study.
 *
 * When real project data arrives: replace the entry, set `placeholder: false`, add
 * `client`, `year`, and `outcome` if and only if the numbers are real. An outcome
 * block with no numbers does not render at all, per ADR 0009.
 */

import type { PlaceholderVariant } from '@/components/ui/Placeholder'

export type ProjectOutcome = {
  label: string
  value: string
}

export type Project = {
  slug: string
  /** Discipline and sector. Never a client name while `placeholder` is true. */
  title: string
  /** One line. Says what the work is, and that the detail is pending. */
  summary: string
  /** Which cluster it belongs to, for the `/work` filter. */
  cluster: 'build' | 'reach' | 'show' | 'stage'
  services: string[]
  /** Real client name, or null. Null renders nothing. */
  client: string | null
  /** Real year, or null. Null renders nothing. */
  year: number | null
  /** Real outcome numbers, or null. Null omits the whole outcome block. */
  outcome: ProjectOutcome[] | null
  /** True while this stands in for a project that has not been cleared. */
  placeholder: boolean
  /** Seed for the generated visual, so the layout is stable across builds. */
  seed: string
  visual: PlaceholderVariant
}

export const projects: Project[] = [
  {
    slug: 'ecommerce-garments',
    title: 'Ecommerce build, garments',
    summary: 'A storefront and catalogue for a garment business. Details pending clearance.',
    cluster: 'build',
    services: ['Web & ecommerce development', 'SEO & GEO'],
    client: null,
    year: null,
    outcome: null,
    placeholder: true,
    seed: 'ecommerce-garments',
    visual: 'gradient',
  },
  {
    slug: 'brand-film-manufacturing',
    title: 'Brand film, manufacturing',
    summary: 'A brand film and product stories, shot and cut in-house. Details pending clearance.',
    cluster: 'show',
    services: ['Corporate films & video', 'Brand & creative direction'],
    client: null,
    year: null,
    outcome: null,
    placeholder: true,
    seed: 'brand-film-manufacturing',
    visual: 'lines',
  },
  {
    slug: 'exhibition-hospitality',
    title: 'Exhibition presence, hospitality',
    summary: 'Stall design, collateral and on-ground management. Details pending clearance.',
    cluster: 'stage',
    services: ['Exhibitions & events', 'Promotional campaigns'],
    client: null,
    year: null,
    outcome: null,
    placeholder: true,
    seed: 'exhibition-hospitality',
    visual: 'mesh',
  },
]

/** True while nothing on the list has been cleared. Drives the honest framing. */
export const allProjectsArePlaceholders = projects.every((project) => project.placeholder)
