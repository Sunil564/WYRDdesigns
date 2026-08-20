'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'
import { ParticleField2D } from '@/components/motion/ParticleField2D'
import { TierGate } from '@/components/motion/TierGate'
import { useRenderTier } from '@/components/motion/useRenderTier'
import { Button } from '@/components/ui/Button'

/**
 * The Full tier branch, and the only place this module is referenced.
 *
 * `ssr: false` plus a dynamic import means the chunk containing Three.js, R3F, and
 * this scene is fetched when the branch renders, and never before. On the Reduced
 * and Static tiers it is never rendered, so the chunk is never requested. That is
 * the criterion the entire performance budget rests on. See ADR 0015.
 */
const ProbeScene = dynamic(
  () => import('@/components/motion/webgl/ProbeScene').then((module) => module.ProbeScene),
  { ssr: false },
)

/**
 * Internal harness for Phase 2b. Lets a tier be forced, a scene be mounted and
 * unmounted repeatedly, and a context loss be triggered by hand, so all of it can
 * be watched in a real browser rather than reasoned about.
 */
export function TierHarness() {
  const { tier } = useRenderTier()
  const [mounted, setMounted] = useState(true)
  const [cycles, setCycles] = useState(0)

  const force = (value: 'full' | 'reduced' | 'static' | 'clear') => {
    if (value === 'clear') window.localStorage.removeItem('wyrd:tier')
    else window.localStorage.setItem('wyrd:tier', value)
    window.location.href = window.location.pathname
  }

  const cycle = async () => {
    for (let index = 0; index < 10; index += 1) {
      setMounted(false)
      await new Promise((resolve) => window.setTimeout(resolve, 120))
      setMounted(true)
      await new Promise((resolve) => window.setTimeout(resolve, 220))
      setCycles((current) => current + 1)
    }
  }

  const loseContext = () => {
    const canvas = document.querySelector<HTMLCanvasElement>('[data-field="webgl"] canvas')
    const gl = canvas?.getContext('webgl2') ?? canvas?.getContext('webgl')
    const extension = gl?.getExtension('WEBGL_lose_context')
    extension?.loseContext()
  }

  return (
    <div className="flex flex-col gap-12">
      <div className="flex flex-wrap items-center gap-6">
        <p className="label text-fg-muted">
          Detected tier:{' '}
          <span data-testid="tier" className="text-fg">
            {tier}
          </span>
        </p>
        <p className="label text-fg-muted">
          Mount cycles:{' '}
          <span data-testid="cycles" className="text-fg">
            {cycles}
          </span>
        </p>
      </div>

      <div className="flex flex-wrap gap-4">
        <Button variant="outline" onClick={() => force('full')}>
          Force full
        </Button>
        <Button variant="outline" onClick={() => force('reduced')}>
          Force reduced
        </Button>
        <Button variant="outline" onClick={() => force('static')}>
          Force static
        </Button>
        <Button variant="outline" onClick={() => force('clear')}>
          Clear override
        </Button>
      </div>

      <div className="flex flex-wrap gap-4">
        <Button variant="outline" onClick={() => setMounted((current) => !current)}>
          {mounted ? 'Unmount scene' : 'Mount scene'}
        </Button>
        <Button variant="outline" onClick={() => void cycle()} data-testid="cycle">
          Run 10 mount cycles
        </Button>
        <Button variant="outline" onClick={loseContext} data-testid="lose-context">
          Lose WebGL context
        </Button>
      </div>

      <div className="border-border bg-bg-raised relative h-[60vh] border">
        {mounted && (
          <TierGate
            className="absolute inset-0"
            full={({ onContextLost }) => <ProbeScene onContextLost={onContextLost} />}
            reduced={<ParticleField2D seed="tier-harness" className="absolute inset-0" />}
          />
        )}
      </div>
    </div>
  )
}
