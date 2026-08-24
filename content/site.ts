/**
 * Site level facts and navigation.
 *
 * Every value here is either structure from the build brief or a verified fact
 * from docs/brand.md. Nothing in this file is invented. If a fact is not in
 * docs/brand.md it is absent, and the element that needs it does not render.
 */

export const site = {
  /** Legal entity, docs/brand.md section 1. Footer, invoices, structured data. */
  legalName: 'WYRD Tech Pvt Ltd',
  /** Trading name, docs/brand.md section 1. */
  name: 'WYRD Designs',
  /** Master brand, always all caps. */
  brand: 'WYRD',
  /** Primary approved tagline, docs/brand.md section 2. */
  tagline: 'Shape what becomes.',
  /** Descriptor, docs/brand.md section 2, verbatim. Amended 2026-08-24, ADR 0030. */
  descriptor:
    'WYRD Designs is a digital and creative studio covering what a brand needs to be seen, understood and remembered, online and offline. One team across strategy, content and production, in-house, so the people who built it are the people who keep working on it.',
  /**
   * Positioning line, docs/brand.md section 2, verbatim. Also the hero headline.
   * Amended 2026-08-24. Superseded: "We don't just build websites. We build
   * everything around them." See ADR 0030.
   */
  positioning: 'We build it. Then we grow it with you.',
  email: 'hello@wyrddesigns.in',
  /** Both numbers supplied in docs/brand.md section 1. */
  phones: ['+91 86603 33165', '+91 82176 18082'],
  location: {
    city: 'Bangalore',
    region: 'Karnataka',
    country: 'India',
    /** No street address was supplied. Nothing renders one. */
    street: null,
  },
} as const

export const socials = [
  {
    name: 'Instagram',
    href: 'https://www.instagram.com/wyrddesigns/',
    handle: 'wyrddesigns',
  },
] as const

export const nav = [
  { label: 'Work', href: '/work' },
  { label: 'Studio', href: '/studio' },
  { label: 'Contact', href: '/contact' },
] as const

export const cta = {
  label: 'Start a project',
  href: '/contact',
} as const

export const legalNav = [
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms', href: '/terms' },
] as const

/** Default document metadata. Route level titles override the title only. */
export const defaultMeta = {
  title: 'WYRD Designs, digital and creative studio in Bangalore',
  description:
    'Web and ecommerce, SEO and GEO, marketing and social, film and video, brand direction, exhibitions and events. One team across strategy, content and production, in-house, and still on it after launch. Bangalore, India.',
} as const
