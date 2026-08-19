/**
 * Class name joiner. Falsy values drop out, everything else joins with a space.
 *
 * Deliberately not clsx or tailwind-merge. Both are fine libraries and neither
 * earns a dependency here: nothing in this build needs conflict resolution
 * between two Tailwind classes, because a component that takes a className does
 * not also set the same property itself.
 */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/**
 * Deterministic 32 bit PRNG, mulberry32. Same seed, same sequence, forever.
 * Used by the placeholder generator so a layout does not shuffle between
 * reloads or between a local build and a deploy. See docs/decisions/0013.
 */
export function seededRandom(seed: string): () => number {
  let h = 2166136261
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  let a = h >>> 0
  return function next(): number {
    a += 0x6d2b79f5
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Linear interpolation, used by the cursor followers. */
export function lerp(from: number, to: number, amount: number): number {
  return from + (to - from) * amount
}

/** Clamp, for pointer maths that must not run off the end of a range. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}
