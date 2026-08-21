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

import { MAX_BANDS } from '@/components/motion/threadStore'

/**
 * Point size at the head, as a multiple of the same particle's rest size, and the
 * head's alpha floor. Both are ratios off the rest state rather than absolutes,
 * deliberately: the stream and the hero field are due one shared tuning pass on base
 * size and base alpha, and a ratio survives that pass where a second absolute would
 * have to be re-tuned with it.
 */
const HEAD_SIZE_GAIN = 1.6

/**
 * How much of the dispersion a particle at full head weight keeps. Item C.
 *
 * The brief's first preference is that the head disperses with everything else and blooms
 * and re-forms. It does not survive that. Undamped, the accent particles scattered evenly
 * through the cloud and the leading edge stopped reading as a head at all.
 *
 * Damped, the bright core of the head holds as a cluster. Its dim trailing edge still
 * spreads, and by design: damping is proportional to a particle's own head weight, so a
 * particle 200px back carries little of it. Measured accent bounding width per column is
 * about 405px against a full spread of 500px, and almost all of that width is the faint
 * tail rather than the core.
 *
 * At 0.14 the head holds together as a tight cluster while the settled stream behind it
 * blooms, so the thread arrives at the logo row as a line and disperses behind its own
 * leading edge. That reads better than either extreme, and it is the fallback the brief
 * names.
 */
const HEAD_DISPERSE_DAMP = 0.14

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

/*
  The dark grounds the stream crosses, as document Y ranges. Particle brief 2.5.

  One entry per [data-inverse-band], measured by the same pass that samples the paths,
  so there is one definition of where the dark ground is. In practice this is the contact
  call to action: ADR 0020 section 7 records that the four dark cluster cards paint over
  the stream rather than under it, so there is nothing to switch on them.

  Not mix-blend-mode on the canvas, which would blend the hero field along with the
  stream. ADR 0019 rejected difference blending for the stroke with arithmetic and the
  canvas case is strictly worse.
*/
uniform float uBandTops[${MAX_BANDS}];
uniform float uBandBottoms[${MAX_BANDS}];
uniform float uBandCount;

/*
  The dispersion band, item C. Document Y range, and the maximum spread reached at its
  centre. uDisperseSpread is zero when there is no logo row on the page, which switches
  the whole effect off without a branch.

  The same mechanism step 6 uses: a Y range as a uniform, tested per particle against its
  own document Y. Nothing about the route changes for this, so path length, sample count
  and the density tripwire are all untouched.
*/
uniform float uDisperseTop;
uniform float uDisperseBottom;
uniform vec2 uDisperseSpread;

attribute float aRandom;

varying float vRandom;
varying float vHead;
varying float vInverse;

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

  /*
    Which ground this particle is on, decided per particle from its own document Y.

    A point primitive has one vertex, so this varying arrives at the fragment shader
    exactly 0 or 1 with nothing interpolated. That is what makes the switch hard at the
    block boundary without a single comparison in the fragment shader: the edge falls
    between two particles, which is as hard as a discrete stream can be, and it matches
    the hard edge the background itself has.

    No break, which ESSL 1.00 is awkward about, and no dynamic loop bound. Bands past
    the count are gated to zero by the multiply instead.
  */
  float inverse = 0.0;
  for (int i = 0; i < ${MAX_BANDS}; i++) {
    float live = step(float(i), uBandCount - 0.5);
    inverse = max(inverse, live * step(uBandTops[i], position.y) * step(position.y, uBandBottoms[i]));
  }
  vInverse = inverse;

  /*
    Dispersion. The stream blooms outward through the client logo band and re-gathers
    below it, so the thread reads as dispersing around the logos rather than running
    behind them.

    The ramp is a triangle in Y across the band, 0 at both edges and 1 at the centre, then
    eased by smoothstep so it has zero slope at the edges and at the peak. That is what
    makes the bloom and the re-gather both gradual, and it needs no state and no time: it
    is a function of the particle's own position, so scrolling produces the animation.

    Direction is per particle and hashed off aRandom rather than taken radially from a
    centre point, which would draw a circle and put us back at the arcs. It is hashed
    rather than used raw because aRandom already drives size and alpha, and reusing it
    directly would tie a particle's direction to how big it is.

    The spread is biased horizontally by the shape of the row it surrounds: uDisperseSpread
    carries a third of the row's width against the row's own height, so the cloud is wide
    and shallow like the thing it is dispersing around.
  */
  float span = max(uDisperseBottom - uDisperseTop, 1.0);
  float t = clamp((position.y - uDisperseTop) / span, 0.0, 1.0);
  float ramp = smoothstep(0.0, 1.0, 1.0 - abs(t * 2.0 - 1.0));

  /*
    The head keeps almost none of the spread, so it stays a head. Without this the accent
    particles scatter across the full width of the cloud and the leading edge disappears.
    The result is that the thread arrives as a line and disperses behind its own head.
  */
  ramp *= mix(1.0, ${HEAD_DISPERSE_DAMP.toFixed(2)}, head);

  float hash = fract(sin(aRandom * 127.1 + 3.7) * 43758.5453);
  float angle = hash * 6.2831853;
  vec2 offset = vec2(cos(angle), sin(angle)) * uDisperseSpread * ramp;

  /*
    Displaced for drawing only. The reveal test and the head window above both read
    position.y untouched, and they have to: feeding a displaced Y into the reveal would
    let a particle that has drifted upward reveal before its neighbours, so the leading
    edge would fray and the head would smear instead of holding as a head.
  */
  vec3 drawn = position + vec3(offset, 0.0);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(drawn, 1.0);

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
uniform vec3 uColourRestInverse;
uniform vec3 uColourHeadInverse;
uniform float uOpacity;

varying float vRandom;
varying float vHead;
varying float vInverse;

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
  float restAlpha = 0.5 + vRandom * 0.2;

  /*
    The head gets an alpha floor of its own rather than a multiplier off the rest
    alpha, which is how the hero field handles its accent points. A multiplier makes
    the head's brightness depend on the particle's own random, so the cluster comes
    out mottled; a floor makes every particle in the head bright and keeps only a
    little variance on top.
  */
  float headAlpha = 0.86 + vRandom * 0.14;

  float alpha = core * mix(restAlpha, headAlpha, vHead) * uOpacity;
  if (alpha < 0.002) discard;

  /*
    Two grounds, picked by vInverse, then rest to accent across the head window.

    The head pair resolves to the same colour today: --accent-on-inverse and --accent
    are both #ff521f, because ADR 0019 found the accent reads on both grounds and gave it
    no twin. So the visible switch at a band edge is the rest colour, --fg-muted to
    --fg-inverse-muted. Both are read from tokens anyway rather than collapsed into one,
    so the day the tokens diverge this needs no shader change.
  */
  vec3 rest = mix(uColourRest, uColourRestInverse, vInverse);
  vec3 head = mix(uColourHead, uColourHeadInverse, vInverse);
  gl_FragColor = vec4(mix(rest, head, vHead), alpha);
}
`
