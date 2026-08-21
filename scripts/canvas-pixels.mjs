/**
 * What a 2D canvas actually drew. Development only.
 *
 * Two criteria in this harness named a pixel failure mode and then read an attribute:
 * "renders the 2D canvas fallback" and "falls back to the reduced tier, not a black
 * rectangle". Both checked that an element existed. A mounted canvas that paints nothing
 * satisfies both, and a canvas filled solid black satisfies both, so each would pass on
 * exactly the failure it claims to catch. See CLAUDE.md, Verification.
 *
 * A 2D canvas can be asked what it drew, which is better than a screenshot for this: the
 * canvas sits behind the hero text, so a composited patch measures the copy as much as
 * the field, and no patch of the hero is reliably text free at every width. Reading the
 * context returns the renderer's own pixels with nothing else in them.
 *
 * Alpha, not luminance, is what separates the two failure modes:
 *   painted 0, opaque 0        mounted and drawing nothing
 *   painted high, opaque high   a filled rectangle
 *   painted low, opaque 0       a sparse field of soft particles, which is the field
 *
 * Not usable on a WebGL canvas without `preserveDrawingBuffer`, which the build does not
 * set and should not. The WebGL tiers are covered by their own criteria.
 */

/**
 * @param {import('playwright').Page} page
 * @param {string} selector Host of, or itself, a 2D canvas.
 */
export function read2dCanvas(page, selector) {
  return page.evaluate((target) => {
    const host = document.querySelector(target)
    if (!host) return { canvas: false, reason: 'no element matches' }
    const canvas = host.tagName === 'CANVAS' ? host : host.querySelector('canvas')
    if (!canvas) return { canvas: false, reason: 'element holds no canvas' }
    const context = canvas.getContext('2d')
    if (!context) return { canvas: true, context: false, reason: 'not a 2D context' }

    const { data } = context.getImageData(0, 0, canvas.width, canvas.height)
    let painted = 0
    let opaque = 0
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] > 8) painted += 1
      if (data[i] > 250) opaque += 1
    }
    const pixels = data.length / 4
    return {
      canvas: true,
      context: true,
      width: canvas.width,
      height: canvas.height,
      // Per mille rather than percent: a sparse particle field lands under one percent,
      // and reporting 0.09 percent invites reading it as nothing.
      paintedPerMille: Number(((painted / pixels) * 1000).toFixed(2)),
      opaquePerMille: Number(((opaque / pixels) * 1000).toFixed(2)),
    }
  }, selector)
}

/**
 * A field is drawing if some pixels carry alpha and almost none are fully opaque.
 * Measured: the hero fallback lands at 0.9 per mille painted and 0 opaque, and the same
 * canvas after a forced context loss at 1.53 and 0. A filled rectangle would put opaque
 * in the hundreds.
 */
export function drawsAField(read) {
  return Boolean(read.context) && read.paintedPerMille > 0.2 && read.opaquePerMille < 50
}

export function canvasDetail(read) {
  if (!read.context) return read.reason ?? 'no 2D canvas'
  return (
    `${read.width}x${read.height}, ${read.paintedPerMille} per mille painted, ` +
    `${read.opaquePerMille} per mille opaque`
  )
}
