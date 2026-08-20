'use client'

import dynamic from 'next/dynamic'
import { TierGate } from '@/components/motion/TierGate'

/**
 * The Full tier's shared canvas, and the only reference to it in the app.
 *
 * `ssr: false` plus a dynamic import plus the render function boundary in `TierGate`
 * is what keeps every Three.js byte off the Reduced and Static tiers. See ADR 0015.
 * Verified in a real browser by scripts/check-bundle.mjs, which greps chunk bodies
 * rather than chunk names.
 */
const SiteScene = dynamic(
  () => import('@/components/motion/webgl/SiteScene').then((module) => module.SiteScene),
  { ssr: false },
)

/**
 * Mounts whichever renderer the tier calls for, once per page. ADR 0020.
 *
 * Full tier: one canvas, holding the hero field and the Thread stream as two scenes.
 * Reduced tier: no Three.js at all, so the Thread stream is a 2D canvas overlay and
 * the hero keeps its own 2D field inside the hero section.
 * Static tier: nothing. The Thread renders as a plain SVG stroke and no canvas is
 * created anywhere on the page.
 *
 * The wrapper is a static div, so the canvas inside it is positioned against the
 * viewport and its z-index competes in the page's stacking context, which is what
 * puts it between the dark grounds and the content.
 */
export function SceneLayer() {
  return (
    <TierGate
      full={({ onContextLost }) => <SiteScene onContextLost={onContextLost} />}
      reduced={null}
    />
  )
}
