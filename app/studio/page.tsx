import type { Metadata } from 'next'
import { Section } from '@/components/layout/Section'
import { ContactCta } from '@/components/sections/ContactCta'
import { Button } from '@/components/ui/Button'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { Reveal } from '@/components/ui/Reveal'
import { studioStrip } from '@/content/home'
import { processSteps } from '@/content/process'
import { clusters, spine } from '@/content/services'
import { site } from '@/content/site'
import { studioPage } from '@/content/studio'

/**
 * `/studio`. Brief 6.4.
 *
 * A server component start to finish. Nothing on this page has state, so nothing here
 * crosses into the client bundle.
 *
 * **There is no team section**, and its absence is the most important thing on the route.
 * No real names have been supplied, so there is no section, no generic "our team" block, and
 * no placeholder person. There is also no founding year, no headcount, and no years in
 * business, because none of those facts exist either. An absent section is correct; a
 * plausible one is a failure. See `docs/placeholders.md`, "What is deliberately absent".
 *
 * The name is explained here and nowhere else on the site, per CLAUDE.md.
 */
export const metadata: Metadata = {
  title: studioPage.meta.title,
  description: studioPage.meta.description,
  alternates: { canonical: '/studio' },
}

export default function StudioPage() {
  return (
    <main className="relative">
      <Section id="studio" label={studioPage.headline}>
        <Reveal>
          <Eyebrow>{studioPage.eyebrow}</Eyebrow>
        </Reveal>
        <Reveal delay={60}>
          <h1 className="text-mega text-fg mt-8 font-black">{studioPage.headline}</h1>
        </Reveal>
        {/* The opening statement, in large type. Verbatim from docs/brand.md section 2. */}
        <Reveal delay={120}>
          <p className="measure text-lead text-fg mt-8">{site.descriptor}</p>
        </Reveal>
        <Reveal delay={180}>
          <ul className="mt-12 flex flex-col gap-3">
            {studioStrip.lines.map((line) => (
              <li key={line} className="measure text-body text-fg-muted">
                {line}
              </li>
            ))}
          </ul>
        </Reveal>
      </Section>

      {/*
        The name. Once, on this route, and never again anywhere on the site.
      */}
      <Section label={studioPage.name.label} divider>
        <Reveal>
          <h2 className="label text-fg-muted">{studioPage.name.label}</h2>
        </Reveal>
        <Reveal delay={60}>
          <p className="measure text-display text-fg mt-6 font-bold">
            {studioPage.name.statement}
          </p>
        </Reveal>
        <Reveal delay={120}>
          <p className="measure text-lead text-fg-muted mt-8">{studioPage.name.thread}</p>
        </Reveal>
      </Section>

      {/*
        Capabilities recap, compact list form. The four clusters with the spine above them,
        straight from content/services.ts, so this page cannot describe a service differently
        from the homepage.
      */}
      <Section label={studioPage.capabilities.label} divider>
        <Reveal>
          <h2 className="label text-fg-muted">{studioPage.capabilities.label}</h2>
        </Reveal>
        <Reveal delay={60}>
          <p className="measure text-lead text-fg mt-6">{studioPage.capabilities.note}</p>
        </Reveal>

        <Reveal delay={120}>
          <div className="hairline-t mt-12 pt-8">
            <h3 className="text-title text-fg font-bold">{spine.name}</h3>
            <p className="measure text-body text-fg-muted mt-2">{spine.line}</p>
          </div>
        </Reveal>

        <ul className="mt-12 grid gap-x-[var(--gutter)] gap-y-12 md:grid-cols-2">
          {clusters.map((cluster, index) => (
            <Reveal as="li" key={cluster.slug} delay={(index + 1) * 60}>
              <p className="label text-accent-strong">{cluster.index}</p>
              <h3 className="text-title text-fg mt-3 font-bold">{cluster.name}</h3>
              <p className="measure text-body text-fg-muted mt-2">{cluster.line}</p>
              <ul className="mt-6 flex flex-col gap-4">
                {cluster.services.map((service) => (
                  <li key={service.name} className="hairline-t pt-4">
                    <p className="text-body text-fg font-bold">{service.name}</p>
                    <p className="measure text-body text-fg-muted mt-1">{service.line}</p>
                  </li>
                ))}
              </ul>
            </Reveal>
          ))}
        </ul>
      </Section>

      {/*
        How we work. The expanded S6: the same four steps, given full width and room, rather
        than the homepage's four column grid. The expansion is layout. Writing a second
        sentence per step to fill the page would be inventing process detail nobody has
        described.
      */}
      <Section label={studioPage.process.label} divider>
        <Reveal>
          <h2 className="label text-fg-muted">{studioPage.process.label}</h2>
        </Reveal>
        <ol className="mt-12 flex flex-col">
          {processSteps.map((step, index) => (
            <Reveal as="li" key={step.index} delay={index * 60}>
              <div className="hairline-t grid gap-x-[var(--gutter)] gap-y-3 py-8 md:grid-cols-12">
                <p className="label text-accent-strong md:col-span-2">{step.index}</p>
                <h3 className="text-display text-fg font-bold md:col-span-4">{step.name}</h3>
                <p className="measure text-lead text-fg-muted md:col-span-6">{step.line}</p>
              </div>
            </Reveal>
          ))}
        </ol>
      </Section>

      {/*
        Location and contact. The street is null in content/site.ts because none was supplied,
        so the address renders as city, region, country and stops there.
      */}
      <Section label={studioPage.location.label} divider>
        <div className="grid gap-12 md:grid-cols-2">
          <Reveal>
            <h2 className="label text-fg-muted">{studioPage.location.label}</h2>
            <address className="text-lead text-fg mt-6 not-italic">
              {site.location.city}
              <br />
              {site.location.region}
              <br />
              {site.location.country}
            </address>
          </Reveal>

          <Reveal delay={60}>
            <h2 className="label text-fg-muted">{studioPage.contact.label}</h2>
            <div className="mt-6 flex flex-col items-start gap-4">
              <Button href={`mailto:${site.email}`} variant="link">
                {site.email}
              </Button>
              {site.phones.map((phone) => (
                <Button key={phone} href={`tel:${phone.replace(/\s/g, '')}`} variant="link">
                  {phone}
                </Button>
              ))}
            </div>
          </Reveal>
        </div>
      </Section>

      <ContactCta />
    </main>
  )
}
