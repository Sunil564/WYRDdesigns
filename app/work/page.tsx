import type { Metadata } from 'next'
import { Section } from '@/components/layout/Section'
import { ContactCta } from '@/components/sections/ContactCta'
import { WorkGrid } from '@/components/sections/WorkGrid'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { Reveal } from '@/components/ui/Reveal'
import { projects } from '@/content/projects'
import { workPage } from '@/content/work'

/**
 * `/work`. Brief 6.2.
 *
 * A server component around one client island: the filter and the grid need state, the
 * heading and the closing call to action do not, so only the grid crosses the boundary.
 *
 * The Thread is not here. It is measured from the homepage's sections and belongs to that
 * page alone, per the Phase 5 brief's scope boundary. This route carries the grain and the
 * type system and nothing else from the motion work.
 *
 * The grid is exactly as long as `content/projects.ts`. It is not padded, and there is no
 * layout here that needs a particular number of cards to look right.
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
          <Eyebrow marker>{workPage.eyebrow}</Eyebrow>
        </Reveal>
        <Reveal delay={60}>
          <h1 className="text-mega text-fg mt-8 font-black">{workPage.headline}</h1>
        </Reveal>
        <Reveal delay={120}>
          <p className="measure text-lead text-fg-muted mt-6">{workPage.lead}</p>
        </Reveal>
        <Reveal delay={180}>
          <WorkGrid projects={projects} />
        </Reveal>
      </Section>
      <ContactCta />
    </main>
  )
}
