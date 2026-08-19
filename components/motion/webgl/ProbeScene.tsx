'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Mesh } from 'three'
import { SceneCanvas } from '@/components/motion/webgl/SceneCanvas'

/**
 * Internal verification scene for the `/tiers` route.
 *
 * Not one of the three WebGL uses in brief 7b: nothing on the public site renders
 * it. It exists so the Full tier branch, the DPR clamp, frameloop suspension,
 * disposal on unmount, and the context loss handler can be exercised on their own,
 * before the hero field is built on top of them.
 *
 * Individual module imports only, per brief 7b.1. There is no
 * `import * as THREE` anywhere in this build.
 */
function Probe() {
  const mesh = useRef<Mesh | null>(null)

  useFrame((_state, delta) => {
    if (!mesh.current) return
    mesh.current.rotation.x += delta * 0.2
    mesh.current.rotation.y += delta * 0.3
  })

  return (
    <mesh ref={mesh}>
      <icosahedronGeometry args={[1.6, 1]} />
      <meshBasicMaterial color="#26262e" wireframe />
    </mesh>
  )
}

export function ProbeScene({ onContextLost }: { onContextLost?: () => void }) {
  return (
    <SceneCanvas
      frameloop="always"
      onContextLost={onContextLost}
      className="absolute inset-0 h-full w-full"
    >
      <Probe />
    </SceneCanvas>
  )
}
