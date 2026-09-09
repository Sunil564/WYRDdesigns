/**
 * Vanta ships no types, so this is the contract we hold it to. See ADR 0031.
 *
 * Only the members this build actually touches are declared. `renderer` and
 * `uniforms` are here because the cleanup path and the texture wrapping need
 * them, and because Vanta's own `destroy()` leaves the WebGL context alive.
 */
declare module 'vanta/dist/vanta.clouds2.min' {
  import type { Texture, WebGLRenderer } from 'three'

  export type VantaCloudsOptions = {
    el: HTMLElement
    /**
     * Our own Three.js, assembled from named imports. Without this Vanta reads
     * `window.THREE`, which does not exist here and never will: nothing on this
     * site loads a library from a script tag.
     */
    THREE: Record<string, unknown>
    mouseControls?: boolean
    touchControls?: boolean
    gyroControls?: boolean
    minHeight?: number
    minWidth?: number
    /** Divides devicePixelRatio. Higher renders fewer pixels, not more. */
    scale?: number
    scaleMobile?: number
    speed?: number
    texturePath?: string
  }

  export type VantaEffect = {
    destroy: () => void
    setOptions: (options: Partial<VantaCloudsOptions>) => void
    renderer?: WebGLRenderer | null
    uniforms?: { iTex?: { value?: Texture } }
  }

  export type VantaCloudsFactory = (options: VantaCloudsOptions) => VantaEffect

  /**
   * The dist build is UMD and sets `module.exports = { default: factory }` with no
   * `__esModule` flag, so a bundler's interop hands back the exports object rather
   * than the factory. The union is not defensive typing, it is what the two module
   * systems actually produce, and `resolveFactory` in CloudsScene unwraps it.
   */
  const CLOUDS2: VantaCloudsFactory | { default: VantaCloudsFactory }
  export default CLOUDS2
}
