import type { Metadata } from 'next'
import { Section } from '@/components/layout/Section'
import { Button } from '@/components/ui/Button'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { Reveal } from '@/components/ui/Reveal'
import { notFoundPage } from '@/content/notFound'
import { nav } from '@/content/site'

/**
 * The 404. Phase 6.
 *
 * Serves both cases the App Router routes here: an address that matches no route, and an
 * explicit `notFound()` call, which `/work/[slug]` makes for an unknown slug.
 *
 * It replaces Next's built in error page, which shipped a bare `404` heading in inline styles
 * and put a second `<title>` into the document alongside the layout's own.
 *
 * There is no canonical link. A canonical is a statement that this URL is the preferred
 * address for this content, and the whole point of this page is that the URL addresses
 * nothing. The routes offered are `nav` from `content/site.ts`, so this page cannot list a
 * route the header does not.
 */
export const metadata: Metadata = {
  title: notFoundPage.meta.title,
  description: notFoundPage.meta.description,
  /* Nothing here should be indexed, and a soft 404 in an index is worse than none. */
  robots: { index: false, follow: true },
}

export default function NotFound() {
  return (
    <main className="relative">
      <Section id="not-found" label={notFoundPage.meta.title} className="flex min-h-[70svh] items-center">
        <div className="w-full">
          <Reveal>
            <Eyebrow>{notFoundPage.eyebrow}</Eyebrow>
          </Reveal>
          <Reveal delay={60}>
            <h1 className="text-mega text-fg mt-8 font-black">{notFoundPage.headline}</h1>
          </Reveal>
          <Reveal delay={120}>
            <p className="measure text-lead text-fg-muted mt-6">{notFoundPage.lead}</p>
          </Reveal>

          <Reveal delay={180}>
            <h2 className="label text-fg-muted mt-16">{notFoundPage.linksLabel}</h2>
            <ul className="mt-4 flex flex-col items-start gap-2">
              <li>
                <Button href="/" variant="link">
                  {notFoundPage.homeLabel}
                </Button>
              </li>
              {nav.map((item) => (
                <li key={item.href}>
                  <Button href={item.href} variant="link">
                    {item.label}
                  </Button>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </Section>
    </main>
  )
}
