"""
Asset processing for the WYRD site, Phase 0.

Reads the supplied source folder (see docs/source-inventory.md) and writes
derived assets into public/. Deterministic: re-running produces identical output.

Client logos are converted to single channel masks. Opacity per pixel is
darkness multiplied by source alpha, so dark artwork becomes ink and knocked
out white letterforms stay transparent. The mask is tinted at render time with
currentColor, which is how the row moves from --fg-muted to --fg on hover
without shipping two files per logo.

Run: python scripts/process-assets.py
"""

import json
import os
from PIL import Image

SRC = r"M:\WYRD Projects\WYRD Website\Codebase2"
CLIENT_SRC = os.path.join(SRC, "Client logos")
BRAND_SRC = os.path.join(SRC, "Company logo", "Logo_Design_Black final.png")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOGO_OUT = os.path.join(ROOT, "public", "logos")
BRAND_OUT = os.path.join(ROOT, "public", "brand")

# The canvas the icons and the OG mark sit on. Phase 4b moved this from the old
# off white value to pure white, matching --color-bg.
CANVAS = (255, 255, 255, 255)

# Canvas height for every client logo mask, 3x the 32px desktop render height.
MASK_H = 96

# name, source file, optical scale factor, survives monochroming.
#
# The optical factor scales squarer emblems down so they read at the same visual
# weight as a wide wordmark, which is optical normalisation rather than bounding
# box normalisation.
#
# `mono` is False for a mark that does not survive being reduced to one colour.
# SITEO is five colour blocks with the letters knocked out in white. On the dark
# canvas that worked. On white, the third block maps to a mean alpha of 22 out of
# 255, so the T inside it is a white letter on a near white block and stops being
# readable. Phase 4b section 8 says such a mark goes in its original form and gets
# listed in docs/BLOCKERS.md, which is what happens.
CLIENTS = [
    ("Bhavani Sarees", "Bhavani logo.png", 1.00, True),
    ("G Monisa", "G-Monisa.png", 0.94, True),
    ("Maharaja", "Maharaja_Logo.png", 0.92, True),
    ("SITEO", "SITEO LOGO.jpeg", 0.74, False),
    ("Seervi Business Expo", "Seervi EXPO - Copy.png", 1.00, True),
    ("Vahini Pipes", "Vaihini.png", 0.86, True),
]


# Gamma applied to the mask alpha. Phase 4b section 8.
#
# On the dark canvas any ink lightened the ground, so a mid tone at 30 percent alpha
# read fine. On white, 30 percent of --fg-muted is #C5C5C8 and the mark washes out.
# A gamma below 1 lifts the mid tones without touching either end, so the knockouts
# stay knockouts and the solid areas stay solid.
INK_GAMMA = 0.55


def to_ink_mask(im):
    """RGBA image to an ink mask. Alpha carries darkness times source alpha."""
    im = im.convert("RGBA")
    px = im.load()
    w, h = im.size
    out = Image.new("RGBA", (w, h), (255, 255, 255, 0))
    op = out.load()
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255.0
            ink = 1.0 - lum
            # Sharpen the tail so near white pixels drop out cleanly instead of
            # leaving a grey haze around the artwork.
            if ink < 0.08:
                ink = 0.0
            else:
                ink = ink ** INK_GAMMA
            op[x, y] = (255, 255, 255, int(round(ink * (a / 255.0) * 255)))
    return out


def trim(im, threshold=6):
    """Trim to the bounding box of pixels above an alpha threshold."""
    alpha = im.getchannel("A").point(lambda v: 255 if v > threshold else 0)
    box = alpha.getbbox()
    return im.crop(box) if box else im


def fit_to_canvas(im, factor):
    """Scale into a MASK_H tall canvas at the given optical factor, centred."""
    target_h = max(1, int(round(MASK_H * factor)))
    ratio = target_h / im.height
    target_w = max(1, int(round(im.width * ratio)))
    im = im.resize((target_w, target_h), Image.LANCZOS)
    canvas = Image.new("RGBA", (target_w, MASK_H), (255, 255, 255, 0))
    canvas.paste(im, (0, (MASK_H - target_h) // 2), im)
    return canvas


def slug(name):
    return name.lower().replace(" ", "-")


def flatten_on_canvas(im):
    """Composite onto white, for a mark that has to keep its own colours."""
    flat = Image.new("RGBA", im.size, CANVAS)
    flat.paste(im, (0, 0), im)
    return flat.convert("RGB")


def process_clients():
    os.makedirs(LOGO_OUT, exist_ok=True)
    manifest = []
    for name, filename, factor, mono in CLIENTS:
        src = os.path.join(CLIENT_SRC, filename)
        im = Image.open(src)
        mask = fit_to_canvas(trim(to_ink_mask(im)), factor)
        base = slug(name)
        mask.save(os.path.join(LOGO_OUT, base + ".webp"), "WEBP", lossless=True, quality=100)
        mask.save(os.path.join(LOGO_OUT, base + ".png"), "PNG", optimize=True)

        entry = {
            "name": name,
            "slug": base,
            "file": "/logos/" + base + ".webp",
            "width": mask.width,
            "height": mask.height,
            "source": filename,
            "mono": mono,
        }

        if not mono:
            # The original artwork, trimmed and flattened onto the canvas colour,
            # at the same optical height as every mask in the row.
            source = Image.open(src).convert("RGBA")
            trimmed = trim(to_ink_mask(source))
            box = trimmed.getbbox()
            colour = source.crop(source.getbbox() if source.mode == "RGBA" else box)
            target_h = MASK_H
            ratio = target_h / colour.height
            colour = colour.resize(
                (max(1, int(round(colour.width * ratio))), target_h), Image.LANCZOS
            )
            flat = flatten_on_canvas(colour)
            flat.save(os.path.join(LOGO_OUT, base + "-original.webp"), "WEBP", quality=92)
            entry["file"] = "/logos/" + base + "-original.webp"
            entry["width"] = flat.width
            entry["height"] = flat.height
            print("logo  %-24s %4dx%-4d  ORIGINAL, does not survive mono" % (base, flat.width, flat.height))
        else:
            print("logo  %-24s %4dx%-4d  from %s" % (base, mask.width, mask.height, filename))

        manifest.append(entry)
    with open(os.path.join(LOGO_OUT, "manifest.json"), "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)
        f.write("\n")
    return manifest


def process_brand():
    """
    Brand mark variants. The supplied mark is black on transparent, so it is
    never recoloured here. Raster variants are exported as supplied, and the
    icon set places the unmodified mark on the canvas colour, which is the
    background it was drawn for. See docs/decisions/0003.
    """
    os.makedirs(BRAND_OUT, exist_ok=True)
    im = trim(Image.open(BRAND_SRC).convert("RGBA"))
    print("brand supplied trimmed to %dx%d" % im.size)

    # Header mark and footer wordmark, 3x the largest rendered size.
    # Header renders at 24px tall, footer wordmark at 64px tall.
    for label, render_h in (("header", 24), ("footer", 64)):
        h = render_h * 3
        w = int(round(im.width * (h / im.height)))
        v = im.resize((w, h), Image.LANCZOS)
        v.save(os.path.join(BRAND_OUT, "wyrd-%s.webp" % label), "WEBP", lossless=True, quality=100)
        v.save(os.path.join(BRAND_OUT, "wyrd-%s.png" % label), "PNG", optimize=True)
        print("brand wyrd-%-8s %4dx%-4d" % (label, w, h))

    # OG mark. Transparent is wrong for OG, so it sits on the canvas colour.
    og = Image.new("RGBA", (1200, 400), CANVAS)
    m = im.copy()
    m.thumbnail((900, 280), Image.LANCZOS)
    og.paste(m, ((1200 - m.width) // 2, (400 - m.height) // 2), m)
    og.convert("RGB").save(os.path.join(BRAND_OUT, "wyrd-og-mark.png"), "PNG", optimize=True)
    print("brand wyrd-og-mark      1200x400")

    # Icon set. Unmodified mark, contained on the light ground it was drawn for.
    for size in (16, 32, 180, 512):
        icon = Image.new("RGBA", (size, size), CANVAS)
        pad = max(1, int(round(size * 0.12)))
        m = im.copy()
        m.thumbnail((size - pad * 2, size - pad * 2), Image.LANCZOS)
        icon.paste(m, ((size - m.width) // 2, (size - m.height) // 2), m)
        icon.save(os.path.join(BRAND_OUT, "icon-%d.png" % size), "PNG", optimize=True)
        print("brand icon-%-3d          %dx%d" % (size, size, size))


if __name__ == "__main__":
    process_clients()
    process_brand()
