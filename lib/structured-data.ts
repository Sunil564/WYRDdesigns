import { SITE_URL, absoluteUrl } from '@/lib/site-url'
import { site, socials } from '@/content/site'

/**
 * JSON-LD for the studio. Two nodes in one graph: the legal entity, and the place you can
 * reach in Bangalore.
 *
 * **Everything here is a verified fact from `docs/brand.md`, read out of `content/site.ts`.**
 * Nothing is assembled for the schema's benefit. Structured data is the easiest place on a
 * site to invent a fact, because every property reads like a form field asking to be filled,
 * and a search engine will happily repeat whatever it is told.
 *
 * Deliberately absent, each because the fact does not exist:
 *
 * - `streetAddress`. No address was supplied. `PostalAddress` carries locality, region and
 *   country, which is the truth: a studio in Bangalore, with no public street door.
 * - `foundingDate`. The studio is new and no date was given.
 * - `numberOfEmployees`. Unknown, and the site never implies a size.
 * - `priceRange`. Google asks `LocalBusiness` for one and the brief forbids prices anywhere
 *   on this site. A refused field beats a guessed one, and `$$` is a guess.
 * - `openingHours`, `geo`, `aggregateRating`, `review`. None supplied, and the last two
 *   cannot be supplied by us at all.
 *
 * Absent properties cost a rich result. Invented ones cost the thing the whole site is built
 * on. See ADR 0002 and the second non-negotiable rule in CLAUDE.md.
 */
export function organizationGraph() {
  const organizationId = `${SITE_URL}/#organization`

  const address = {
    '@type': 'PostalAddress',
    addressLocality: site.location.city,
    addressRegion: site.location.region,
    addressCountry: site.location.country,
  } as const

  const contact = {
    email: site.email,
    telephone: [...site.phones],
  } as const

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': organizationId,
        name: site.name,
        legalName: site.legalName,
        alternateName: site.brand,
        url: absoluteUrl('/'),
        logo: {
          '@type': 'ImageObject',
          url: absoluteUrl('/brand/icon-512.png'),
          width: 512,
          height: 512,
        },
        image: absoluteUrl('/brand/wyrd-og.png'),
        description: site.descriptor,
        slogan: site.tagline,
        address,
        ...contact,
        // Only accounts we actually run. One, at the time of writing.
        sameAs: socials.map((social) => social.href),
      },
      {
        /*
          `LocalBusiness` rather than a narrower type. `ProfessionalService` and the design
          and marketing subtypes all carry expectations this studio has not published, and
          the parent type is the one that is true without qualification.
        */
        '@type': 'LocalBusiness',
        '@id': `${SITE_URL}/#localbusiness`,
        name: site.name,
        url: absoluteUrl('/'),
        image: absoluteUrl('/brand/wyrd-og.png'),
        description: site.descriptor,
        address,
        ...contact,
        parentOrganization: { '@id': organizationId },
      },
    ],
  }
}
