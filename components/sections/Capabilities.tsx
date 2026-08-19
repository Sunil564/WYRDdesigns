import { Section } from '@/components/layout/Section'
import { CapabilityGrid } from '@/components/sections/CapabilityGrid'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { Reveal } from '@/components/ui/Reveal'
import { clusters, spine } from '@/content/services'

/**
 * S3. One spine, four strands. The core section. Brief 6.1 S3.
 *
 * The spine block sits above the four clusters because brand and creative direction
 * is the decision layer every other job inherits, including the jobs that are only
 * one thing. Service wording is verbatim from docs/brand.md, cluster structure is
 * the brief's. See ADR 0002.
 *
 * Server component. The pointer highlight and hover states are in the client leaf.
 */
export function Capabilities() {
  return (
    <Section id="capabilities" label="What we do" divider>
      <Reveal>
        <Eyebrow marker>What we do</Eyebrow>
      </Reveal>

      {/* The spine. Full width, above the four, and the branch point of the Thread. */}
      <Reveal delay={60}>
        <div className="border-line bg-surface mt-16 border p-8 md:p-12" data-thread-branch-point>
          <h2 className="text-title text-paper font-bold">{spine.name}</h2>
          <p className="measure text-lead text-muted mt-4">{spine.briefLine}</p>
          <p className="measure text-body text-muted mt-3">{spine.line}</p>
        </div>
      </Reveal>

      <CapabilityGrid clusters={clusters} />
    </Section>
  )
}
