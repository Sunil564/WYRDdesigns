/**
 * Hero particle field shaders. Brief 7b.2A.
 *
 * All motion is in the vertex shader. There is no CPU loop over positions
 * anywhere in this build: the only per frame JavaScript is advancing one time
 * uniform and easing one cursor uniform. See ADR 0017.
 *
 * `snoise` is Ashima Arts and Stefan Gustavson's simplex noise, MIT licensed,
 * inlined rather than pulled in through glslify. The brief suggests `glsl-noise`
 * for this, which is a glslify module and would mean adding a bundler transform to
 * the build for one function. Recorded in ADR 0017.
 */

const SIMPLEX_3D = /* glsl */ `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;

  i = mod289(i);
  vec4 p = permute(permute(permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);

  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);

  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}
`

/**
 * Curl of a simplex potential field, by central differences. Curl noise is
 * divergence free, which is why the field drifts and swirls instead of drifting
 * everything the same way and emptying one side of the screen.
 */
const CURL = /* glsl */ `
vec3 snoiseVec3(vec3 p) {
  return vec3(
    snoise(p),
    snoise(vec3(p.y - 19.1, p.z + 33.4, p.x + 47.2)),
    snoise(vec3(p.z + 74.2, p.x - 124.5, p.y + 99.4))
  );
}

vec3 curlNoise(vec3 p) {
  const float e = 0.1;
  vec3 dx = vec3(e, 0.0, 0.0);
  vec3 dy = vec3(0.0, e, 0.0);
  vec3 dz = vec3(0.0, 0.0, e);

  vec3 px0 = snoiseVec3(p - dx);
  vec3 px1 = snoiseVec3(p + dx);
  vec3 py0 = snoiseVec3(p - dy);
  vec3 py1 = snoiseVec3(p + dy);
  vec3 pz0 = snoiseVec3(p - dz);
  vec3 pz1 = snoiseVec3(p + dz);

  float x = py1.z - py0.z - pz1.y + pz0.y;
  float y = pz1.x - pz0.x - px1.z + px0.z;
  float z = px1.y - px0.y - py1.x + py0.x;

  return normalize(vec3(x, y, z) / (2.0 * e));
}
`

export const heroVertexShader = /* glsl */ `
uniform float uTime;
uniform vec2 uCursor;
uniform float uCursorStrength;
uniform float uPixelRatio;
uniform float uSize;
uniform float uDrift;

attribute float aRandom;
attribute float aScale;

varying float vRandom;
varying float vAccent;

${SIMPLEX_3D}
${CURL}

void main() {
  vec3 pos = position;

  // Slow organic drift. Every particle samples the same field at its own
  // position, so neighbours move together and the field reads as one thing.
  vec3 flow = curlNoise(pos * 0.22 + vec3(0.0, 0.0, uTime * 0.045));
  pos += flow * uDrift * (0.6 + aRandom * 0.8);

  // Cursor repulsion. Displacement is along the vector away from the cursor with
  // an inverse square falloff. uCursor is already lerped at 0.08 on the CPU, so
  // the field trails the pointer and settles back on its own as the smoothed
  // cursor catches up. One uniform, no per particle state, no ping pong buffer.
  vec2 away = pos.xy - uCursor;
  float dist = length(away);
  float falloff = 1.0 / (1.0 + dist * dist * 3.2);
  pos.xy += normalize(away + vec2(0.0001)) * falloff * uCursorStrength;

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;

  vRandom = aRandom;
  // Roughly one in twelve carries the accent. Brief 7b.2A.
  vAccent = step(0.917, aRandom);

  // Perspective correct size, capped so a near particle cannot become a disc.
  float size = uSize * aScale * uPixelRatio * (1.0 + vAccent * 0.45);
  gl_PointSize = clamp(size * (3.0 / -mvPosition.z), 1.0, 9.0);
}
`

export const heroFragmentShader = /* glsl */ `
precision mediump float;

uniform vec3 uColourBorder;
uniform vec3 uColourFgMuted;
uniform vec3 uColourAccent;
uniform float uOpacity;

varying float vRandom;
varying float vAccent;

void main() {
  float d = length(gl_PointCoord - vec2(0.5));
  if (d > 0.5) discard;

  // Soft circular falloff. Squared so the core stays tight and the edge stays soft.
  float core = smoothstep(0.5, 0.0, d);
  core *= core;

  // The bloom, done in the fragment shader rather than as a postprocessing pass.
  // A wide low amplitude halo on accent points only. See ADR 0017 for why there is
  // no EffectComposer in this build.
  float halo = smoothstep(0.5, 0.08, d) * 0.26 * vAccent;

  vec3 colour = mix(uColourBorder, uColourFgMuted, smoothstep(0.2, 0.9, vRandom));
  colour = mix(colour, uColourAccent, vAccent);

  float alpha = (core * (0.45 + vRandom * 0.5) + halo) * uOpacity;
  if (alpha < 0.002) discard;

  gl_FragColor = vec4(colour, alpha);
}
`
