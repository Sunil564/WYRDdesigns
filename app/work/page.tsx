import type { Metadata } from 'next'
import { Section } from '@/components/layout/Section'
import { ContactCta } from '@/components/sections/ContactCta'
import { EngagementRow } from '@/components/sections/EngagementRow'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { Reveal } from '@/components/ui/Reveal'
import { engagements } from '@/content/engagements'
import { workPage } from '@/content/work'

/**
 * `/work`. A list of what the studio is working on now.
 *
 * Entirely a server component since the filter went. Nothing on this page holds state,
 * so nothing crosses the client boundary: the list is six rows of text.
 *
 * The Thread is not here. It is measured from the homepage's sections and belongs to
 * that page alone. This route carries the grain and the type system and nothing else
 * from the motion work.
 *
 * The list is exactly as long as `content/engagements.ts`. It is not padded, and no
 * layout here needs a particular number of rows to look right.
 */
export const metadata: Metadata = {
  title: workPage.meta.title,
  description: workPage.meta.description,
  alternates: { canonical: '/work' },
}

export default function WorkPage() {
  return (
    <main className="relative">
      <Section id="work-index" label={workPage.headline}>
        <Reveal>
          <Eyebrow>{workPage.eyebrow}</Eyebrow>
        </Reveal>
        <Reveal delay={60}>
          <h1 className="text-mega text-fg mt-8 font-black">{workPage.headline}</h1>
        </Reveal>
        <Reveal delay={120}>
          <p className="measure text-lead text-fg-muted mt-6">{workPage.lead}</p>
        </Reveal>

        {engagements.length === 0 ? (
          <Reveal delay={180}>
            <p className="measure text-lead text-fg-muted mt-16">{workPage.empty}</p>
          </Reveal>
        ) : (
          <ul className="mt-20 flex flex-col gap-12">
            {engagements.map((engagement, index) => (
              <Reveal as="li" key={engagement.name} delay={Math.min(index, 3) * 60} y={24}>
                {/* Directly under the page h1, so the client name is an h2 here. */}
                <EngagementRow engagement={engagement} headingLevel={2} />
              </Reveal>
            ))}
          </ul>
        )}
      </Section>
      <ContactCta />
    </main>
  )
}
