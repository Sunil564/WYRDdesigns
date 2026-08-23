import type { ReactNode } from 'react'
import { Section } from '@/components/layout/Section'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { Reveal } from '@/components/ui/Reveal'
import { legal } from '@/content/legal/legal'

type LegalPageProps = {
  title: string
  /** True while the document is holding text rather than the published version. */
  pending?: boolean
  children: ReactNode
}

/**
 * The shared layout for `/privacy` and `/terms`.
 *
 * One component so the two routes cannot drift apart, and so that supplying the real copy is
 * a change to an `.mdx` file and nothing else. Both routes pass their prose in as children.
 *
 * The pending marker is a visible tag rather than a quiet note. A legal page that is holding
 * text should say so on the page, not only in a commit message: a visitor reading a privacy
 * policy is entitled to know it is not the final one.
 *
 * There is no "last updated" date. It arrives with the document.
 */
export function LegalPage({ title, pending = false, children }: LegalPageProps) {
  return (
    <main className="relative">
      <Section id="legal" label={title}>
        <Reveal>
          <Eyebrow>{title}</Eyebrow>
        </Reveal>
        <Reveal delay={60}>
          <h1 className="text-display text-fg mt-8 font-black">{title}</h1>
        </Reveal>

        {pending && (
          <Reveal delay={90}>
            <p className="mt-6">
              <span className="label rounded-pill border-border text-fg-muted inline-block border px-3 py-1">
                {legal.pendingLabel}
              </span>
            </p>
          </Reveal>
        )}

        <Reveal delay={120}>
          <div className="mt-12">{children}</div>
        </Reveal>
      </Section>
    </main>
  )
}
