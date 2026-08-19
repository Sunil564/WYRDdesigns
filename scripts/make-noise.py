"""
Generates public/noise.png, the single tiling grain texture from brief 4.4.

Seeded, so the texture is identical on every machine and every rebuild. Neutral
grey with per pixel luminance jitter, tiled at 128px and composited at 4 percent
with soft-light, which is what keeps the dark canvas from reading as flat.

Run: python scripts/make-noise.py
"""

import os
import random
from PIL import Image

SIZE = 128
SEED = 0x57595244  # "WYRD"

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
out = os.path.join(root, "public", "noise.png")

rng = random.Random(SEED)
im = Image.new("L", (SIZE, SIZE))
px = im.load()
for y in range(SIZE):
    for x in range(SIZE):
        # Tight distribution around mid grey. Soft-light needs values either side
        # of 128 to lift and drop, a wide spread reads as dirt rather than grain.
        px[x, y] = max(0, min(255, int(rng.gauss(128, 26))))

im.convert("RGB").save(out, "PNG", optimize=True)
print("wrote %s, %d bytes, %dx%d tiling" % (out, os.path.getsize(out), SIZE, SIZE))
