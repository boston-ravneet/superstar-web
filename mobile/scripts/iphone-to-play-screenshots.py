#!/usr/bin/env python3
"""Letterbox iPhone ASC screenshots onto Google Play phone canvas (1080×1920).

Usage:
  python3 scripts/iphone-to-play-screenshots.py ~/Downloads/asc/*.PNG
"""

from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image

TARGET_W, TARGET_H = 1080, 1920
BG = (255, 255, 255)


def letterbox_to_play(src: Path, out: Path) -> None:
    img = Image.open(src).convert("RGB")
    w, h = img.size
    scale = min(TARGET_W / w, TARGET_H / h)
    nw, nh = int(w * scale), int(h * scale)
    resized = img.resize((nw, nh), Image.LANCZOS)
    canvas = Image.new("RGB", (TARGET_W, TARGET_H), BG)
    canvas.paste(resized, ((TARGET_W - nw) // 2, (TARGET_H - nh) // 2))
    out.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(out, "PNG", optimize=True)
    print(f"OK: {src.name} → {out.name} ({TARGET_W}×{TARGET_H})")


def main() -> None:
    if len(sys.argv) < 2:
        print("Usage: python3 iphone-to-play-screenshots.py <iphone-asc.png> ...")
        sys.exit(1)

    for arg in sys.argv[1:]:
        src = Path(arg).expanduser()
        if not src.is_file():
            print(f"Skip (not found): {src}")
            continue
        out = src.parent / "play" / src.name.replace("-asc", "-play")
        letterbox_to_play(src, out)


if __name__ == "__main__":
    main()
