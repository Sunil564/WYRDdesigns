import type { MetadataRoute } from 'next'
import { absoluteUrl } from '@/lib/site-url'

/**
 * The sitemap.
 *
 * Every public route, and only those. `/tiers` and `/tokens` are development harnesses and
 * are excluded here as well as disallowed in robots.ts, because a sitemap that lists a page
 * robots forbids is a contradiction a crawler reports rather than resolves.
 *
 * **No `lastModified`.** The honest value is the deploy time, which would tell a crawler
 * every page changed every time anything shipped, and that is worse than saying nothing:
 * a date that is always today is a date that means nothing. Real dates need real content
 * dates and there are none, because no project has finished. When one does, the project's
 * own date belongs here.
 *
 * **No per project entries.** `/work/[slug]` is deleted until a case study exists to put
 * behind it, so mapping the project list into paths here would publish six addresses that
 * answer 404. See ADR 0034.
 *
 * `changeFrequency` is omitted for the same reason. It is a hint crawlers largely ignore and
 * inventing one is inventing a fact.
 *
 * Priorities are relative, not absolute, and only say which pages matter most to us: the
 * homepage and the two routes a buyer acts on.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const pages: Array<{ path: string; priority: number }> = [
    { path: '/', priority: 1 },
    { path: '/work', priority: 0.8 },
    { path: '/studio', priority: 0.8 },
    { path: '/contact', priority: 0.8 },
    { path: '/privacy', priority: 0.2 },
    { path: '/terms', priority: 0.2 },
  ]

  return pages.map(({ path, priority }) => ({ url: absoluteUrl(path), priority }))
}
