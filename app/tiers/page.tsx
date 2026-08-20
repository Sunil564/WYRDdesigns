import type { Metadata } from 'next'
import { TierHarness } from '@/app/tiers/TierHarness'
import { Container } from '@/components/layout/Container'

/**
 * Internal render tier harness. Not linked from the site, noindex.
 *
 * Phase 2b requires the tier split proven before anything is built on top of it,
 * and criterion 5 in section 11 requires zero Three.js bytes on the Reduced and
 * Static tiers. This route is where both are checked, by hand and by
 * scripts/check-tiers.mjs.
 */
export const metadata: Metadata = {
  title: 'Render tiers',
  robots: { index: false, follow: false },
}

export default function TiersPage() {
  return (
    <main className="relative z-10">
      <Container className="pt-32 pb-32">
        <p className="label text-accent">Internal</p>
        <h1 className="text-display mt-6 font-bold">Render tiers</h1>
        <p className="measure text-lead text-fg-muted mt-6">
          Full loads Three.js. Reduced and Static download none of it. Force a tier, cycle the
          scene, or drop the WebGL context and watch it fall back.
        </p>
        <div className="mt-24">
          <TierHarness />
        </div>
      </Container>
    </main>
  )
}
