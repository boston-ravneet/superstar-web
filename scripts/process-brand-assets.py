#!/usr/bin/env python3
"""Strip near-white backgrounds from Superstar logo PNGs (no transparency from AI tools)."""

from __future__ import annotations

import os
import sys

try:
    from PIL import Image
except ImportError:
    print("Install Pillow: pip install pillow", file=sys.stderr)
    sys.exit(1)

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BRAND = os.path.join(ROOT, "public", "brand")


def color_dist(c1: tuple[int, int, int], c2: tuple[int, int, int]) -> float:
    return sum((int(a) - int(b)) ** 2 for a, b in zip(c1, c2)) ** 0.5


def remove_near_white_bg(src: str, dst: str, tolerance: float = 35) -> None:
    img = Image.open(src).convert("RGBA")
    w, h = img.size
    pixels = img.load()
    corners = [
        pixels[0, 0][:3],
        pixels[w - 1, 0][:3],
        pixels[0, h - 1][:3],
        pixels[w - 1, h - 1][:3],
    ]
    bg = tuple(sum(c[i] for c in corners) // 4 for i in range(3))

    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            if color_dist((r, g, b), bg) <= tolerance:
                pixels[x, y] = (r, g, b, 0)

    img.save(dst, "PNG")
    print(f"OK {dst} ({w}x{h})")


def export_icon(star_path: str, out_path: str, size: int) -> None:
    star = Image.open(star_path).convert("RGBA")
    star.resize((size, size), Image.Resampling.LANCZOS).save(out_path, "PNG")
    print(f"OK {out_path} ({size}px)")


def export_app_store_icon(star_path: str, out_path: str, size: int = 1024) -> None:
    """iOS/Android store icon — gold star on white, no transparency."""
    star = Image.open(star_path).convert("RGBA")
    padding_ratio = 0.12
    inner = int(size * (1 - 2 * padding_ratio))
    star_resized = star.resize((inner, inner), Image.Resampling.LANCZOS)
    canvas = Image.new("RGB", (size, size), (255, 255, 255))
    offset = ((size - inner) // 2, (size - inner) // 2)
    canvas.paste(star_resized, offset, star_resized)
    canvas.save(out_path, "PNG")
    print(f"OK {out_path} ({size}px, white bg)")


def export_favicon(star_path: str, out_path: str) -> None:
    star = Image.open(star_path).convert("RGBA")
    star.resize((32, 32), Image.Resampling.LANCZOS).save(out_path, format="ICO")
    print(f"OK {out_path} (32px)")


if __name__ == "__main__":
    assets = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "..", "assets")
    os.makedirs(BRAND, exist_ok=True)

    star_src = os.path.join(assets, "star-source.png")
    full_src = os.path.join(assets, "logo-full-source.png")

    if os.path.isfile(star_src):
        remove_near_white_bg(star_src, os.path.join(BRAND, "star.png"), tolerance=40)
    if os.path.isfile(full_src):
        remove_near_white_bg(full_src, os.path.join(BRAND, "logo-full.png"), tolerance=28)

    star = os.path.join(BRAND, "star.png")
    if os.path.isfile(star):
        export_icon(star, os.path.join(ROOT, "app", "icon.png"), 512)
        export_icon(star, os.path.join(ROOT, "app", "apple-icon.png"), 512)
        export_favicon(star, os.path.join(ROOT, "app", "favicon.ico"))
        mobile = os.path.join(ROOT, "mobile", "assets")
        os.makedirs(mobile, exist_ok=True)
        export_app_store_icon(star, os.path.join(mobile, "icon.png"), 1024)
        export_app_store_icon(star, os.path.join(mobile, "adaptive-icon.png"), 1024)
