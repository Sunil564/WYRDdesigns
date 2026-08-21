'use client'

import { useCallback, useState } from 'react'
import { POINT_BAND } from '@/components/motion/threadGeometry'
import { HeroField } from '@/components/motion/webgl/HeroFieldScene'
import { SceneCanvas } from '@/components/motion/webgl/SceneCanvas'
import { ThreadStream } from '@/components/motion/webgl/ThreadStreamScene'

/**
 * The one canvas on the page, and every scene inside it. Brief 7b.4, ADR 0020.
 *
 * Brief 7b.4 allows one `<Canvas>` per page, shared across sections as a fixed
 * position canvas with per section scenes. Until now the hero owned the only WebGL
 * on the page and a canvas scoped to the hero satisfied that trivially. The Thread
 * spans the whole document, so the rule now has to be met properly.
 *
 * Layering, which is the part that matters. The host sits at `z-2`, which is the
 * slot the SVG Thread held: above the grain at `z-1` and above the dark grounds an
 * inverse `Section` paints in the positioned-auto layer, below section content at
 * `z-10`. That is what lets the stream cross a dark block instead of hiding behind
 * it, and it is why the crossing needs no blend mode. See ADR 0019 and ADR 0020.
 *
 * One consequence, recorded rather than hidden: the hero field now paints above the
 * grain rather than below it, because it shares the Thread's layer. The grain is a
 * 3 percent multiply, so this lightens the field by about one level. Measured, not
 * assumed.
 */
export function SiteScene({ onContextLost }: { onContextLost?: () => void }) {
  const [heroPoints, setHeroPoints] = useState(0)
  const [streamPoints, setStreamPoints] = useState(0)
  const onCount = useCallback((value: number) => setHeroPoints(value), [])
  const onStreamCount = useCallback((value: number) => setStreamPoints(value), [])

  return (
    <SceneCanvas
      frameloop="always"
      onContextLost={onContextLost}
      pointCount={heroPoints}
      streamCount={streamPoints}
      streamBand={`${POINT_BAND.min}-${POINT_BAND.max}`}
      className="pointer-events-none fixed inset-0 z-[2] h-full w-full"
    >
      <HeroField onCount={onCount} />
      <ThreadStream onCount={onStreamCount} />
    </SceneCanvas>
  )
}
