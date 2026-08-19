'use client'

import type { ReactNode } from 'react'
import { useRenderTier } from '@/components/motion/useRenderTier'

type TierGateProps = {
  /**
   * The Full tier branch. A render function, not a node, so the element is only
   * constructed when this branch is actually taken. That is what keeps the
   * dynamic import from being reached on the other tiers.
   */
  full: (args: { onContextLost: () => void }) => ReactNode
  /** The Reduced tier branch. Cheap enough to build eagerly. */
  reduced: ReactNode
  /** The Static tier branch. Nothing, unless a section needs a still. */
  still?: ReactNode
  className?: string
}

/**
 * The tier boundary. Brief 7b.1, ADR 0015.
 *
 * Renders exactly one branch. Nothing renders until the tier is decided on the
 * client, so no branch is ever taken speculatively. On WebGL context loss the
 * Full branch drops to the Reduced branch, which is why losing a context shows a
 * 2D field rather than a black rectangle.
 *
 * The resolved tier is published as `data-tier` on the wrapper so verification can
 * assert which branch rendered instead of inferring it from pixels.
 */
export function TierGate({ full, reduced, still = null, className }: TierGateProps) {
  const { tier, downgrade } = useRenderTier()

  return (
    <div data-tier={tier} className={className}>
      {tier === 'full' && full({ onContextLost: downgrade })}
      {tier === 'reduced' && reduced}
      {tier === 'static' && still}
    </div>
  )
}
