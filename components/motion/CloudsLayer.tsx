'use client'

import dynamic from 'next/dynamic'
import { TierGate } from '@/components/motion/TierGate'

/**
 * The tier boundary for the clouds, and the only reference to that scene in the app.
 *
 * Same shape as `SceneLayer` and for the same reason: a dynamic import with
 * `ssr: false`, reached only from the render function of the Full branch, is what
 * keeps Vanta and the Three.js modules it pulls off the Reduced and Static tiers.
 * Verified by `scripts/check-bundle.mjs`, which reads chunk bodies rather than
 * chunk names. See ADR 0031 and ADR 0015.
 */
const CloudsScene = dynamic(
  () => import('@/components/motion/webgl/CloudsScene').then((module) => module.CloudsScene),
  { ssr: false },
)

/**
 * Reduced and Static render nothing at all, which is a decision rather than an
 * omission. A still frame of a cloud field is a photograph of the sky, and the
 * site has no photograph of the sky. The section reads as it did before, on the
 * canvas ground, which is a composition that already works.
 *
 * Static covers reduced motion, so this is also what keeps criterion 13 true: no
 * canvas is created anywhere on the page when a visitor has asked for stillness.
 */
export function CloudsLayer() {
  return (
    <TierGate
      className="pointer-events-none absolute inset-0"
      full={() => <CloudsScene />}
      reduced={null}
    />
  )
}
