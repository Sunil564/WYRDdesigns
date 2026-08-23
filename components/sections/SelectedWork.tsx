import { Section } from '@/components/layout/Section'
import { WorkCard } from '@/components/sections/WorkCard'
import { Button } from '@/components/ui/Button'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { Reveal } from '@/components/ui/Reveal'
import { workIntro } from '@/content/home'
import { projects } from '@/content/projects'

/**
 * S4. Selected work, honestly framed. Brief 6.1 S4.
 *
 * Asymmetric layout: the lead card spans 7 columns and is tall, the other two stack
 * in the remaining 5. Full width stacked on mobile.
 *
 * The headline is the honest framing the brief asks for. Nothing here manufactures
 * volume: three cards, all flagged as pending clearance, no client names, no
 * metrics. See ADR 0009 and content/projects.ts.
 */
export function SelectedWork() {
  const [lead, ...rest] = projects

  if (!lead) return null

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

      <div className="mt-16 grid gap-[var(--gutter)] lg:grid-cols-12">
        <Reveal className="lg:col-span-7" y={40}>
          <WorkCard project={lead} aspect={4 / 5} sizes="(min-width: 64rem) 762px, 92vw" />
        </Reveal>

        <div className="flex flex-col gap-[var(--gutter)] lg:col-span-5">
          {rest.map((project, index) => (
            <Reveal key={project.slug} delay={(index + 1) * 60} y={40}>
              <WorkCard project={project} aspect={3 / 2} sizes="(min-width: 64rem) 530px, 92vw" />
            </Reveal>
          ))}
        </div>
      </div>
    </Section>
  )
}
