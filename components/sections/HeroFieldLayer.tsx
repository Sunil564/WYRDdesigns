'use client'

import { ParticleField2D } from '@/components/motion/ParticleField2D'
import { TierGate } from '@/components/motion/TierGate'

/**
 * S1 layer 2, on the tiers that do not get the shared canvas. Brief 6.1 and 7b.2A.
 *
 * The Full tier renders nothing here. Its field is a scene inside the one shared
 * canvas that `SceneLayer` mounts, because the Thread needs the same canvas and
 * brief 7b.4 allows one per page. See ADR 0020.
 *
 * Reduced tier gets the 2D canvas, still scoped to the hero section so it is clipped
 * by the section box and stops existing below it. Static tier mounts nothing at all:
 * no canvas element, no context, no loop.
 *
 * The layer is `pointer-events: none` and `aria-hidden` at every level, so it can
 * never intercept a click on either hero action and it does not exist for a screen
 * reader.
 */
export function HeroFieldLayer() {
  return (
    <TierGate
      className="pointer-events-none absolute inset-0 z-0"
      full={() => null}
      reduced={<ParticleField2D seed="wyrd-hero" className="absolute inset-0" />}
    />
  )
}
