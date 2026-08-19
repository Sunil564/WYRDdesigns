/**
 * The one place the site origin is defined. See docs/decisions/0005.
 *
 * The production domain is not registered. Nothing else in the codebase may
 * hardcode an origin, so metadataBase, canonicals, the sitemap, robots, and OG
 * image URLs all resolve from here.
 */

function resolve(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (explicit) return explicit

  // Set by Vercel on production deployments. Lets preview and production URLs
  // resolve correctly before a domain exists.
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim()
  if (vercel) return `https://${vercel}`

  return 'http://localhost:3000'
}

export const SITE_URL = resolve().replace(/\/+$/, '')

export function absoluteUrl(path = '/'): string {
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`
}
