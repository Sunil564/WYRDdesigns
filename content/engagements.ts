/**
 * Current engagements. The `/work` list and homepage S4 both render from here.
 *
 * Every field is verbatim from the operator's instruction of 2026-09-18. Nothing is
 * inferred, extended or tidied: where a line is short it is short because the work is
 * described in one line, and a second sentence would be invention. Three entries carry
 * no location for the same reason. See ADR 0034.
 *
 * **These are real clients, so `name` is the highest risk string on the site.** Five of
 * the six differ from the names in `content/clients.ts`, which come from the logo artwork
 * via `public/logos/manifest.json`. The names here are the operator's, supplied later and
 * describing the business rather than the mark. Both render on the homepage at once, the
 * logo row's as accessible names and these as headings. See BLOCKERS item 21.
 *
 * No case studies exist behind these. There is no slug, no link, no image, no year and no
 * outcome, and none of those should be added here until a project actually finishes. When
 * one does, it becomes an entry in `content/projects.ts` and gets its route back.
 */

export type Engagement = {
  /** The client's business name, as given by the operator. */
  name: string
  /** Sector, and location where one was supplied. Rendered as one line. */
  sector: string
  /** One line on what the studio is doing. Not a summary of outcomes, there are none yet. */
  line: string
  /** Short service list. Labels as given, not mapped onto the four clusters. */
  services: string[]
}

export const engagements: Engagement[] = [
  {
    name: 'Bhavani Garments',
    sector: 'Retail, Tumkur, Karnataka',
    line: 'A mobile-first catalogue website with WhatsApp enquiry, and a monthly digital marketing retainer covering Instagram, local SEO and Google Business Profile.',
    services: ['Web', 'Digital marketing', 'Local SEO', 'Photography'],
  },
  {
    name: 'Vahini Polytech',
    sector: 'Manufacturing, pipes',
    line: 'Brand website, product photography and educational video for a large pipe manufacturer.',
    services: ['Web', 'Film', 'Brand direction'],
  },
  {
    name: 'G-Monisa',
    sector: 'Manufacturing, electrical conduit',
    line: 'Branding and a website for a conduit manufacturer stepping up its market presence.',
    services: ['Brand direction', 'Web'],
  },
  {
    name: 'SITEO',
    sector: 'Community platform, Rajasthan',
    line: 'Digital platforms for an international community group, covering venture capital and youth initiatives.',
    services: ['Web', 'Brand direction'],
  },
  {
    name: 'Seervi Expo',
    sector: 'Events, business expo',
    line: 'Digital marketing, event management software covering registration and pass handling, and the event website.',
    services: ['Web', 'Digital marketing', 'Events'],
  },
  {
    name: 'Maharaja Cables',
    sector: 'Manufacturing, wires and cables',
    line: 'Software support across the business.',
    services: ['Web', 'Software'],
  },
]

/** S4 shows the first three. The number lives here so the section does not hardcode it. */
export const HOME_ENGAGEMENT_COUNT = 3
