import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Section } from '@/components/layout/Section'
import { CaseStudyBlocks } from '@/components/sections/CaseStudyBlocks'
import { ContactCta } from '@/components/sections/ContactCta'
import { Button } from '@/components/ui/Button'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { Placeholder } from '@/components/ui/Placeholder'
import { Reveal } from '@/components/ui/Reveal'
import { caseStudy } from '@/content/caseStudy'
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
  if (project.client) meta.push({ label: caseStudy.meta.client, value: project.client })
  if (project.year !== null) meta.push({ label: caseStudy.meta.year, value: String(project.year) })
  if (project.services.length > 0) {
    meta.push({ label: caseStudy.meta.services, value: project.services.join(', ') })
  }

  return (
    <main className="relative">
      {/*
        Full bleed hero visual on a dark block, per Phase 4b section 4, so its placeholder
        generates from the inverse tokens rather than being a light panel on a dark ground.
      */}
      <Section
        label={project.title}
        variant="inverse"
        bleed
        rhythm={false}
        className="pt-[calc(var(--gutter)*2)]"
      >
        <Placeholder
          seed={project.seed}
          variant={project.visual}
          aspect={21 / 9}
          context="inverse"
          note={`Hero visual for ${project.title}, pending cleared project imagery`}
        />
      </Section>

      <Section label={`${project.title}, detail`}>
        <Reveal>
          <Eyebrow marker>{caseStudy.nav.label}</Eyebrow>
        </Reveal>
        <Reveal delay={60}>
          <h1 className="text-display text-fg mt-8 font-black">{project.title}</h1>
        </Reveal>

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
          <h2 className="label text-fg-muted mt-16">{caseStudy.briefLabel}</h2>
          <p className="measure text-lead text-fg mt-4">{project.summary}</p>
        </Reveal>
      </Section>

      <CaseStudyBlocks project={project} />

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
                The label and the title are separate spans, so the concatenated accessible
                name came out as "PreviousEcommerce build, garments". An explicit name puts
                the separator back for a screen reader without changing what is on screen.
              */
              <Link
                href={`/work/${previous.slug}`}
                aria-label={`${caseStudy.nav.previous}: ${previous.title}`}
                className="group max-w-[38ch]"
              >
                <span className="label text-fg-muted">{caseStudy.nav.previous}</span>
                <span className="text-title text-fg group-hover:text-accent-strong mt-2 block font-bold transition-colors duration-[var(--dur-fast)]">
                  {previous.title}
                </span>
              </Link>
            )}
            {next && (
              <Link
                href={`/work/${next.slug}`}
                aria-label={`${caseStudy.nav.next}: ${next.title}`}
                className="group max-w-[38ch]"
              >
                <span className="label text-fg-muted">{caseStudy.nav.next}</span>
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
