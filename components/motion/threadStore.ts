'use client'

import type { ThreadBand, ThreadSamples } from '@/components/motion/threadGeometry'

/**
 * The handoff between the Thread and whichever renderer is drawing it.
 *
 * `Thread` measures the route and owns the ScrollTrigger. The renderers live in a
 * different part of the tree: the Full tier's stream is a scene inside the one
 * shared canvas, mounted at the page root, and the Reduced tier's is a fixed 2D
 * overlay. A React context would mean threading a provider through the layout and
 * re-rendering a canvas host on every scroll tick.
 *
 * So: sampled geometry is published here and subscribed to, and scroll progress is
 * written into a shared typed array that the render loops read directly. Progress
 * changes sixty times a second and must never cause a React render. See ADR 0020.
 */

/** Uniform array size for per group values. Nine paths at the widest, sixteen is slack. */
export const MAX_GROUPS = 16

/** Uniform array size for inverse blocks. Four today: the four names in Phase 4b section 4. */
export const MAX_BANDS = 8

export type ThreadStreamData = {
  /** Bumped on every publish, so a subscriber can tell a new sample set from the same one. */
  version: number
  samples: ThreadSamples
  /** Inverse block tops and bottoms in document pixels, padded to MAX_BANDS. */
  bandTops: Float32Array
  bandBottoms: Float32Array
  bandCount: number
  /** The hero's document box, which the handoff needs. */
  hero: ThreadBand | null
}

const state = {
  data: null as ThreadStreamData | null,
  /** Reveal progress, 0 to 1, per group. Written by ScrollTrigger, read per frame. */
  progress: new Float32Array(MAX_GROUPS),
  /** Hero exit progress, 0 to 1, which drives the field's handoff into the stream. */
  handoff: 0,
}

const listeners = new Set<() => void>()

export function publishThread(data: Omit<ThreadStreamData, 'version'>): void {
  state.data = { ...data, version: (state.data?.version ?? 0) + 1 }
  for (const listener of listeners) listener()
}

export function clearThread(): void {
  state.data = null
  state.progress.fill(0)
  state.handoff = 0
  for (const listener of listeners) listener()
}

export function subscribeThread(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** The live store. Read it in a render loop, do not copy it into React state. */
export function threadState() {
  return state
}
