'use client'

import dynamic from 'next/dynamic'
import { ParticleField2D } from '@/components/motion/ParticleField2D'
import { TierGate } from '@/components/motion/TierGate'

/**
 * The Full tier hero scene, and the only reference to it in the app.
 *
 * `ssr: false` plus a dynamic import plus the render function boundary in
 * `TierGate` is what keeps every Three.js byte off the Reduced and Static tiers.
 * See ADR 0015. Verified in a real browser by scripts/check-tiers.mjs.
 */
const HeroFieldScene = dynamic(
  () => import('@/components/motion/webgl/HeroFieldScene').then((module) => module.HeroFieldScene),
  { ssr: false },
)

/**
 * S1 layer 2. Brief 6.1 and 7b.2A.
 *
 * Full tier gets the shader field. Reduced tier gets the 2D canvas. Static tier
 * mounts nothing at all: no canvas element, no context, no loop.
 *
 * The layer is `pointer-events: none` and `aria-hidden` at every level, so it can
 * never intercept a click on either hero action and it does not exist for a screen
 * reader.
 */
export function HeroFieldLayer() {
  return (
    <TierGate
      className="pointer-events-none absolute inset-0 z-0"
      full={({ onContextLost }) => <HeroFieldScene onContextLost={onContextLost} />}
      reduced={<ParticleField2D seed="wyrd-hero" className="absolute inset-0" />}
    />
  )
}
