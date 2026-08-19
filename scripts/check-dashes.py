"""
Hard rule check: no long em dash and no en dash anywhere in the repo.
Also flags the horizontal bar and the minus sign, which get pasted in as dash lookalikes.

Run: python scripts/check-dashes.py
Exit code 1 on any hit.
"""

import io
import os
import sys

BANNED = {
    "\u2014": "em dash",
    "\u2013": "en dash",
    "\u2015": "horizontal bar",
    "\u2212": "minus sign",
}

SKIP_DIRS = {".git", "node_modules", ".next", "build-logs", "out", ".vercel"}
TEXT_EXT = {
    ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".css", ".scss", ".json",
    ".md", ".mdx", ".html", ".svg", ".txt", ".yml", ".yaml", ".sh", ".py",
    ".glsl", ".vert", ".frag", ".env", ".example",
}

hits = []
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
for base, dirs, files in os.walk(root):
    dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
    for name in files:
        ext = os.path.splitext(name)[1].lower()
        if ext not in TEXT_EXT and name not in (".env.example", ".gitignore", ".gitattributes"):
            continue
        path = os.path.join(base, name)
        try:
            text = io.open(path, encoding="utf-8").read()
        except (UnicodeDecodeError, OSError):
            continue
        for i, line in enumerate(text.splitlines(), 1):
            for ch, label in BANNED.items():
                if ch in line:
                    rel = os.path.relpath(path, root).replace("\\", "/")
                    hits.append("%s:%d %s" % (rel, i, label))

if hits:
    print("FAIL: %d dash violations" % len(hits))
    for h in hits:
        print("  " + h)
    sys.exit(1)
print("PASS: no em dash, en dash, horizontal bar, or minus sign in the repo")
