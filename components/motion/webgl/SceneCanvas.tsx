'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Canvas } from '@react-three/fiber'
import { useThree } from '@react-three/fiber'

type SceneCanvasProps = {
  children: ReactNode
  /**
   * `always` for a continuously animating scene, the hero field. `demand` for a
   * scene that only redraws on interaction, the work cards. Brief 7b.4.
   */
  frameloop?: 'always' | 'demand'
  /** Called when the WebGL context is lost, so the caller can drop a tier. */
  onContextLost?: () => void
  /**
   * Published as `data-field-count` so verification can read how many points the
   * scene actually decided to draw, rather than inferring it from pixels.
   */
  pointCount?: number
  /**
   * Published as `data-thread-stream`, for the same reason as `pointCount`: the
   * number of particles the Thread stream decided to draw should be readable
   * rather than inferred from pixels.
   */
  streamCount?: number
  className?: string
}

/**
 * Disposes the renderer and drops the GPU context on unmount.
 *
 * R3F disposes scene objects for you and leaves the WebGLRenderer's context
 * alive, which is how ten mount and unmount cycles turn into ten live contexts
 * and a browser that starts evicting the oldest one. Criterion 9 in section 11 is
 * about exactly this.
 */
function DisposeOnUnmount() {
  const gl = useThree((state) => state.gl)

  useEffect(() => {
    return () => {
      gl.dispose()
      // forceContextLoss is the only way to hand the context back immediately
      // rather than waiting for the garbage collector.
      gl.forceContextLoss()
    }
  }, [gl])

  return null
}

/** Reports context loss upward and prevents the browser's default black frame. */
function ContextLossReporter({ onLost }: { onLost?: () => void }) {
  const gl = useThree((state) => state.gl)

  useEffect(() => {
    const canvas = gl.domElement
    const handle = (event: Event) => {
      event.preventDefault()
      onLost?.()
    }
    canvas.addEventListener('webglcontextlost', handle)
    return () => canvas.removeEventListener('webglcontextlost', handle)
  }, [gl, onLost])

  return null
}

/**
 * The one canvas per page. Brief 7b.4.
 *
 * Fixed position, full viewport, behind content, non interactive, hidden from
 * assistive technology. Sections put their scenes inside it rather than mounting
 * a canvas each.
 *
 * This module is only ever reached through a `next/dynamic` import with
 * `ssr: false`, inside the Full tier branch, which is what keeps Three.js out of
 * the Reduced and Static tiers. See ADR 0015.
 *
 * The frameloop is suspended when the canvas is out of view or the tab is hidden,
 * so an unwatched scene costs nothing.
 */
export function SceneCanvas({
  children,
  frameloop = 'always',
  onContextLost,
  pointCount,
  streamCount,
  className,
}: SceneCanvasProps) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const [active, setActive] = useState(true)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    let inView = true

    const sync = () => setActive(inView && !document.hidden)

    const observer = new IntersectionObserver(
      (entries) => {
        inView = entries[0]?.isIntersecting ?? false
        sync()
      },
      { threshold: 0 },
    )
    observer.observe(host)

    const onVisibility = () => sync()
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      observer.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  return (
    <div
      ref={hostRef}
      aria-hidden="true"
      data-field="webgl"
      data-field-count={pointCount}
      data-thread-stream={streamCount}
      className={className}
      style={{ pointerEvents: 'none' }}
    >
      <Canvas
        frameloop={active ? frameloop : 'never'}
        // Never 3x. The cost is quadratic and the gain is invisible. Brief 7b.4.
        dpr={[1, 2]}
        gl={{
          antialias: false,
          alpha: true,
          powerPreference: 'high-performance',
          // The field is additive over a dark canvas, so depth and stencil buffers
          // are dead weight.
          depth: false,
          stencil: false,
        }}
        camera={{ position: [0, 0, 5], fov: 45, near: 0.1, far: 100 }}
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        <ContextLossReporter onLost={onContextLost} />
        <DisposeOnUnmount />
        {children}
      </Canvas>
    </div>
  )
}
