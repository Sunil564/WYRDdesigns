/**
 * Current engagements. The `/work` list and homepage S4 both render from here.
 *
 * Every field is verbatim from the operator's instruction of 2026-09-18. Nothing is
 * inferred, extended or tidied: where a line is short it is short because the work is
 * described in one line, and a second sentence would be invention. Three entries carry
 * no location for the same reason. See ADR 0034.
 *
 * **These are real clients, so `name` is the highest risk string on the site.** Every name
 * here is the one the operator settled on 2026-09-18, and it is the same string in
 * `content/clients.ts`, `public/logos/manifest.json`, `scripts/process-assets.py` and
 * `content/projects.ts`. One name per client, everywhere. If one changes, it changes in all
 * five places or the homepage contradicts itself: these render as headings in S4 and the
 * logo row renders the same clients as accessible names, on the same page.
 *
 * `scripts/process-assets.py` derives the logo filename from the name, so a rename there
 * renames the file too. That is why the Maharaja mark is `maharaja-wires-and-cables.webp`.
 *
 * **Three sectors are deliberately one word.** Vahini Pipes, Seervi Business Expo and
 * Maharaja Wires and Cables each carry their sector inside the name already, so a longer
 * sector line would only repeat the heading beside it.
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
    name: 'Bhavani Sarees',
    sector: 'Retail, Tumkur, Karnataka',
    line: 'A mobile-first catalogue website with WhatsApp enquiry, and a monthly digital marketing retainer covering Instagram, local SEO and Google Business Profile.',
    services: ['Web', 'Digital marketing', 'Local SEO', 'Photography'],
  },
  {
    name: 'Vahini Pipes',
    sector: 'Manufacturing',
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
    name: 'Seervi Business Expo',
    sector: 'Events',
    line: 'Digital marketing, event management software covering registration and pass handling, and the event website.',
    services: ['Web', 'Digital marketing', 'Events'],
  },
  {
    name: 'Maharaja Wires and Cables',
    sector: 'Manufacturing',
    line: 'Software support across the business.',
    services: ['Web', 'Software'],
  },
]

/** S4 shows the first three. The number lives here so the section does not hardcode it. */
export const HOME_ENGAGEMENT_COUNT = 3
