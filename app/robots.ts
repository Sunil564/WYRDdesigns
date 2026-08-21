import type { MetadataRoute } from 'next'
import { absoluteUrl } from '@/lib/site-url'

/**
 * robots.txt.
 *
 * Everything public is allowed. The two disallowed paths are development harnesses:
 * `/tiers` forces a render tier and `/tokens` is a palette sheet, and neither is content.
 * They are excluded from the sitemap as well, so the two files agree.
 *
 * **This is not a security control and is not treated as one.** robots.txt is a request,
 * and a disallowed path is still served to anyone who asks. Both pages are harmless to
 * reach; they are hidden from crawlers so they do not appear in results, nothing more.
 *
 * The sitemap and host both resolve from SITE_URL, which is the only place an origin is
 * defined. Until a domain is registered that is the Vercel deployment URL, which is correct:
 * a robots.txt pointing at a domain that does not exist is worse than one pointing at the
 * address actually being served. ADR 0005 and BLOCKERS 1.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/tiers', '/tokens'],
      },
    ],
    sitemap: absoluteUrl('/sitemap.xml'),
    host: absoluteUrl('/'),
  }
}
