'use client'

import { useCallback, useEffect, useState } from 'react'

export type RenderTier = 'full' | 'reduced' | 'static'

/** Undecided until the hook has run once on the client. Never assume a tier. */
export type TierState = RenderTier | 'pending'

const OVERRIDE_KEY = 'wyrd:tier'

function readOverride(): RenderTier | null {
  if (typeof window === 'undefined') return null

  const fromQuery = new URLSearchParams(window.location.search).get('tier')
  const fromStorage = window.localStorage.getItem(OVERRIDE_KEY)
  const candidate = fromQuery ?? fromStorage

  return candidate === 'full' || candidate === 'reduced' || candidate === 'static'
    ? candidate
    : null
}

/**
 * WebGL2 support, tested by actually creating a context rather than by sniffing.
 * The context is disposed immediately, so this costs one throwaway context on
 * mount and gives a real answer.
 */
function hasWebGL2(): boolean {
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2')
    if (!gl) return false
    gl.getExtension('WEBGL_lose_context')?.loseContext()
    return true
  } catch {
    return false
  }
}

function detect(): RenderTier {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return 'static'

  // A coarse pointer means a phone or a tablet. Those get the 2D fallback,
  // regardless of how fast the device is, because cursor interaction is the
  // point of the Full tier field and a finger has no hover.
  if (!window.matchMedia('(pointer: fine)').matches) return 'reduced'

  // deviceMemory is Chromium only and reports in GiB, rounded down to a power of
  // two. Absent means unknown, and unknown is treated as sufficient rather than
  // insufficient, since Safari and Firefox never report it and a 2021 MacBook is
  // a Full tier device.
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory
  if (typeof memory === 'number' && memory < 4) return 'reduced'

  const cores = navigator.hardwareConcurrency
  if (typeof cores === 'number' && cores > 0 && cores < 4) return 'reduced'

  if (!hasWebGL2()) return 'reduced'

  return 'full'
}

/**
 * The single most important performance decision in the build. Brief 7b.1.
 *
 * Tier is decided once, on mount, on the client. It returns `pending` on the
 * server and on first paint so nothing renders a tier specific branch before the
 * answer exists, which is also what keeps Three.js out of the initial chunk: the
 * Full branch is the only place the dynamic import lives, and it is not reached
 * until this resolves to `full`.
 *
 * `downgrade()` exists for WebGL context loss. Losing a context drops the page to
 * the Reduced tier rather than showing a black rectangle.
 *
 * Manual override for verification, in priority order: `?tier=full|reduced|static`
 * on the URL, then `localStorage['wyrd:tier']`. Without one, detection runs.
 */
export function useRenderTier(): { tier: TierState; downgrade: () => void } {
  const [tier, setTier] = useState<TierState>('pending')

  useEffect(() => {
    const override = readOverride()
    if (override) {
      setTier(override)
      return
    }

    setTier(detect())

    // A visitor turning reduced motion on mid session gets the still site
    // immediately, without a reload.
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => {
      if (readOverride()) return
      setTier(detect())
    }
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  const downgrade = useCallback(() => {
    setTier((current) => (current === 'full' ? 'reduced' : current))
  }, [])

  return { tier, downgrade }
}
