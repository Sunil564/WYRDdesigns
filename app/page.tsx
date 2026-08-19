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
 */
export default function Home() {
  return (
    <main className="relative">
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
