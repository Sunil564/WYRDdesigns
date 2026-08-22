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

import io
import json
import os
from PIL import Image

SRC = r"M:\WYRD Projects\WYRD Website\Codebase2"
CLIENT_SRC = os.path.join(SRC, "Client logos")
BRAND_SRC = os.path.join(SRC, "Company logo", "Logo_Design_Black final.png")
BRAND_SRC_WHITE = os.path.join(SRC, "Company logo", "Logo_Design_White.png")
WORK_SRC = os.path.join(SRC, "Website images")

# Generated project imagery, numbered by WYRD-IMAGE-PROMPTS.md. Project number to the
# slug in content/projects.ts, and slot number to what the slot is.
WORK_PROJECTS = {
    "1": "ecommerce-garments",
    "2": "brand-film-manufacturing",
    "3": "exhibition-hospitality",
}
WORK_SLOTS = {
    "1": "card-large",
    "2": "card-small",
    "3": "hero-desktop",
    "4": "hero-mobile",
    "5": "block-bleed",
    "6": "block-inset-1",
    "7": "block-inset-2",
}

# Each output must come in under this, per the image brief.
WORK_MAX_BYTES = 400 * 1024

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOGO_OUT = os.path.join(ROOT, "public", "logos")
BRAND_OUT = os.path.join(ROOT, "public", "brand")
WORK_OUT = os.path.join(ROOT, "public", "work")

# The canvas the icons and the OG mark sit on. Phase 4b moved this from the old
# off white value to pure white, matching --color-bg.
CANVAS = (255, 255, 255, 255)

# Canvas height for every client logo, 3x the 32px desktop render height.
MASK_H = 96

# name, source file, optical scale factor.
#
# The optical factor scales squarer emblems down so they read at the same visual
# weight as a wide wordmark, which is optical normalisation rather than bounding
# box normalisation.
#
# Every mark ships in its own colours. There was a fourth column here saying whether
# a mark survived being reduced to one ink, because five were rendered as alpha masks
# and SITEO was not. That treatment is gone: the row shows six client logos as their
# owners drew them. See ADR 0027.
CLIENTS = [
    ("Bhavani Sarees", "Bhavani logo.png", 1.00),
    ("G Monisa", "G-Monisa.png", 0.94),
    ("Maharaja", "Maharaja_Logo.png", 0.92),
    ("SITEO", "SITEO LOGO.jpeg", 0.74),
    ("Seervi Business Expo", "Seervi EXPO - Copy.png", 1.00),
    ("Vahini Pipes", "Vaihini.png", 0.86),
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
    """
    Every client mark, in its own colours, at one optical height.

    The ink mask branch is gone. `to_ink_mask` is still used, but only to find the
    artwork's true bounding box: it is the reliable way to trim a mark whose file has
    a white background rather than transparency, which several of these do.
    """
    os.makedirs(LOGO_OUT, exist_ok=True)
    manifest = []
    for name, filename, factor in CLIENTS:
        src = os.path.join(CLIENT_SRC, filename)
        source = Image.open(src).convert("RGBA")
        base = slug(name)

        # Trim on ink, then crop the colour artwork to that same box.
        box = trim(to_ink_mask(source)).getbbox()
        full = to_ink_mask(source).getbbox()
        colour = source.crop(full) if full else source

        target_h = max(1, int(round(MASK_H * factor)))
        ratio = target_h / colour.height
        colour = colour.resize(
            (max(1, int(round(colour.width * ratio))), target_h), Image.LANCZOS
        )
        flat = flatten_on_canvas(colour)
        flat.save(os.path.join(LOGO_OUT, base + ".webp"), "WEBP", quality=92)

        manifest.append({
            "name": name,
            "slug": base,
            "file": "/logos/" + base + ".webp",
            "width": flat.width,
            "height": flat.height,
            "source": filename,
        })
        print("logo  %-24s %4dx%-4d  original colours, from %s" % (base, flat.width, flat.height, filename))
    with open(os.path.join(LOGO_OUT, "manifest.json"), "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)
        f.write("\n")
    return manifest


def encode_under(im, path, fmt, ceiling):
    """
    Save at the highest quality that fits under `ceiling` bytes.

    Steps down rather than guessing one number, because these frames differ enormously in
    how they compress: fine film grain over a dark field is far more expensive than a flat
    studio background, and a single quality that is safe for the worst of them wastes
    quality on the rest.
    """
    for quality in (92, 88, 84, 80, 76, 72, 68, 64, 60):
        buffer = io.BytesIO()
        if fmt == "WEBP":
            im.save(buffer, "WEBP", quality=quality, method=6)
        else:
            im.save(buffer, "JPEG", quality=quality, optimize=True, progressive=True)
        if buffer.tell() <= ceiling:
            with open(path, "wb") as handle:
                handle.write(buffer.getvalue())
            return quality, buffer.tell()
    with open(path, "wb") as handle:
        handle.write(buffer.getvalue())
    return quality, buffer.tell()


def process_work():
    """
    Project imagery, at the source's own resolution.

    Nothing is upscaled, cropped, recoloured or adjusted. The files arrived smaller than the
    prompt document asked for and the slots were moved to the images' ratios rather than the
    images cut to the slots', so every frame here is the generated composition entire. What
    that costs on a 2x desktop display is recorded in docs/image-inventory.md.
    """
    os.makedirs(WORK_OUT, exist_ok=True)
    manifest = []
    for name in sorted(os.listdir(WORK_SRC)):
        if not name.lower().endswith(".png"):
            continue
        project_key, slot_key = name[:-4].split(".")
        slug = WORK_PROJECTS[project_key]
        slot = WORK_SLOTS[slot_key]
        im = Image.open(os.path.join(WORK_SRC, name)).convert("RGB")
        base = "%s-%s" % (slug, slot)

        webp_q, webp_bytes = encode_under(im, os.path.join(WORK_OUT, base + ".webp"), "WEBP", WORK_MAX_BYTES)
        jpg_q, jpg_bytes = encode_under(im, os.path.join(WORK_OUT, base + ".jpg"), "JPEG", WORK_MAX_BYTES)

        manifest.append({
            "project": slug,
            "slot": slot,
            "webp": "/work/" + base + ".webp",
            "jpg": "/work/" + base + ".jpg",
            "width": im.width,
            "height": im.height,
            "ratio": round(im.width / im.height, 4),
            "source": name,
        })
        print("work  %-42s %4dx%-4d  webp q%d %3dkb  jpg q%d %3dkb"
              % (base, im.width, im.height, webp_q, webp_bytes // 1024, jpg_q, jpg_bytes // 1024))

    with open(os.path.join(WORK_OUT, "manifest.json"), "w", encoding="utf-8") as handle:
        json.dump(manifest, handle, indent=2)
        handle.write(chr(10))


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

    # 3x the largest rendered size, per section 0.3.
    #
    # The header renders the mark at 40px tall on desktop and 32px on mobile, so 120px is 3x
    # the largest. 40 was chosen by looking: at 32px the word "Designs" inside the lockup is
    # cramped, at 40px it reads, and the mark is 85px wide there, which sits inside an 80px
    # header bar with room either side.
    #
    for label, render_h in (("header", 40),):
        h = render_h * 3
        w = int(round(im.width * (h / im.height)))
        v = im.resize((w, h), Image.LANCZOS)
        v.save(os.path.join(BRAND_OUT, "wyrd-%s.webp" % label), "WEBP", lossless=True, quality=100)
        v.save(os.path.join(BRAND_OUT, "wyrd-%s.png" % label), "PNG", optimize=True)
        print("brand wyrd-%-8s %4dx%-4d" % (label, w, h))

    # The white variant, for the inverse blocks. Supplied 2026-08-21, and it is the same
    # artwork rather than a recolour of ours: same 2101 by 989 trim, same 2.124 aspect, with
    # the Y carrying a grey gradient where the black one carries a dark one. Rendered at the
    # same 40px as the header mark so the two grounds show one identity at one size.
    white = trim(Image.open(BRAND_SRC_WHITE).convert("RGBA"))
    print("brand white supplied trimmed to %dx%d" % white.size)
    h = 40 * 3
    w = int(round(white.width * (h / white.height)))
    v = white.resize((w, h), Image.LANCZOS)
    v.save(os.path.join(BRAND_OUT, "wyrd-inverse.webp"), "WEBP", lossless=True, quality=100)
    v.save(os.path.join(BRAND_OUT, "wyrd-inverse.png"), "PNG", optimize=True)
    print("brand wyrd-inverse      %4dx%-4d" % (w, h))

    # The footer's closing watermark, at the source's own resolution so it is only ever
    # downscaled. This one is large on the page, so unlike every other export it is not cut
    # to 3x of a known render size: 2101px is simply all there is. See ADR 0026.
    white.save(os.path.join(BRAND_OUT, "wyrd-watermark.webp"), "WEBP", lossless=True, quality=100)
    print("brand wyrd-watermark    %4dx%-4d" % white.size)

    # No separate mask file. The sheen that sweeps across this mark is clipped with
    # mask-image, and a CSS mask reads the alpha channel, which this file already carries.
    # One request, already in cache by the time the sheen paints.

    # OG card. 1200 by 630, which is the 1.91:1 every card reader crops to. This was
    # 1200 by 400 and unreferenced by anything: at 3:1 it letterboxes badly in a feed.
    # Transparent is wrong for OG, so the mark sits on the canvas colour it was drawn for.
    og = Image.new("RGBA", (1200, 630), CANVAS)
    m = im.copy()
    m.thumbnail((820, 390), Image.LANCZOS)
    og.paste(m, ((1200 - m.width) // 2, (630 - m.height) // 2), m)
    og.convert("RGB").save(os.path.join(BRAND_OUT, "wyrd-og.png"), "PNG", optimize=True)
    print("brand wyrd-og           1200x630")

    # Icon set. Unmodified mark, contained on the light ground it was drawn for.
    for size in (16, 32, 180, 192, 512):
        icon = Image.new("RGBA", (size, size), CANVAS)
        pad = max(1, int(round(size * 0.12)))
        m = im.copy()
        m.thumbnail((size - pad * 2, size - pad * 2), Image.LANCZOS)
        icon.paste(m, ((size - m.width) // 2, (size - m.height) // 2), m)
        icon.save(os.path.join(BRAND_OUT, "icon-%d.png" % size), "PNG", optimize=True)
        print("brand icon-%-3d          %dx%d" % (size, size, size))


if __name__ == "__main__":
    process_clients()
    process_work()
    process_brand()
