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
 * Reveal and head are driven by document Y against a single scalar, not by arc length
 * against per path progress. The reveal line sits at a fixed fraction of the viewport,
 * so it is stationary on screen and the head band cannot leave it. See ADR 0020.
 *
 * Nothing is recomputed per frame on the CPU and no buffer is re-uploaded: a scroll
 * frame changes two floats.
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
  The reveal line, in document pixels, and the head band's depth above it.

  One scalar for the whole stream, where step 5 had a uniform array per path. The line
  is derived from the same Lenis scroll value that places the object, in the same frame,
  so revealLine minus scroll is a constant and the line is pinned in viewport space by
  construction rather than by tuning. There is nothing to keep in step because there is
  only one number.

  Both are document pixels, which is the space the positions arrive in, so the reveal
  test is a comparison in the same units as the geometry.
*/
uniform float uRevealLine;
uniform float uHeadLength;

attribute float aRandom;

varying float vRandom;
varying float vHead;

void main() {
  vRandom = aRandom;

  /*
    Reveal by document Y.

    position.y is already the particle's document Y, so this needs no new attribute.
    Revealed means at or above the line, and above is a smaller Y because document Y
    grows downward, which is what makes this a step of position.y against the line
    rather than the other way round.

    Why Y rather than arc length, which is what step 5 shipped: the two diverge wherever
    the path is not vertical. The branch fan spends a lot of arc length crossing very
    little page, so an arc length head slows in Y while the scroll does not, and it
    drifts off the top of the viewport. Y cannot do that. It also makes the four
    branches reveal together, because they occupy one Y range, which is the behaviour
    the split wants anyway.

    Still a hard threshold, not a fade. The particles are discrete, so the leading edge
    is wherever the last revealed particle is and there is nothing to alias. Softening
    it would only make the head's own edge translucent underneath the head cluster.
  */
  float revealed = step(position.y, uRevealLine);

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
    The head band is the 240px of document Y immediately above the line, brightest at
    the line itself. Squared so the weight crowds toward the front: the brief asks for
    a cluster, and a linear ramp over 240px reads as a long accent smear instead.

    One band in page space rather than one window per path, which is the whole point of
    the change. Every particle within 240px above the line is in the head, whichever
    path it belongs to, so the four branches carry one head across all four at the same
    height instead of four heads at four different depths.

    The two guards step 5 needed are both gone, and neither is missed. There is no
    "path has not started", because a particle below the line is simply not revealed.
    There is no "path has finished" either: when the line descends past the end of the
    route the last particles fall out of the band on their own, over 240px, so the head
    fades out instead of parking at the end point.
  */
  float head = clamp(1.0 - (uRevealLine - position.y) / max(uHeadLength, 1e-5), 0.0, 1.0);
  head *= head;
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
