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


export type ProjectOutcome = {
  label: string
  value: string
}

/**
 * One generated frame, with everything a renderer needs and nothing it does not.
 *
 * `source` records the file in `Codebase2/Website images` that produced it, the way the
 * client logo manifest records its source. When real photography arrives, that is how you
 * know exactly what is being replaced.
 *
 * **`alt` describes what is in the frame and never what the frame proves.** These are
 * atmospheric images, generated, not photographs of a client's product, premises or of work
 * this studio delivered. Alt text that said "the storefront we built" would be the site's
 * second rule broken in the one place nobody proofreads. Every string here would be equally
 * true of a stock library picture, which is the test.
 */
export type ProjectImage = {
  webp: string
  jpg: string
  /** Intrinsic pixels, so every slot reserves its box before the file loads. */
  width: number
  height: number
  /** The generated file this came from. */
  source: string
  alt: string
}

/**
 * The seven frames a project carries.
 *
 * The two heroes are separate images rather than one cropped by CSS. A 16:9 landscape
 * cropped to a phone's portrait viewport keeps a quarter of the composition, and these were
 * composed with the negative space that would be the part thrown away.
 */
export type ProjectImages = {
  cardLarge: ProjectImage
  cardSmall: ProjectImage
  heroDesktop: ProjectImage
  heroMobile: ProjectImage
  blockBleed: ProjectImage
  blockInset1: ProjectImage
  blockInset2: ProjectImage
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
  /**
   * Generated imagery, pending real photography. Present on every project, so no renderer
   * needs a branch for a project without pictures.
   */
  images: ProjectImages
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
    images: {
      cardLarge: {
        webp: '/work/ecommerce-garments-card-large.webp',
        jpg: '/work/ecommerce-garments-card-large.jpg',
        width: 1122,
        height: 1402,
        source: '1.1.png',
        alt: 'Close-up of deep magenta silk with gold thread woven through it, folds catching a single shaft of light.',
      },
      cardSmall: {
        webp: '/work/ecommerce-garments-card-small.webp',
        jpg: '/work/ecommerce-garments-card-small.jpg',
        width: 1536,
        height: 1024,
        source: '1.2.png',
        alt: 'Folded lengths of magenta and gold silk stacked on dark wood, seen from a low angle.',
      },
      heroDesktop: {
        webp: '/work/ecommerce-garments-hero-desktop.webp',
        jpg: '/work/ecommerce-garments-hero-desktop.jpg',
        width: 1672,
        height: 941,
        source: '1.3.png',
        alt: 'Warp threads stretched the width of a handloom in a dark workshop, magenta and gold silk catching light from a high window.',
      },
      heroMobile: {
        webp: '/work/ecommerce-garments-hero-mobile.webp',
        jpg: '/work/ecommerce-garments-hero-mobile.jpg',
        width: 1122,
        height: 1402,
        source: '1.4.png',
        alt: 'Taut warp threads on a handloom filling the frame top to bottom, magenta and gold silk lit from one side.',
      },
      blockBleed: {
        webp: '/work/ecommerce-garments-block-bleed.webp',
        jpg: '/work/ecommerce-garments-block-bleed.jpg',
        width: 1672,
        height: 941,
        source: '1.5.png',
        alt: 'A shuttle wound with gold thread resting on dark wood in the foreground, hands out of focus behind it.',
      },
      blockInset1: {
        webp: '/work/ecommerce-garments-block-inset-1.webp',
        jpg: '/work/ecommerce-garments-block-inset-1.jpg',
        width: 1448,
        height: 1086,
        source: '1.6.png',
        alt: 'A single length of magenta silk falling vertically through the frame against a pale background.',
      },
      blockInset2: {
        webp: '/work/ecommerce-garments-block-inset-2.webp',
        jpg: '/work/ecommerce-garments-block-inset-2.jpg',
        width: 1448,
        height: 1086,
        source: '1.7.png',
        alt: 'Detail of a woven gold geometric border on deep magenta cloth, photographed from directly above under raking light.',
      },
    },
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
    images: {
      cardLarge: {
        webp: '/work/brand-film-manufacturing-card-large.webp',
        jpg: '/work/brand-film-manufacturing-card-large.jpg',
        width: 1122,
        height: 1402,
        source: '2.1.png',
        alt: 'Stacked pipes seen end-on, their circular openings receding in a grid from lit to dark.',
      },
      cardSmall: {
        webp: '/work/brand-film-manufacturing-card-small.webp',
        jpg: '/work/brand-film-manufacturing-card-small.jpg',
        width: 1535,
        height: 1024,
        source: '2.2.png',
        alt: 'A single large-diameter pipe running diagonally through the frame in close-up, cool grey under overhead light.',
      },
      heroDesktop: {
        webp: '/work/brand-film-manufacturing-hero-desktop.webp',
        jpg: '/work/brand-film-manufacturing-hero-desktop.jpg',
        width: 1672,
        height: 941,
        source: '2.3.png',
        alt: 'A wide manufacturing floor with pipes stacked in long rows receding into haze, daylight falling in shafts from high windows.',
      },
      heroMobile: {
        webp: '/work/brand-film-manufacturing-hero-mobile.webp',
        jpg: '/work/brand-film-manufacturing-hero-mobile.jpg',
        width: 1122,
        height: 1402,
        source: '2.4.png',
        alt: 'Looking up a stack of pipes toward high windows, the lower half of the frame in near darkness.',
      },
      blockBleed: {
        webp: '/work/brand-film-manufacturing-block-bleed.webp',
        jpg: '/work/brand-film-manufacturing-block-bleed.jpg',
        width: 1672,
        height: 941,
        source: '2.5.png',
        alt: 'The silhouette of a cinema camera out of focus in the foreground, an industrial interior lit by a single lamp beyond it.',
      },
      blockInset1: {
        webp: '/work/brand-film-manufacturing-block-inset-1.webp',
        jpg: '/work/brand-film-manufacturing-block-inset-1.jpg',
        width: 1448,
        height: 1086,
        source: '2.6.png',
        alt: 'Extreme close-up of a cut pipe end, its circular cross-section sharp against a black background.',
      },
      blockInset2: {
        webp: '/work/brand-film-manufacturing-block-inset-2.webp',
        jpg: '/work/brand-film-manufacturing-block-inset-2.jpg',
        width: 1448,
        height: 1086,
        source: '2.7.png',
        alt: 'Pipes of varying diameters arranged in a tight row, seen from directly above under even light.',
      },
    },
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
    images: {
      cardLarge: {
        webp: '/work/exhibition-hospitality-card-large.webp',
        jpg: '/work/exhibition-hospitality-card-large.jpg',
        width: 1122,
        height: 1402,
        source: '3.1.png',
        alt: 'Looking up at the steel roof structure of a large hall, lighting rigs receding upward into amber-lit shadow.',
      },
      cardSmall: {
        webp: '/work/exhibition-hospitality-card-small.webp',
        jpg: '/work/exhibition-hospitality-card-small.jpg',
        width: 1537,
        height: 1023,
        source: '3.2.png',
        alt: 'A wide hall aisle at long exposure, the crowd on either side blurred into movement while the aisle itself stays empty and sharp.',
      },
      heroDesktop: {
        webp: '/work/exhibition-hospitality-hero-desktop.webp',
        jpg: '/work/exhibition-hospitality-hero-desktop.jpg',
        width: 1672,
        height: 941,
        source: '3.3.png',
        alt: 'A vast hall interior seen from high above, rows of booths receding to a vanishing point under pooled amber light.',
      },
      heroMobile: {
        webp: '/work/exhibition-hospitality-hero-mobile.webp',
        jpg: '/work/exhibition-hospitality-hero-mobile.jpg',
        width: 1122,
        height: 1402,
        source: '3.4.png',
        alt: 'A tall hall entrance rising the full height of the frame, amber light spilling from within into darkness.',
      },
      blockBleed: {
        webp: '/work/exhibition-hospitality-block-bleed.webp',
        jpg: '/work/exhibition-hospitality-block-bleed.jpg',
        width: 1672,
        height: 941,
        source: '3.5.png',
        alt: 'An empty exhibition hall before opening, booth structures assembled and lit by work lights.',
      },
      blockInset1: {
        webp: '/work/exhibition-hospitality-block-inset-1.webp',
        jpg: '/work/exhibition-hospitality-block-inset-1.jpg',
        width: 1448,
        height: 1086,
        source: '3.6.png',
        alt: 'Detail of a queue barrier and stanchion, the webbing sharp in the foreground against blurred warm light.',
      },
      blockInset2: {
        webp: '/work/exhibition-hospitality-block-inset-2.webp',
        jpg: '/work/exhibition-hospitality-block-inset-2.jpg',
        width: 1448,
        height: 1086,
        source: '3.7.png',
        alt: 'Overhead abstract of a hall floor, aisle markings and carpet seams forming a geometric grid under angled amber light.',
      },
    },
  },
]

/** True while nothing on the list has been cleared. Drives the honest framing. */
export const allProjectsArePlaceholders = projects.every((project) => project.placeholder)
