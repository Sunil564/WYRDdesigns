/**
 * The four clusters and the spine above them.
 *
 * Service names and service lines are **verbatim from docs/brand.md section 3**,
 * which states that the wording is fixed. Cluster names, indexes, and cluster
 * lines are the brief's structure, section 6.1 S3. The mapping between the two is
 * recorded in ADR 0002.
 *
 * `SEO & GEO` is the brand.md wording and replaces the brief's plain `SEO`, because
 * being named by AI answer engines is part of what the studio sells.
 */

export type Service = {
  name: string
  line: string
}

export type Cluster = {
  index: string
  name: string
  slug: string
  line: string
  services: Service[]
}

/** Sits above the four. It is the decision layer, not a fifth cluster. */
export const spine = {
  name: 'Brand & creative direction',
  line: 'Identity, positioning and a design system that holds across every touchpoint.',
  briefLine:
    'The decisions that everything else follows from. This sits on top of every project, including the ones that are only one thing.',
} as const

export const clusters: Cluster[] = [
  {
    index: '01',
    name: 'Build',
    slug: 'build',
    line: 'Sites and stores that hold up under real traffic.',
    services: [
      {
        name: 'Web & ecommerce development',
        line: 'Fast, product-led websites and stores, built to be found and built to last.',
      },
    ],
  },
  {
    index: '02',
    name: 'Reach',
    slug: 'reach',
    line: 'Getting found, and getting chosen.',
    services: [
      {
        name: 'SEO & GEO',
        line: 'Rank on Google, and get named by AI answer engines when buyers ask.',
      },
      {
        name: 'Digital marketing & social',
        line: 'A content engine that keeps the brand present every week, not in bursts.',
      },
      {
        name: 'Promotional campaigns',
        line: 'Seasonal pushes and launches, planned, produced and measured.',
      },
    ],
  },
  {
    index: '03',
    name: 'Show',
    slug: 'show',
    line: 'Moving pictures that explain and persuade.',
    services: [
      {
        name: 'Corporate films & video',
        line: 'Brand films, product stories and testimonials, shot and cut in-house.',
      },
      {
        name: 'Explainer videos',
        line: 'Complex products made simple, in sixty seconds or less.',
      },
    ],
  },
  {
    index: '04',
    name: 'Stage',
    slug: 'stage',
    line: 'The physical version of the brand.',
    services: [
      {
        name: 'Exhibitions & events',
        line: 'Stall design, collateral and on-ground management, start to finish.',
      },
    ],
  },
]
