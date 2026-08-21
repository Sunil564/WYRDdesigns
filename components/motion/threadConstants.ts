/**
 * Every number the Thread's two renderers share.
 *
 * The Full tier draws the stream in GLSL and the Reduced tier draws it in Canvas 2D. They
 * cannot share code, because one is a shader and one is a loop, but there is no reason for
 * them to disagree about a wavelength. Each of these lived in the shader module and would have
 * been retyped into the overlay, which is the fault this build has paid for more than once: a
 * second copy of a number that goes stale silently and is never compared against the first.
 *
 * Behaviour still lives in each renderer. Only the constants are here.
 */

/** Base point size in CSS pixels, before the per particle variance. */
export const THREAD_BASE_SIZE = 3.0

/** Where the reveal line sits, as a fraction of viewport height from the top. */
export const REVEAL_OFFSET = 2 / 3

/** Point size at the head, as a multiple of the same particle's rest size. */
export const HEAD_SIZE_GAIN = 1.6

/** How much of the dispersion a particle at full head weight still receives. */
export const HEAD_DISPERSE_DAMP = 0.14

/** How much of the inward reach the dispersion keeps on its outward side. */
export const DISPERSE_OUTWARD = 0.3

/** Maximum distance a particle rides from the path centre, in CSS pixels. */
export const SPIRAL_RADIUS = 16

/** No particle's orbit comes inside this fraction of the maximum radius. */
export const SPIRAL_RADIUS_FLOOR = 0.3

/** Exponent on the radius hash. 1 spreads the annulus evenly. */
export const SPIRAL_RADIUS_CURVE = 1.0

/** Arc length of one full rotation, in pixels. */
export const SPIRAL_WAVELENGTH = 350.0

/** How far size and alpha swing either side of base as a particle rotates. */
export const SPIRAL_DEPTH = 0.8

/** Spiral radius multiplier inside the client logo cloud. */
export const SPIRAL_IN_CLOUD = 0.15

/** Spiral radius multiplier at full head weight, so the head arrives as a head. */
export const SPIRAL_HEAD_DAMP = 0.25

/** Radians per second the trail rotates at rest. One turn per eight seconds. */
export const SPIRAL_SPIN = 0.785

/** Alpha multiplier well inside a text box. */
export const TEXT_DIM = 0.3

/** Half width of the ramp across a text box edge, in pixels. */
export const TEXT_PAD = 6.0

/** How much of the text dimming a particle at full head weight receives. */
export const TEXT_DIM_HEAD_KEEP = 0.15

/** Resting alpha, base and per particle range. Particle brief 2.4, at 65 percent. */
export const REST_ALPHA_BASE = 0.325
export const REST_ALPHA_RANGE = 0.13

/** Head alpha floor and range. A floor rather than a multiplier, so the head is not mottled. */
export const HEAD_ALPHA_BASE = 0.86
export const HEAD_ALPHA_RANGE = 0.14
