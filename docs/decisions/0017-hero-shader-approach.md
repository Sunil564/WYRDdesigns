# 0017. Hero field shader approach, and the bloom pass that was cut

Status: accepted
Date: 2026-08-20
Phase: 3

## Context

Brief 7b.2A specifies the hero field: 20,000 to 40,000 instanced points in a single draw call, positions driven by curl noise in the vertex shader, cursor repulsion with inverse square falloff eased back to the noise position, a soft additive fragment with roughly one point in twelve carrying the accent, the cursor uniform lerped at 0.08, and one subtle bloom pass on the accent points only. It also says, in as many words, that finding yourself writing a CPU `for` loop over positions means it was built wrong.

## Decision

**28,000 points, one `THREE.Points`, one draw call.** Inside the specified band with headroom. Positions, a per point random, and a per point scale are the only attributes.

**All motion in the vertex shader.** The per frame JavaScript is exactly two things: advance one time uniform, and ease two cursor uniforms. No loop over positions exists anywhere in this build. Verified in the browser, not asserted: a zero delay `setTimeout` resolves in 0.2ms while 28,000 points animate, which it could not do if the main thread were doing the work.

**Curl noise, not plain noise.** The drift is the curl of a simplex potential field, computed by central differences of three offset simplex samples. Curl noise is divergence free, so the field swirls and stays evenly distributed. Plain noise drifts every point in the same direction and empties one side of the screen within a minute.

**Simplex is inlined GLSL, not `glsl-noise`.** The brief suggests the `glsl-noise` package. That package is a glslify module: using it means adding a glslify transform to the bundler for one function. Ashima Arts and Stefan Gustavson's simplex implementation is MIT licensed, about 60 lines, and is inlined in `heroField.glsl.ts` with attribution. One dependency and one bundler transform avoided.

**Cursor easing lives in the uniform, not in per particle state.** The spec asks for points to be pushed away and then eased back to their noise position. A shader is stateless per frame, so per particle easing would need a GPGPU ping pong pass over a position texture: two more render targets, two more passes, and a large increase in complexity and bytes. Instead the cursor uniform itself is lerped at 0.08, the value the brief specifies. The field trails the pointer, and as the smoothed cursor catches up the displacement decays smoothly back to zero. Visually this is what was asked for. Mechanically it is one uniform.

**Fragment shader.** Soft circular falloff, squared so the core stays tight, additive blending, `depthWrite` and `depthTest` off. Colour mixes `--color-border` to `--color-fg-muted` by the per point random, and to `--color-accent` for accent points. Accent selection is `step(0.917, aRandom)`, which is 8.3 percent, one in twelve.

**Palette comes from `getComputedStyle`.** The shader reads `--color-border`, `--color-fg-muted`, and `--color-accent` off the root element at mount and passes them as uniforms. No hex value appears outside `globals.css`.

**A frame rate watchdog, not a fixed count.** The scene measures its own average frame rate over its first two seconds. Below 40fps it halves the point count, once, down to a floor of 9,000. The brief's cut order is particle count before anything visual, so the code follows the brief automatically on a machine that cannot hold the rate.

### The bloom pass, measured and cut

The brief asks for a single bloom pass on the accent points. It also sets the Full tier budget at 500kb gzipped and states the cut order: drei imports, then postprocessing, then particle count.

Measured rather than guessed. `postprocessing` plus `@react-three/postprocessing` were installed, a `<Bloom mipmapBlur />` was added to the scene, and the production build was compared against the same build without it:

| Build | Total chunk bytes, gzipped |
|---|---|
| without the bloom pass | 605,962 |
| with the bloom pass | 700,187 |
| **difference** | **94,225, about 92kb gzipped** |

The Full tier on `/` measures 444.1kb over the wire. Adding 92kb puts it at roughly 536kb, past the 500kb budget. The brief's own cut order puts postprocessing ahead of particle count, so the pass is cut and the packages are uninstalled.

**What replaces it.** The glow is done in the fragment shader: accent points get a slightly larger point size and a second wide, low amplitude falloff lobe added to their alpha. One extra `smoothstep` per accent fragment, zero extra passes, zero extra bytes. It reads as a soft halo around the orange points, which is what the bloom was for.

## Consequences

- Full tier on `/`: 444.1kb over the wire, inside budget, with roughly 56kb of headroom.
- Reduced tier on `/`: 214.0kb over the wire, zero Three.js bytes.
- Frame rate under headless SwiftShader software rendering, with no GPU at all, measures about 50fps. A real GPU is not the constraint here.
- CLS from the headline reveal measures 0.0004. LCP is a `SPAN` of headline text at 188ms, never the canvas.
- **`three` is pinned to 0.180.0, not the current 0.185.** three 0.184 and later print `THREE.Clock: This module has been deprecated` on every mount, and R3F 9.7 constructs a `THREE.Clock` internally. Criterion 18 requires zero console warnings at runtime, and a warning from a dependency is still a warning in the console. The pin comes off when R3F moves to `THREE.Timer`.
- If the operator wants the true bloom pass later, the budget has to move or 92kb has to come from somewhere else. That is a decision with a number attached now, rather than a preference.
- **drei is installed and still imported nowhere.** Nothing in the hero needed it.
