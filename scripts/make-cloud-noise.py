"""
Generates the noise texture the clouds shader reads. See ADR 0031.

Vanta's CLOUDS2 fragment shader is a raymarch that builds its cloud density from
four samples of one texture, at doubling frequencies:

    # define T texture2D(iTex, fract((s*p.zw + ceil(s*p.x)) / 200.0)).y / (s += s) * 4.0

So the texture is the only thing standing between that shader and a flat sky. It
reads the green channel, wraps with fract(), and expects smooth value noise with a
mean near 0.5. White noise gives fizz rather than cloud shapes, which is why the
two grain tiles in `make-noise.py` cannot be reused here: those are alpha speckle
on a flat RGB, so their green channel is a constant and every sample would return
the same number.

Vanta ships its own `gallery/noise.png`. We generate ours instead, for the same
reason nothing else on this site is fetched from someone else's origin.

Seeded, so the texture is identical on every machine and every rebuild. Tileable
by construction: the lattice wraps, so the tile has no seam to hide.

Run: python scripts/make-cloud-noise.py
"""

import os
import random

from PIL import Image

SIZE = 256
SEED = 0x57595244  # "WYRD", the same seed as the grain tiles

# Lattice cells across the tile. 16 puts one cloud-scale feature about every 16px
# of texture, which the shader's four octaves then break up further. Higher reads
# as static, lower reads as one big blob.
BASE_CELLS = 16
# The second octave, at half amplitude. Two is enough: the shader is already
# summing four frequencies of whatever it is given.
DETAIL_CELLS = 32
DETAIL_WEIGHT = 0.5

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def lattice(cells, rng):
    """A wrapping grid of random values. Wrapping is what makes the tile seamless."""
    return [[rng.random() for _ in range(cells)] for _ in range(cells)]


def smoothstep(t):
    return t * t * (3.0 - 2.0 * t)


def sample(grid, cells, x, y):
    """Bilinear value noise, smoothstepped, with the lattice wrapping at the edges."""
    fx = x / SIZE * cells
    fy = y / SIZE * cells
    ix, iy = int(fx), int(fy)
    tx, ty = smoothstep(fx - ix), smoothstep(fy - iy)

    x0, x1 = ix % cells, (ix + 1) % cells
    y0, y1 = iy % cells, (iy + 1) % cells

    top = grid[y0][x0] * (1 - tx) + grid[y0][x1] * tx
    bottom = grid[y1][x0] * (1 - tx) + grid[y1][x1] * tx
    return top * (1 - ty) + bottom * ty


def main():
    rng = random.Random(SEED)
    base = lattice(BASE_CELLS, rng)
    detail = lattice(DETAIL_CELLS, rng)

    values = []
    for y in range(SIZE):
        row = []
        for x in range(SIZE):
            value = sample(base, BASE_CELLS, x, y)
            value += sample(detail, DETAIL_CELLS, x, y) * DETAIL_WEIGHT
            row.append(value / (1.0 + DETAIL_WEIGHT))
        values.append(row)

    # Normalise to the full 0 to 1 range. Summed octaves cluster around the middle,
    # and the shader's density threshold is calibrated against a texture that uses
    # its whole range.
    lowest = min(min(row) for row in values)
    highest = max(max(row) for row in values)
    span = highest - lowest or 1.0

    image = Image.new("RGB", (SIZE, SIZE))
    pixels = image.load()
    for y in range(SIZE):
        for x in range(SIZE):
            level = int(round((values[y][x] - lowest) / span * 255))
            # Grey, not a single channel: the shader reads .y, and a grey texture
            # means nobody has to remember which channel carries the signal.
            pixels[x, y] = (level, level, level)

    directory = os.path.join(root, "public", "textures")
    os.makedirs(directory, exist_ok=True)
    path = os.path.join(directory, "clouds-noise.png")
    image.save(path, "PNG", optimize=True)
    print("wrote %s, %d bytes, %dx%d tiling" % (path, os.path.getsize(path), SIZE, SIZE))


if __name__ == "__main__":
    main()
