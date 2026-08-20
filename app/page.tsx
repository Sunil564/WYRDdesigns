import { SceneLayer } from '@/components/motion/SceneLayer'
import { Thread } from '@/components/motion/Thread'
import { Capabilities } from '@/components/sections/Capabilities'
import { Clients } from '@/components/sections/Clients'
import { ContactCta } from '@/components/sections/ContactCta'
import { Hero } from '@/components/sections/Hero'
import { Positioning } from '@/components/sections/Positioning'
import { Process } from '@/components/sections/Process'
import { SelectedWork } from '@/components/sections/SelectedWork'
import { StudioStrip } from '@/components/sections/StudioStrip'

/**
 * The homepage. Nine sections, in the brief's order, and the Thread running through
 * all of them.
 *
 * The Thread is last in the tree and built last in the phase, because its geometry
 * is measured from the sections above it. It cannot be built before their positions
 * are stable. Brief Phase 4.
 *
 * `SceneLayer` is the one canvas the page is allowed, mounted here rather than in a
 * section because both the hero field and the Thread stream are scenes inside it.
 * It renders nothing on the Static tier. Brief 7b.4, ADR 0020.
 */
export default function Home() {
  return (
    <main className="relative">
      <SceneLayer />
      <Thread />
      <Hero />
      <Positioning />
      <Capabilities />
      <SelectedWork />
      <Clients />
      <Process />
      <StudioStrip />
      <ContactCta />
    </main>
  )
}
