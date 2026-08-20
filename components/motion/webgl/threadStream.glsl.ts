import { MAX_GROUPS } from '@/components/motion/threadStore'

/**
 * Thread particle stream shaders. Particle brief part 2.
 *
 * The stream is one `THREE.Points` in the shared canvas, one draw call.
 *
 * Placement is deliberately not here. Positions arrive in document pixels and are
 * mapped to world units by the object's own transform, set on the CPU each frame, so
 * this shader does nothing but hand `position` to Three's matrices. The mapping was a
 * set of float uniforms first and the stream rendered nothing at all; putting it on
 * the object matrix means the numbers travel by the same path every other object's do.
 * See ADR 0020.
 *
 * There is no cursor interaction and no noise field to integrate, so this is a much
 * cheaper shader than the hero field's.
 *
 * Reveal and head, particle brief 2.4, work entirely off two per group uniform arrays
 * and the `aAlong` attribute the sampler already wrote. Nothing is recomputed per
 * frame on the CPU and no buffer is re-uploaded: scroll changes sixteen floats.
 */

/**
 * Point size at the head, as a multiple of the same particle's rest size, and the
 * head's alpha floor. Both are ratios off the rest state rather than absolutes,
 * deliberately: the stream and the hero field are due one shared tuning pass on base
 * size and base alpha, and a ratio survives that pass where a second absolute would
 * have to be re-tuned with it.
 */
const HEAD_SIZE_GAIN = 1.6

export const threadVertexShader = /* glsl */ `
uniform float uPixelRatio;
uniform float uSize;

/*
  Reveal progress and head window, one entry per sampled path, indexed by aGroup.

  Per group rather than per particle because that is what the route is: nine paths,
  each with its own ScrollTrigger, each drawn over its own stretch of scroll. The
  numbers here are the same numbers the SVG carrier's stroke-dashoffset gets, written
  in the same onUpdate, which is what criterion 8 asks for. There is no second source
  of truth and no interpolation between them, so they cannot drift apart on a fast
  scroll or a reversal.

  A uniform array indexed by an attribute is dynamic indexing, which ESSL 1.00 allows
  for non-sampler uniforms. It is read once here in the vertex shader and the result
  travels to the fragment shader as a varying, so it costs one indexed fetch per
  particle rather than one per fragment.
*/
uniform float uProgress[${MAX_GROUPS}];
uniform float uHeadFraction[${MAX_GROUPS}];

attribute float aAlong;
attribute float aGroup;
attribute float aRandom;

varying float vRandom;
varying float vHead;

void main() {
  vRandom = aRandom;

  int group = int(aGroup + 0.5);
  float progress = uProgress[group];
  float headFraction = uHeadFraction[group];

  /*
    The reveal is a hard threshold, not a fade.

    aAlong is the particle's normalised position along its own path and progress is
    where the draw head is, so the test is the brief's sentence exactly: visible only
    at or below current progress. A hard edge is right here for the reason a soft one
    is right nowhere on this stream: the particles are already discrete, so the tip is
    wherever the last visible particle happens to be and there is nothing to alias.
    Softening it would only make the head's leading edge translucent, which fights the
    head cluster sitting on top of it.
  */
  float revealed = step(aAlong, progress);

  /*
    Undrawn particles leave the clip volume rather than being drawn transparent.

    A zero alpha particle still rasterises and still costs a fragment, and at this
    count that is most of the stream for most of the page. Putting the vertex outside
    the clip volume gets it culled before rasterisation, so an unrevealed particle
    costs one vertex shader invocation and nothing else.
  */
  if (revealed < 0.5) {
    vHead = 0.0;
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    gl_PointSize = 0.0;
    return;
  }

  /*
    The head window is [progress - headFraction, progress], the same 240px the SVG
    head's dash window covered, expressed as a fraction of this path's own length so
    a short branch gets the same real head as the long trunk.

    Squared so the weight concentrates near the tip. The brief asks for a cluster, and
    a linear ramp over 240px reads as a long accent smear instead: the particles need
    to crowd toward the head, not shade evenly back from it.
  */
  float head = clamp((aAlong - (progress - headFraction)) / max(headFraction, 1e-5), 0.0, 1.0);
  head *= head;

  /*
    No head on a path that has not started, and none on one that has finished.

    Nine paths each parking a permanent accent blob at its own end point is what the
    SVG version avoided by dropping the head's opacity outside 0.001 to 0.999. Same
    two bounds, but the upper one is a ramp rather than a step, because a particle
    head that vanished in one frame at the end of every path would read as a blink.
  */
  head *= step(0.001, progress) * (1.0 - smoothstep(0.985, 1.0, progress));
  vHead = head;

  // position is in document pixels. The object's matrix carries the scroll, the
  // page centre, and the pixels to world units scale.
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

  /*
    Point size is in framebuffer pixels and is not affected by the object's scale,
    which is what makes the object matrix placement safe: a particle is the same size
    wherever it is on the page, and the stream sits on one plane so there is no
    perspective term to apply either.
  */
  float size = uSize * uPixelRatio * (0.72 + aRandom * 0.56);
  gl_PointSize = size * mix(1.0, ${HEAD_SIZE_GAIN.toFixed(2)}, head);
}
`

export const threadFragmentShader = /* glsl */ `
precision mediump float;

uniform vec3 uColourRest;
uniform vec3 uColourHead;
uniform float uOpacity;

varying float vRandom;
varying float vHead;

void main() {
  float d = length(gl_PointCoord - vec2(0.5));
  if (d > 0.5) discard;

  // The same falloff the hero field uses, so the two read as one material.
  float core = smoothstep(0.5, 0.0, d);
  core *= core;

  /*
    Rest colour is --fg-muted, not --border. The particle brief 2.4 is explicit
    about this and it is right: --border was chosen for a solid 1px hairline, and
    discrete particles at that lightness on white are invisible. 50 to 70 percent
    alpha, per the same section.
  */
  float rest = 0.5 + vRandom * 0.2;

  /*
    The head gets an alpha floor of its own rather than a multiplier off the rest
    alpha, which is how the hero field handles its accent points. A multiplier makes
    the head's brightness depend on the particle's own random, so the cluster comes
    out mottled; a floor makes every particle in the head bright and keeps only a
    little variance on top.
  */
  float head = 0.86 + vRandom * 0.14;

  float alpha = core * mix(rest, head, vHead) * uOpacity;
  if (alpha < 0.002) discard;

  // Rest to accent across the head window, so the head is a travelling gradient
  // rather than a hard edged dash. The hard edges on this stream are the reveal tip
  // and, in the step that follows, the inverse block boundary.
  gl_FragColor = vec4(mix(uColourRest, uColourHead, vHead), alpha);
}
`
