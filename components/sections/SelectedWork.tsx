import { Section } from '@/components/layout/Section'
import { EngagementRow } from '@/components/sections/EngagementRow'
import { Button } from '@/components/ui/Button'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { Reveal } from '@/components/ui/Reveal'
import { engagements, HOME_ENGAGEMENT_COUNT } from '@/content/engagements'
import { workIntro } from '@/content/home'

/**
 * S4. The first three current engagements, in the same treatment `/work` uses.
 *
 * **The asymmetry is gone.** The old layout put a tall 4:5 card across seven columns
 * with two shorter ones stacked in the remaining five, which existed to give a lead
 * image the room a lead image needs. There are no images now, so the composition was
 * holding space for a reason that no longer applies. Three equal rows instead.
 *
 * Nothing here manufactures volume: three rows, no client metrics, no outcomes, and the
 * link to the full list says what it is. See ADR 0034.
 */
export function SelectedWork() {
  const shown = engagements.slice(0, HOME_ENGAGEMENT_COUNT)

  if (shown.length === 0) return null

  return (
    <Section id="work" label="Selected work" divider>
      <Reveal>
        <Eyebrow>{workIntro.eyebrow}</Eyebrow>
      </Reveal>

      <Reveal delay={60}>
        <div className="mt-8 flex flex-wrap items-end justify-between gap-8">
          <h2 className="text-display text-fg font-bold" data-thread-node>
            {workIntro.headline}
          </h2>
          <Button href={workIntro.link.href} variant="link">
            {workIntro.link.label}
          </Button>
        </div>
      </Reveal>

      <ul className="mt-16 flex flex-col gap-12">
        {shown.map((engagement, index) => (
          <Reveal as="li" key={engagement.name} delay={index * 60} y={24}>
            <EngagementRow engagement={engagement} headingLevel={3} />
          </Reveal>
        ))}
      </ul>
    </Section>
  )
}
