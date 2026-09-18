/**
 * Projects.
 *
 * **One entry is cleared and two are placeholders.** Bhavani Sarees is named, with
 * facts, every one of which traces to the operator's brief `BHAVANI-VISUAL-CASE-STUDY.md`
 * and to nothing else. Its visuals are still pending, which is a different thing from the
 * project being uncleared: the page says nothing about missing pictures, it just has slots
 * waiting for screenshots. See ADR 0032.
 *
 * The other two remain placeholders, flagged as such and shown as such. Neither carries a
 * client name, an outcome metric, a year, or any invented detail.
 *
 * What those two do say is sourced. `docs/brand.md` section 6 lists the true statements
 * available today: studio work spans web, marketing, video, and on-ground events, and there
 * are clients in manufacturing, garments, and hospitality. So each names a discipline and
 * one of those sectors, and says plainly that the detail is pending.
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

export type ProjectCluster = 'build' | 'reach' | 'show' | 'stage'

/**
 * A visual slot with no asset behind it yet.
 *
 * Every field here is what the seeded `<Placeholder>` needs plus the sentence that goes
 * in `docs/placeholders.md`. `note` is rendered into `data-placeholder`, so a grep over
 * the built HTML finds every empty slot on the site and says what belongs in it.
 */
export type PendingVisual = {
  /** Width over height. The slot reserves this box whether or not anything fills it. */
  aspect: number
  /** Portrait ratio below `lg`, when the slot needs a different shape on a phone. */
  aspectMobile?: number
  /**
   * A phone or browser outline around the slot, drawn from tokens. A screenshot with no
   * frame reads as a floating rectangle on a white page.
   *
   * Per slot rather than per block, because a pair can mix: a phone beside a search result.
   */
  frame?: 'none' | 'phone' | 'browser'
  /** What real asset replaces this, in the words of the operator's brief. */
  note: string
}

/**
 * The four block types a case study body can hold, beyond the default three frames.
 * See ADR 0032.
 *
 * Four, and deliberately no more. This is a case study body, not a page builder: a fifth
 * type should have to argue for itself against putting the same thing in `copy`.
 *
 * Device framing and pairing are fields rather than types of their own, and so is the
 * caption. A caption is not a sibling of the picture it describes, it is part of it, and
 * the pair renders as `figure` and `figcaption` for exactly that reason.
 */
export type CaseStudyBlock =
  /** One or two lines of body copy. The page's prose lives here and nowhere else. */
  | { kind: 'copy'; lines: string[] }
  /**
   * One visual, or two side by side on desktop and stacked below `sm`. A screenshot with
   * no frame around it reads as a floating rectangle on a white page, so `frame` puts a
   * phone or a browser outline around each slot, drawn from tokens rather than an asset.
   */
  | { kind: 'visual'; bleed?: boolean; slots: PendingVisual[]; caption?: string }
  /**
   * A short muted looping clip. **In placeholder state this renders a still, never a
   * `video` element**, because an empty `video` is a request for a file that does not
   * exist and a poster attribute pointing at nothing.
   */
  | { kind: 'loop'; slot: PendingVisual; caption?: string }
  /** Labelled nodes joined by a line, drawn in the design system. Never an image. */
  | { kind: 'diagram'; nodes: string[]; caption?: string }

export type Project = {
  slug: string
  /** Discipline and sector, or the client's name once the project is cleared. */
  title: string
  /**
   * The hero statement. One line, the largest type on the page after the title, and the
   * argument the case study makes. Null on a project with nothing cleared to argue.
   */
  statement: string | null
  /** One line on a card. Two on a cleared case study, where it is the standfirst. */
  summary: string
  /** Which clusters it belongs to, for the `/work` filter. One project can serve two. */
  clusters: ProjectCluster[]
  services: string[]
  /**
   * Sector and place, as one line. `Retail, Tumkur, Karnataka`. Null when not supplied,
   * and a null field renders no row rather than an empty one.
   */
  sector: string | null
  /**
   * What the engagement is, in the client's terms rather than in the service list's.
   * Renders in place of the services row, which is the same fact at a coarser resolution.
   */
  engagement: string | null
  /** Real client name, or null. Null renders nothing. */
  client: string | null
  /** Real year, or null. Null renders nothing. */
  year: number | null
  /** Real outcome numbers, or null. Null omits the whole outcome block. */
  outcome: ProjectOutcome[] | null
  /** True while this stands in for a project that has not been cleared. */
  placeholder: boolean
  /**
   * One line of build detail at the foot of the page, at label size in muted ink. Not a
   * block and not prose: it is the answer to "what is it made of" for the one reader in
   * twenty who asks, and everything beyond it belongs in an enquiry.
   */
  stack: string | null
  /**
   * Generated imagery, or null for a project whose real assets are pending. Null is not an
   * omission: it is what sends every slot to the seeded placeholder instead.
   */
  images: ProjectImages | null
  /**
   * The case study body. Absent means the default three frames, which is what the two
   * uncleared projects still render and what this template did for every project before
   * ADR 0032.
   */
  blocks?: CaseStudyBlock[]
}

export const projects: Project[] = [
  /*
    The one cleared project. Named, with real facts, all of them traceable to the operator's
    brief `BHAVANI-VISUAL-CASE-STUDY.md` and to nothing else. No year, because none was
    supplied. No outcome, because none was supplied. See ADR 0032.

    `images` is null on purpose. The generated silk frames still sit in `public/work` and are
    the wrong subject for this client: a picture of silk is decoration beside a screenshot of
    the catalogue that was actually built. Every slot on this page waits for the real screens.
  */
  {
    slug: 'bhavani-garments',
    title: 'Bhavani Sarees',
    statement: 'Built the shopfront. Then filled it.',
    summary:
      'Three women’s clothing showrooms in Tumkur. Strong walk-in trade, no online ' +
      'presence, and staff sending product photos one at a time from their own phones.',
    clusters: ['build', 'reach'],
    services: ['Web & ecommerce development', 'Digital marketing & social', 'SEO & GEO'],
    sector: 'Retail, Tumkur, Karnataka',
    engagement: 'Catalogue website, digital marketing retainer',
    client: 'Bhavani Sarees',
    year: null,
    outcome: null,
    placeholder: false,
    stack: 'Next.js, TypeScript, Tailwind, Supabase, Cloudinary, Vercel.',
    images: null,
    blocks: [
      {
        kind: 'visual',
        bleed: true,
        slots: [
          {
            aspect: 16 / 9,
            aspectMobile: 4 / 5,
            note: 'Hero: the live catalogue, desktop and mobile together. Browser frame left holding the homepage, phone frame overlapping right holding a category view. Plain ground, no reflections.',
          },
        ],
      },
      {
        kind: 'copy',
        lines: [
          'Browse by category, open a product, tap Enquire on WhatsApp.',
          'Name, price and size pre-fill into the chat.',
        ],
      },
      {
        kind: 'visual',
        slots: [
          {
            aspect: 9 / 16,
            frame: 'phone',
            note: 'Mobile screenshot: a category grid. Real products, real prices.',
          },
          {
            aspect: 9 / 16,
            frame: 'phone',
            note: 'Mobile screenshot: a single product page with the Enquire button visible.',
          },
        ],
        caption: 'Lady Nighty, Jeans Tops and Kurtis, Ladies Undergarments at launch.',
      },
      {
        kind: 'copy',
        lines: ['The sale still closes where it always did. We removed the friction, not the relationship.'],
      },
      {
        kind: 'loop',
        slot: {
          aspect: 9 / 16,
          frame: 'phone',
          note: 'Motion loop, 3 to 5s, muted, MP4 and WebM under 400kb each: product page, thumb taps Enquire, WhatsApp opens with the message already filled in.',
        },
        caption:
          'No cart, no checkout, no payment gateway. The client did not need ecommerce, so we did not build it.',
      },
      {
        kind: 'copy',
        lines: ['The owner adds products, sets prices, and toggles sizes. No developer call to change a price.'],
      },
      {
        kind: 'visual',
        slots: [
          {
            aspect: 16 / 10,
            frame: 'browser',
            note: 'Desktop screenshot: the admin, product edit view. Blur or replace any real customer data.',
          },
        ],
        caption: 'Domain, hosting and every account in the client’s name. No lock-in.',
      },
      {
        kind: 'copy',
        lines: [
          'A website nobody finds is a brochure in a drawer.',
          'Bhavani Sarees moved onto a monthly retainer after go-live.',
        ],
      },
      {
        kind: 'visual',
        slots: [
          {
            aspect: 9 / 16,
            frame: 'phone',
            note: 'Mobile screenshot: the Instagram grid, showing the actual posts.',
          },
          {
            aspect: 9 / 16,
            frame: 'phone',
            note: 'Mobile screenshot: the Google Business Profile panel as it appears in search. Captured as a mobile screen so the pair sits level beside the Instagram grid.',
          },
        ],
        caption:
          'Seven posts and five reels a month, shot on location. Google Business Profile and local SEO carried the weight, because for three showrooms in Tumkur local search beats national reach.',
      },
      {
        kind: 'visual',
        bleed: true,
        slots: [
          {
            aspect: 16 / 9,
            aspectMobile: 4 / 5,
            note: 'A still from the reel shoots. Real garments, real store. The only slot where photography rather than a screen is right.',
          },
        ],
      },
      {
        kind: 'diagram',
        nodes: ['Instagram', 'Catalogue', 'WhatsApp', 'In store'],
      },
      {
        kind: 'copy',
        lines: ['Every piece points at the next one. That is the whole design.'],
      },
    ],
  },
  {
    slug: 'brand-film-manufacturing',
    title: 'Brand film, manufacturing',
    statement: null,
    summary: 'A brand film and product stories, shot and cut in-house. Details pending clearance.',
    clusters: ['show'],
    services: ['Corporate films & video', 'Brand & creative direction'],
    sector: null,
    engagement: null,
    client: null,
    year: null,
    outcome: null,
    placeholder: true,
    stack: null,
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
    statement: null,
    summary: 'Stall design, collateral and on-ground management. Details pending clearance.',
    clusters: ['stage'],
    services: ['Exhibitions & events', 'Promotional campaigns'],
    sector: null,
    engagement: null,
    client: null,
    year: null,
    outcome: null,
    placeholder: true,
    stack: null,
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
