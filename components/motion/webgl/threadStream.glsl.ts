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

import {
  DISPERSE_OUTWARD,
  HEAD_DISPERSE_DAMP,
  HEAD_SIZE_GAIN,
  SPIRAL_DEPTH,
  SPIRAL_HEAD_DAMP,
  SPIRAL_IN_CLOUD,
  SPIRAL_RADIUS_CURVE,
  SPIRAL_RADIUS_FLOOR,
  SPIRAL_SPIN,
  SPIRAL_WAVELENGTH,
  TEXT_DIM,
  TEXT_DIM_HEAD_KEEP,
  BURST_REACH,
  BURST_RUN,
  BURST_ZONE,
  TEXT_PAD,
} from '@/components/motion/threadConstants'
import { MAX_TEXT_RECTS } from '@/components/motion/threadGeometry'
import { MAX_BANDS } from '@/components/motion/threadStore'

/**
 * Point size at the head, as a multiple of the same particle's rest size, and the
 * head's alpha floor. Both are ratios off the rest state rather than absolutes,
 * deliberately: the stream and the hero field are due one shared tuning pass on base
 * size and base alpha, and a ratio survives that pass where a second absolute would
 * have to be re-tuned with it.
 */

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

/**
 * The spiral trail. Amending brief, superseding section 2.4's 1 to 3px idle offset.
 *
 * `SPIRAL_WAVELENGTH` is the arc length of one full rotation. The brief's 300 to 400px:
 * faster reads as noise, slower reads as a bend rather than a rotation.
 *
 * `SPIRAL_DEPTH` is how far size and alpha swing either side of their base value as a
 * particle rotates. This is the term that sells the rotation, not the radius. The geometry
 * is flat and z is 0 by construction, so there is no real depth to draw; a particle
 * swelling and brightening as it swings toward the viewer is the whole illusion.
 *
 * `SPIRAL_IN_CLOUD` and `SPIRAL_HEAD_DAMP` are the two places the trail has to stand down.
 * Inside the client logo band the dispersion is already displacing the same particles, so
 * the trail collapses toward its core and resolves into the cloud instead of adding to it.
 * Dropped from 0.3 to 0.15 when the dispersion widened: at the old value the wider cloud
 * read as a spiral sitting inside a cloud rather than as one form.
 * At the head it collapses for the reason the dispersion does: a spiralled head stops
 * reading as a head.
 */
/**
 * Where a particle rides between the centre line and the maximum radius.
 *
 * `SPIRAL_RADIUS_FLOOR` is the fraction of the maximum no particle comes inside, so the
 * centre line itself is empty. That is the change doing most of the work in thinning the
 * core, and it hollows the dense middle without emptying the band around it.
 *
 * `SPIRAL_RADIUS_CURVE` is the exponent on the hash. It was 2, which crowded particles
 * toward the core on purpose and is what made the centre too dense. At 1.0 the remaining
 * distribution across the annulus is even. Lowering the floor further, or dropping the
 * exponent below the brief's 0.8, is what turns this into a visible hollow tube, which is
 * the failure the exponent was there to avoid in the first place.
 */
/**
 * How much of the inward reach the dispersion keeps on its outward side. The brief asks for
 * roughly 70/30 and this is 77/23, tighter, because the inward reach it scales grew: at 0.43
 * the outward side reached x -39 at 1024, off the left edge of the viewport.
 */

/**
 * Radians per second the whole trail rotates at rest.
 *
 * The brief says to start static and add this only if it looks inert. It looks inert, and
 * the reason is structural rather than a tuning miss: phase is randomised per particle
 * across the full circumference, so there is no coherent sinusoid to see, and with nothing
 * moving a randomised static helix is indistinguishable from a randomly spread tube. The
 * cue that reads as rotation is the motion itself.
 *
 * One rotation per eight seconds. Slow enough that it is not a spin, fast enough that a
 * particle visibly travels while the page is still.
 */

/**
 * How the trail recedes over body copy. Item 1 of the dimming brief.
 *
 * `TEXT_DIM` is the alpha multiplier well inside a text box. Dimming rather than occluding:
 * cutting the trail out over copy would break it into disconnected segments and lose the
 * continuity the whole effect is for.
 *
 * `TEXT_PAD` is the half width of the ramp across a box's edge. Unlike the inverse band this
 * transition is soft, because a hard alpha step on a rectangle reads as a rectangle cut out
 * of the trail, which is more distracting than the particles were.
 *
 * `TEXT_DIM_HEAD_KEEP` is how much of the dimming a particle at full head weight receives.
 * Nearly none: the head is the moving focal point, and dimming it makes the thread look like
 * it stalls wherever it crosses copy.
 */

/**
 * The hero handoff. Step 8 of the parent brief's order of work, built here rather than
 * across two scenes.
 *
 * `HANDOFF_SPAN` is how far below the hero a particle still takes part, in document pixels.
 * The brief's 600 to 900px of path; the trunk is the only path in that range, so the window
 * needs no per path test.
 *
 * `CONVERGE_SPAN` is how far the reveal line travels while a particle crosses from its
 * scattered origin to the path, and `CONVERGE_STAGGER` how far apart in that travel
 * different particles start. Without the stagger the whole stretch snaps into place at once.
 *
 * `CONVERGE_LEAD` starts the ramp before the particle is revealed, and is why it is larger
 * than the stagger. Without it a late starting particle is revealed at converge 0, sits
 * motionless at its scattered origin for up to a stagger's worth of scroll, and then sets
 * off, which is the "appears from nothing" the brief warns about. With the lead, every
 * particle is already moving by the time it can be seen at all, and the part of the ramp
 * that happens before reveal is spent behind the cull where nothing is drawn.
 *
 * `ORIGIN_SIZE_RATIO` is the hero field's rendered point size over the stream's, so a
 * particle starts at hero size and grows to stream size on the same factor that moves it and
 * does not pop when it lands. This is the requirement recorded in section 12: the two scenes
 * carry independent base sizes now, and the migration is where that gets paid for.
 *
 * Measured, not assumed. Blob analysis of a text free patch puts the hero field's median
 * particle at 2.3px across and the stream's at 3.2px, so the ratio is 0.72 and origins start
 * smaller. Assuming it from the two `uSize` constants instead gave 2.0, which drew a layer of
 * confetti across the hero: the hero's 6.0 is before its viewport scale and its per point
 * variance, so it renders far smaller than the number suggests.
 *
 * `ORIGIN_SHARE` is the fraction of the window's particles that start scattered at all. The
 * rest begin on the path. The parent brief's 400 to 800 recruited particles against the
 * roughly 1,125 the window holds.
 */
const HANDOFF_SPAN = 750.0
const CONVERGE_SPAN = 520.0
const CONVERGE_STAGGER = 260.0
const CONVERGE_LEAD = 300.0
const ORIGIN_SIZE_RATIO = 0.72
const ORIGIN_SHARE = 0.55

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
/** Document x of the logo row's centre, which decides which way inward is. */
uniform float uDisperseCentreX;

/*
  The box the handoff's scattered origins are drawn from: the hero's lower half, in document
  coordinates, as (left, right, top, bottom). Zero width switches the handoff off, which is
  what happens on any page with no hero.
*/
uniform vec4 uHandoffBox;

/*
  Body copy, as left, top, right, bottom in document space, with a live count. Same idea as
  the inverse band and extended from a Y range to a box.
*/
uniform vec4 uTextRects[${MAX_TEXT_RECTS}];
uniform float uTextCount;

/*
  The contact button in document pixels, and whether it is on the page at all.

  The route already ended here; nothing downstream knew where "here" was, so the trail simply
  stopped. uBurstAt is the point the last stretch is thrown outward from.
*/
uniform vec2 uBurstAt;
uniform float uBurstOn;

uniform float uSpiralRadius;
uniform float uTime;

attribute float aRandom;
/** Arc length from the start of this particle's own path, in pixels. */
attribute float aDistance;
/** Unit normal to the path here. The spiral swings along it. */
attribute vec2 aNormal;

varying float vRandom;
varying float vHead;
varying float vInverse;
/** sin(phase): where this particle is in its rotation, -1 away, +1 toward the viewer. */
varying float vDepth;
/** 0 at a handoff particle's scattered origin, 1 once it has settled onto the path. */
varying float vSettle;
/** Alpha multiplier from the body copy this particle is drawn over, 1 where there is none. */
varying float vTextDim;
varying float vBlast;

void main() {
  vRandom = aRandom;
  vSettle = 1.0;
  vTextDim = 1.0;

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

  /*
    Biased inward, so the two clouds throw toward each other and overlap across the middle
    of the logo row instead of flanking it. A particle left of the row's centre reaches
    much further right than left, and the mirror on the other side.

    Asymmetric on the horizontal component only, and as a scale rather than a rotation, so
    the outward side keeps ${(DISPERSE_OUTWARD * 100).toFixed(0)} percent of the reach.
    Without that the pair reads as two arrows aimed at each other. There is no
    discontinuity where the sign flips: the horizontal offset is zero there either way.
  */
  float inward = position.x < uDisperseCentreX ? 1.0 : -1.0;
  float swingX = cos(angle);
  float lean = swingX * inward > 0.0 ? 1.0 : ${DISPERSE_OUTWARD.toFixed(2)};
  vec2 offset = vec2(swingX * lean, sin(angle)) * uDisperseSpread * ramp;

  /*
    Displaced for drawing only. The reveal test and the head window above both read
    position.y untouched, and they have to: feeding a displaced Y into the reveal would
    let a particle that has drifted upward reveal before its neighbours, so the leading
    edge would fray and the head would smear instead of holding as a head.
  */
  /*
    The spiral trail.

    Position swings on cosine along the path normal, size and alpha on sine, ninety degrees
    apart. That quarter turn of separation is the whole effect: in phase, the two produce a
    particle that is biggest at its widest excursion, which reads as a flat wobble. Out of
    phase, it is biggest as it crosses the centre line moving toward the viewer, which is
    what a particle on a helix actually does.

    Two independent hashes off aRandom. The phase hash spreads particles around the full
    circumference, so the trail is a volume rather than one thin corkscrew. The radius hash
    decides how far out each particle rides, and is squared so the distribution crowds
    toward the core between a floor and the maximum, so the centre line is empty and the
    band around it is evenly filled. See the constants: the floor does the work, and the
    exponent is what stops it reading as a hollow tube.
  */
  float phaseHash = fract(sin(aRandom * 78.233 + 1.3) * 43758.5453);
  float phase =
    (aDistance / ${SPIRAL_WAVELENGTH.toFixed(1)}) * 6.2831853 +
    phaseHash * 6.2831853 +
    uTime * ${SPIRAL_SPIN.toFixed(3)};

  float radiusHash = fract(sin(aRandom * 45.164 + 9.7) * 24634.6345);
  float radius =
    uSpiralRadius *
    mix(${SPIRAL_RADIUS_FLOOR.toFixed(2)}, 1.0, pow(radiusHash, ${SPIRAL_RADIUS_CURVE.toFixed(2)}));

  // Stand down inside the cloud, and at the head, for the reasons at the constants.
  radius *= mix(1.0, ${SPIRAL_IN_CLOUD.toFixed(2)}, ramp);
  radius *= mix(1.0, ${SPIRAL_HEAD_DAMP.toFixed(2)}, head);

  /*
    The burst at the arrival.

    Two ramps multiplied: how far the reveal line has travelled past the button, and how near
    this particle is to the end of the route. Everything above the zone is untouched, so the
    page keeps its spine and only the arrival throws itself apart.

    The direction is a per particle angle, not the vector away from the button. Particles at
    the button sit on top of it, so that vector collapses exactly where the throw has to be
    widest.
  */
  float blast = 0.0;
  if (uBurstOn > 0.5) {
    float past = clamp((uRevealLine - uBurstAt.y) / ${BURST_RUN.toFixed(1)}, 0.0, 1.0);
    float zone = clamp(1.0 - (uBurstAt.y - position.y) / ${BURST_ZONE.toFixed(1)}, 0.0, 1.0);
    blast = past * zone * zone;
  }
  vBlast = blast;
  vec2 burst = vec2(0.0);
  if (blast > 0.0) {
    float burstAngle = fract(sin(aRandom * 269.5 + 183.3) * 43758.5453) * 6.28318530718;
    float reach = ${BURST_REACH.toFixed(1)} * blast * (0.4 + aRandom * 0.6);
    burst = vec2(cos(burstAngle), sin(burstAngle)) * reach;
  }

  float swing = cos(phase);
  vDepth = sin(phase);
  vec2 spiral = aNormal * swing * radius;

  /*
    Displaced for drawing only, and both offsets stack here. The reveal test, the head
    window and the inverse band test above all read position.y untouched, and they have to:
    feeding a displaced Y into the reveal would let a particle that has drifted upward
    reveal before its neighbours, so the leading edge would fray and the head would smear.
  */
  vec3 drawn = position + vec3(offset + spiral + burst, 0.0);

  /*
    The hero handoff.

    Nothing is handed over. The hero scene is untouched and none of its particles move: these
    are the stream's own particles, and in the first stretch below the hero they start at a
    scattered point inside the hero's lower half and travel onto the path as the reveal line
    passes. It reads as the field condensing into the thread because the origins share the
    field's box and density, not because the same particles moved. Coordinating ownership of
    particles across two scenes with different attribute counts is the implementation this
    replaces.

    The target is drawn, which already carries the dispersion and the spiral, not the bare
    path position. Converging to the path and then springing out into the trail would settle
    in two visible stages.

    Convergence begins before the particle is revealed, by CONVERGE_LEAD, which is larger than
    the stagger. So every particle is already in motion on the frame it first becomes visible,
    and it appears among the hero field's own particles rather than sitting still out in empty
    space waiting for its turn. The reveal test and this both read undisplaced Y, which is
    what lets the two be reasoned about together at all.
  */
  float handoff = uHandoffBox.y > uHandoffBox.x
    ? 1.0 - smoothstep(0.0, ${HANDOFF_SPAN.toFixed(1)}, position.y - uHandoffBox.w)
    : 0.0;

  // Only a share of the window is recruited. The rest start on the path, which keeps the
  // hero region from carrying the stream's whole first stretch on top of the field's own.
  float recruitHash = fract(sin(aRandom * 33.19 + 2.6) * 15731.7433);
  if (handoff > 0.001 && recruitHash < ${ORIGIN_SHARE.toFixed(2)}) {
    float startHash = fract(sin(aRandom * 91.37 + 5.1) * 31771.4131);
    float travelled = uRevealLine - position.y + ${CONVERGE_LEAD.toFixed(1)};
    float begin = startHash * ${CONVERGE_STAGGER.toFixed(1)};
    float converge = smoothstep(begin, begin + ${CONVERGE_SPAN.toFixed(1)}, travelled);

    float originHashX = fract(sin(aRandom * 63.71 + 11.9) * 19349.2231);
    float originHashY = fract(sin(aRandom * 21.53 + 7.3) * 27183.8171);
    vec3 origin = vec3(
      mix(uHandoffBox.x, uHandoffBox.y, originHashX),
      mix(uHandoffBox.z, uHandoffBox.w, originHashY),
      0.0
    );

    // One factor for all three, so position, size and alpha arrive together.
    float settle = mix(1.0, converge, handoff);
    drawn = mix(origin, drawn, settle);
    vSettle = settle;
  }

  /*
    Dim over body copy.

    Tested against drawn, the displaced position, and not against the undisplaced Y the
    reveal and the inverse band use. That difference is deliberate: those two ask where the
    particle's place on the route is, and this one asks where the particle actually ended up
    relative to the words, which is the only thing that matters for whether it distracts.

    Computed here rather than in the fragment shader because a point primitive has one
    vertex, so the answer is exact either way and this pays for the loop once per particle
    instead of once per fragment.

    The ramp is centred on the box edge and spans a pad either side, so a particle fades as
    it approaches copy instead of stepping down on a rectangle boundary.
  */
  float dim = 0.0;
  for (int i = 0; i < ${MAX_TEXT_RECTS}; i++) {
    if (float(i) > uTextCount - 0.5) break;
    vec4 box = uTextRects[i];
    float dx = max(box.x - drawn.x, drawn.x - box.z);
    float dy = max(box.y - drawn.y, drawn.y - box.w);
    float outside = max(dx, dy);
    dim = max(dim, 1.0 - smoothstep(-${TEXT_PAD.toFixed(1)}, ${TEXT_PAD.toFixed(1)}, outside));
  }
  // The head keeps almost all of its brightness, so the thread does not appear to stall.
  vTextDim = mix(1.0, ${TEXT_DIM.toFixed(2)}, dim * mix(1.0, ${TEXT_DIM_HEAD_KEEP.toFixed(2)}, head));

  gl_Position = projectionMatrix * modelViewMatrix * vec4(drawn, 1.0);

  /*
    Point size is in framebuffer pixels and is not affected by the object's scale,
    which is what makes the object matrix placement safe: a particle is the same size
    wherever it is on the page, and the stream sits on one plane so there is no
    perspective term to apply either.
  */
  float size = uSize * uPixelRatio * (0.72 + aRandom * 0.56);
  // Swelling toward the viewer, ninety degrees out of phase with the swing.
  // Gated on the settle factor: a particle still out at its scattered origin is not on the
  // spiral yet, so it should not be swelling as though it were.
  size *= 1.0 + ${SPIRAL_DEPTH.toFixed(2)} * vDepth * vSettle;
  // Hero size at the origin, stream size on the path, on the same factor as the position.
  size *= mix(${ORIGIN_SIZE_RATIO.toFixed(2)}, 1.0, vSettle);
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
varying float vDepth;
varying float vSettle;
varying float vTextDim;
varying float vBlast;

void main() {
  float d = length(gl_PointCoord - vec2(0.5));
  if (d > 0.5) discard;

  // The same falloff the hero field uses, so the two read as one material.
  float core = smoothstep(0.5, 0.0, d);
  core *= core;

  /*
    Rest colour is --fg-muted, not --border. The particle brief 2.4 is explicit
    about this and it is right: --border was chosen for a solid 1px hairline, and
    discrete particles at that lightness on white are invisible.

    Alpha was 50 to 70 percent, from the same section. The dimming brief takes the settled
    trail to 65 percent of that, so 32.5 to 45.5 percent, to stop it competing for attention
    the length of the page. The head is untouched: the contrast between a bright head and a
    receded trail is the point of the change, so only this line moves.
  */
  float restAlpha = 0.325 + vRandom * 0.13;

  /*
    The head gets an alpha floor of its own rather than a multiplier off the rest
    alpha, which is how the hero field handles its accent points. A multiplier makes
    the head's brightness depend on the particle's own random, so the cluster comes
    out mottled; a floor makes every particle in the head bright and keeps only a
    little variance on top.
  */
  float headAlpha = 0.86 + vRandom * 0.14;

  /*
    Alpha rides the same sine the size does, so a particle brightens as it swings toward
    the viewer. Without this the trail is a spread of uniform dots and reads as a fuzzy
    band rather than as rotation.
  */
  float alpha = core * mix(restAlpha, headAlpha, vHead) * uOpacity;
  alpha *= 1.0 + ${SPIRAL_DEPTH.toFixed(2)} * vDepth * vSettle;
  /*
    Alpha rides the settle factor too, faint at the scattered origin and full on the path.
    Position, size and alpha all on one factor is what stops a migrating particle popping,
    which is the whole reason this is interpolated rather than switched.
  */
  alpha *= mix(0.55, 1.0, vSettle);
  // Receded over body copy. Computed per particle in the vertex shader.
  alpha *= vTextDim;
  /*
    Thrown, then gone, in that order. Squaring holds the alpha up through the first half of
    the throw so the spread is seen, then drops it away quickly.
  */
  alpha *= 1.0 - vBlast * vBlast;
  if (alpha < 0.002) discard;

  /*
    Two grounds, picked by vInverse, then rest to accent across the head window.

    The head pair resolves to the same colour today: --accent-on-inverse and --accent
    are both #4c86db, because ADR 0019 found the accent reads on both grounds and gave it
    no twin. So the visible switch at a band edge is the rest colour, --fg-muted to
    --fg-inverse-muted. Both are read from tokens anyway rather than collapsed into one,
    so the day the tokens diverge this needs no shader change.
  */
  vec3 rest = mix(uColourRest, uColourRestInverse, vInverse);
  vec3 head = mix(uColourHead, uColourHeadInverse, vInverse);
  gl_FragColor = vec4(mix(rest, head, vHead), alpha);
}
`
