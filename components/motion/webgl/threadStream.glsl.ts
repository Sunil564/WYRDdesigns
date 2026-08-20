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
 */

export const threadVertexShader = /* glsl */ `
uniform float uPixelRatio;
uniform float uSize;

attribute float aAlong;
attribute float aGroup;
attribute float aRandom;

varying float vRandom;

void main() {
  // position is in document pixels. The object's matrix carries the scroll, the
  // page centre, and the pixels to world units scale.
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

  vRandom = aRandom;
  /*
    Point size is in framebuffer pixels and is not affected by the object's scale,
    which is what makes the object matrix placement safe: a particle is the same size
    wherever it is on the page, and the stream sits on one plane so there is no
    perspective term to apply either.
  */
  gl_PointSize = uSize * uPixelRatio * (0.72 + aRandom * 0.56);
}
`

export const threadFragmentShader = /* glsl */ `
precision mediump float;

uniform vec3 uColourRest;
uniform float uOpacity;

varying float vRandom;

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
  float alpha = core * (0.5 + vRandom * 0.2) * uOpacity;
  if (alpha < 0.002) discard;

  gl_FragColor = vec4(uColourRest, alpha);
}
`
