"""Gera logo-rnm.png e logo-rnm-on-dark.png a partir de public/logocerta.png."""
from __future__ import annotations

from pathlib import Path

from PIL import Image

SRC = Path(r"d:\Jc-Solucoes 2026\RNM - Matricula\public\logocerta.png")
OUT = Path(r"d:\Jc-Solucoes 2026\RNM - Matricula\public")


def crop_by_alpha(im: Image.Image, pad: int = 20) -> Image.Image:
    im = im.convert("RGBA")
    w, h = im.size
    px = im.load()
    minx, miny, maxx, maxy = w, h, 0, 0
    found = False
    for y in range(h):
        for x in range(w):
            if px[x, y][3] > 12:
                found = True
                minx = min(minx, x)
                miny = min(miny, y)
                maxx = max(maxx, x)
                maxy = max(maxy, y)
    if not found:
        raise SystemExit("No opaque content in logocerta.png")
    minx = max(0, minx - pad)
    miny = max(0, miny - pad)
    maxx = min(w - 1, maxx + pad)
    maxy = min(h - 1, maxy + pad)
    return im.crop((minx, miny, maxx + 1, maxy + 1))


def make_on_dark(im: Image.Image) -> Image.Image:
    """Lighten charcoal greys for dark backgrounds; keep magenta + black text."""
    dark = im.copy()
    dp = dark.load()
    cw, ch = dark.size
    for y in range(ch):
        for x in range(cw):
            r, g, b, a = dp[x, y]
            if a < 10:
                continue
            if r > 140 and b > 55 and g < 90:
                continue
            if r + g + b < 45:
                continue
            mx = max(r, g, b)
            mn = min(r, g, b)
            if mx < 160 and (mx - mn) < 55:
                t = mx / 160.0
                v = int(218 + t * 32)
                dp[x, y] = (v, v, min(255, v + 3), a)
    return dark


def main() -> None:
    cropped = crop_by_alpha(Image.open(SRC))
    up = cropped.resize(
        (int(cropped.width * 1.5), int(cropped.height * 1.5)),
        Image.Resampling.LANCZOS,
    )
    print("size", up.size)
    up.save(OUT / "logo-rnm.png", "PNG", optimize=True)
    make_on_dark(up).save(OUT / "logo-rnm-on-dark.png", "PNG", optimize=True)
    print("saved logo-rnm.png + logo-rnm-on-dark.png from logocerta.png")


if __name__ == "__main__":
    main()
