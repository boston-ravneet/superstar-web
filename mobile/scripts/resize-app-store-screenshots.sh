#!/usr/bin/env bash
# Resize screenshots to App Store Connect accepted sizes.
#
# iPhone (6.7" Display): 1284 × 2778 portrait
# iPad (13" Display):     2064 × 2752 portrait
#
# Usage:
#   ./scripts/resize-app-store-screenshots.sh iphone ~/Downloads/IMG_*.PNG
#   ./scripts/resize-app-store-screenshots.sh ipad   ~/Downloads/iPad_*.PNG

set -euo pipefail

MODE="${1:-iphone}"
shift || true

if [[ $# -eq 0 ]]; then
  echo "Usage: $0 iphone|ipad <screenshot.png> [more.png ...]"
  echo ""
  echo "  iphone → 1284 × 2778 (6.7\" Display)"
  echo "  ipad   → 2064 × 2752 (13\" Display)"
  exit 1
fi

case "$MODE" in
  iphone)
    TARGET_W=1284
    TARGET_H=2778
    ;;
  ipad)
    TARGET_W=2064
    TARGET_H=2752
    ;;
  *)
    echo "First argument must be 'iphone' or 'ipad'"
    exit 1
    ;;
esac

for src in "$@"; do
  if [[ ! -f "$src" ]]; then
    echo "Skip (not found): $src"
    continue
  fi

  w=$(sips -g pixelWidth "$src" 2>/dev/null | awk '/pixelWidth/{print $2}')
  h=$(sips -g pixelHeight "$src" 2>/dev/null | awk '/pixelHeight/{print $2}')

  if [[ -z "$w" || -z "$h" ]]; then
    echo "Skip (unreadable): $src"
    continue
  fi

  min_w=1000
  if [[ "$MODE" == "ipad" ]]; then
    min_w=1600
  fi

  if [[ "$w" -lt "$min_w" ]]; then
    echo "ERROR: $src is ${w}×${h} — too small. Re-capture from device Photos."
    continue
  fi

  dir=$(dirname "$src")
  base=$(basename "$src" | sed 's/\.[^.]*$//')
  ext="${src##*.}"
  out="${dir}/${base}-asc.${ext}"

  sips -z "$TARGET_H" "$TARGET_W" "$src" --out "$out" >/dev/null
  echo "OK: $(basename "$src") (${w}×${h}) → $(basename "$out") (${TARGET_W}×${TARGET_H})"
done
