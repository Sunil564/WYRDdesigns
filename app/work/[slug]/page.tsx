import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Section } from '@/components/layout/Section'
import { CaseStudyBlocks } from '@/components/sections/CaseStudyBlocks'
import { ContactCta } from '@/components/sections/ContactCta'
import { Button } from '@/components/ui/Button'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { ProjectHero } from '@/components/ui/ProjectHero'
import { Reveal } from '@/components/ui/Reveal'
import { caseStudy } from '@/content/caseStudy'
import { clusters } from '@/content/services'
import { projects } from '@/content/projects'
import type { Project } from '@/content/projects'

/**
 * `/work/[slug]`. Brief 6.3. Built once as a template.
 *
 * Every field on this page comes from `content/projects.ts`, and every field that is null
 * there renders nothing rather than an empty label. Today that means no client, no year and
 * no outcome on any of the three entries, so the meta row is one item long and the outcome
 * block does not exist. That is the template working, not the template unfinished.
 *
 * There is no `role` field in the project type. Brief 6.3 lists role in the meta row, and
 * inventing one for three uncleared projects is exactly what section 1 forbids, so the label
 * exists in `content/caseStudy.ts` and waits for data.
 */

type Params = { slug: string }

/** Static params from the content module, so the route set is the project set. */
export function generateStaticParams(): Params[] {
  return projects.map((project) => ({ slug: project.slug }))
}

function find(slug: string): Project | undefined {
  return projects.find((project) => project.slug === slug)
}

/**
 * A cluster's display name, from `content/services.ts` rather than from a capitalised id.
 * The clusters are named once, in the module that owns them, and a second spelling here
 * would be a second source of truth that goes stale without anything failing.
 */
function clusterLabel(id: string): string {
  return clusters.find((cluster) => cluster.name.toLowerCase() === id)?.name ?? id
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  const { slug } = await params
  const project = find(slug)
  if (!project) return {}

  return {
    title: project.title,
    description: project.summary,
    alternates: { canonical: `/work/${project.slug}` },
  }
}

export default async function CaseStudyPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params
  const project = find(slug)
  if (!project) notFound()

  const index = projects.findIndex((entry) => entry.slug === project.slug)
  const previous = index > 0 ? projects[index - 1] : null
  const next = index < projects.length - 1 ? projects[index + 1] : null

  /*
    The meta row, assembled from what exists. A field with no value contributes no entry, so
    the row is short rather than padded with blanks.
  */
  const meta: { label: string; value: string }[] = []
  if (project.sector) meta.push({ label: caseStudy.meta.sector, value: project.sector })
  /*
    The client row is skipped when it would repeat the h1. On a cleared project the title is
    the client's name, and a meta row that says it again under a heading that just said it is
    noise dressed as information.
  */
  if (project.client && project.client !== project.title) {
    meta.push({ label: caseStudy.meta.client, value: project.client })
  }
  if (project.year !== null) meta.push({ label: caseStudy.meta.year, value: String(project.year) })
  /*
    Engagement replaces services where it exists. They are the same fact at two resolutions,
    and the client's words for the work beat our service catalogue's on the client's page.
  */
  if (project.engagement) {
    meta.push({ label: caseStudy.meta.engagement, value: project.engagement })
  } else if (project.services.length > 0) {
    meta.push({ label: caseStudy.meta.services, value: project.services.join(', ') })
  }
  if (project.clusters.length > 0) {
    meta.push({
      label: caseStudy.meta.clusters,
      value: project.clusters.map((cluster) => clusterLabel(cluster)).join(', '),
    })
  }

  /*
    Two page orders, decided by the data.

    The default template opens with the hero visual and puts the title under it. A project
    with `blocks` opens with the words and lets its own first block be the hero, which is
    what `BHAVANI-VISUAL-CASE-STUDY.md` section 3 asks for and what keeps the largest paint
    on that route a heading rather than a picture. See ADR 0032.
  */
  const heroImages = project.blocks ? null : project.images

  return (
    <main className="relative">
      {heroImages && (
        /*
          Full bleed hero visual on a dark block, per Phase 4b section 4, so its placeholder
          generates from the inverse tokens rather than being a light panel on a dark ground.
        */
        <Section
          label={project.title}
          variant="inverse"
          bleed
          rhythm={false}
          className="pt-[calc(var(--gutter)*2)]"
        >
          {/*
            Two separate frames, landscape above 1024px and portrait below, chosen by the
            browser before it fetches. The slot was 21:9 at every width; it is now the ratio
            of whichever image is served. See ProjectHero.
          */}
          <ProjectHero images={heroImages} />
        </Section>
      )}

      <Section label={`${project.title}, detail`}>
        <Reveal>
          <Eyebrow>{caseStudy.nav.label}</Eyebrow>
        </Reveal>
        <Reveal delay={60}>
          <h1 className="text-display text-fg mt-8 font-black">{project.title}</h1>
        </Reveal>

        {project.statement && (
          <Reveal delay={90}>
            <p className="text-title text-fg mt-6 max-w-[24ch] font-bold">{project.statement}</p>
          </Reveal>
        )}

        {project.placeholder && (
          <Reveal delay={90}>
            {/*
              The status and the sentence are separate elements, not one paragraph with an
              inline pill. Inline, the extracted text ran them together as
              "clearanceThis project has not been cleared", because a margin is a visual
              separator and not a textual one. Same fault as the prev and next links below.
            */}
            <div className="mt-6 flex flex-col items-start gap-3">
              <span className="label rounded-pill border-border inline-block border px-3 py-1">
                {caseStudy.pending}
              </span>
              <p className="measure text-body text-fg-muted">{caseStudy.placeholderNote}</p>
            </div>
          </Reveal>
        )}

        {meta.length > 0 && (
          <Reveal delay={120}>
            <dl className="hairline-t mt-12 grid gap-x-[var(--gutter)] gap-y-6 pt-8 sm:grid-cols-2 lg:grid-cols-3">
              {meta.map((entry) => (
                <div key={entry.label}>
                  <dt className="label text-fg-muted">{entry.label}</dt>
                  <dd className="text-body text-fg mt-2">{entry.value}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        )}

        <Reveal delay={180}>
          {/*
            The label is for the default template, where the summary is a line about an
            uncleared project and needs saying what it is. On a cleared page the summary is
            the standfirst and a label above it is furniture.
          */}
          {!project.blocks && <h2 className="label text-fg-muted mt-16">{caseStudy.briefLabel}</h2>}
          <p className={`measure text-lead text-fg ${project.blocks ? 'mt-10' : 'mt-4'}`}>
            {project.summary}
          </p>
        </Reveal>
      </Section>

      <CaseStudyBlocks project={project} />

      {/*
        One line of build detail, at label size in muted ink. Not a block and not a section
        heading: everything past it is detail for an enquiry rather than for a page.
      */}
      {project.stack && (
        <Section label={`${project.title}, stack`} rhythm={false} className="pb-[var(--gutter)]">
          <p className="label text-fg-muted mx-auto max-w-[62rem]">{project.stack}</p>
        </Section>
      )}

      {/*
        The outcome block. It renders only with real numbers in it, so on every entry today it
        is absent rather than empty. No fabricated metric, no percentage, per ADR 0009.
      */}
      {project.outcome && project.outcome.length > 0 && (
        <Section label={`${project.title}, outcome`} divider>
          <Reveal>
            <h2 className="label text-fg-muted">{caseStudy.outcomeLabel}</h2>
          </Reveal>
          <Reveal delay={60}>
            <dl className="mt-8 grid gap-[var(--gutter)] sm:grid-cols-2 lg:grid-cols-3">
              {project.outcome.map((entry) => (
                <div key={entry.label}>
                  <dt className="label text-fg-muted">{entry.label}</dt>
                  <dd className="text-display text-fg mt-2 font-black">{entry.value}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </Section>
      )}

      <Section label={caseStudy.nav.label} divider>
        <div className="flex flex-wrap items-start justify-between gap-8">
          <div className="flex flex-col gap-4">
            {previous && (
              /*
                The separator is a text node, not an aria-label.

                An earlier fix gave these links an explicit name because the two spans
                concatenated to "PreviousEcommerce build, garments". That solved the reading
                and created a different fault: the name no longer contained the visible text,
                which is what `label-content-name-mismatch` checks and what Lighthouse then
                flagged. A space between the spans fixes both at once, and the accessible name
                is simply what is on screen.
              */
              <Link href={`/work/${previous.slug}`} className="group max-w-[38ch]">
                <span className="label text-fg-muted">{caseStudy.nav.previous}</span>{' '}
                <span className="text-title text-fg group-hover:text-accent-strong mt-2 block font-bold transition-colors duration-[var(--dur-fast)]">
                  {previous.title}
                </span>
              </Link>
            )}
            {next && (
              <Link href={`/work/${next.slug}`} className="group max-w-[38ch]">
                <span className="label text-fg-muted">{caseStudy.nav.next}</span>{' '}
                <span className="text-title text-fg group-hover:text-accent-strong mt-2 block font-bold transition-colors duration-[var(--dur-fast)]">
                  {next.title}
                </span>
              </Link>
            )}
          </div>
          <Button href="/work" variant="link">
            {caseStudy.nav.all}
          </Button>
        </div>
      </Section>

      <ContactCta />
    </main>
  )
}
