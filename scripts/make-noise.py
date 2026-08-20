"""
Generates the two grain textures. Phase 4b section 6.

Two files, because the canvas and the inverse blocks need opposite grain:

  public/noise-dark.png   dark speckles, multiplied over the light canvas
  public/noise-light.png  light speckles, screened over an inverse block

Both are seeded, so the texture is identical on every machine and every rebuild.
Both are alpha textures on a flat colour rather than grey noise: that way the
blend mode does one job in one direction and the opacity means what it says.

Values, tuned against the brief's 1.5 to 3 percent band for a light ground:

  canvas  dark speckles at 2.2 percent with multiply
  inverse light speckles at 3.0 percent with screen

Run: python scripts/make-noise.py
"""

import os
import random

from PIL import Image

SIZE = 128
SEED = 0x57595244  # "WYRD"

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def write(name, ink, spread):
    """
    One tile of speckle. `ink` is the RGB of the grain itself, `spread` scales how
    hard the distribution leans into full opacity.
    """
    rng = random.Random(SEED)
    im = Image.new("RGBA", (SIZE, SIZE))
    px = im.load()
    for y in range(SIZE):
        for x in range(SIZE):
            # A tight distribution around the middle. A wide one reads as dirt
            # rather than grain, which is the failure mode the brief warns about.
            value = rng.gauss(0.5, 0.22)
            value = max(0.0, min(1.0, value))
            px[x, y] = (ink[0], ink[1], ink[2], int(round(value * spread * 255)))

    path = os.path.join(root, "public", name)
    im.save(path, "PNG", optimize=True)
    print("wrote %s, %d bytes, %dx%d tiling" % (path, os.path.getsize(path), SIZE, SIZE))


if __name__ == "__main__":
    # Near black speckle for the white canvas. Not pure black: pure black grain on
    # white reads as dust on the screen.
    write("noise-dark.png", (10, 10, 12), 1.0)
    # Warm off white speckle for inverse blocks, matching --color-fg-inverse.
    write("noise-light.png", (247, 246, 244), 1.0)
