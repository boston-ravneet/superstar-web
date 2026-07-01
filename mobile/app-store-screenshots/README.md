# App Store screenshots — Superstar iOS

Upload in **App Store Connect → Your App → iOS App → Screenshots**.

## iPhone — exact sizes Apple accepts

App Store Connect **only** accepts these iPhone screenshot dimensions:

| Orientation | Size | Display slot in ASC |
|-------------|------|---------------------|
| Portrait | **1284 × 2778** | **6.7" Display** (use this) |
| Portrait | **1242 × 2688** | 6.5" Display |
| Landscape | 2778 × 1284 | 6.7" landscape |
| Landscape | 2688 × 1242 | 6.5" landscape |

**1290 × 2796 is NOT accepted** — that is the native capture size on some iPhones but you must resize to **1284 × 2778** before upload.

### Capture + resize workflow

1. Screenshot on iPhone (**Side + Volume up**).
2. AirDrop **originals** from Photos to Mac (each file should be ~1–3 MB, width ≥ 1200px).
3. Resize to ASC size:

```bash
cd mobile
chmod +x scripts/resize-app-store-screenshots.sh
./scripts/resize-app-store-screenshots.sh ~/Downloads/IMG_*.PNG
```

Upload the `*-asc.png` files to **6.7" Display**.

4. If resize script says "too small" (~470px wide), your file is compressed — re-Airdrop from Photos, not from chat.

### Upload order (5 frames)

| # | Screen |
|---|--------|
| 1 | Login |
| 2 | Edit stage — styles |
| 3 | Edit stage — social |
| 4 | AI building |
| 5 | Dashboard |

## iPad — 13" Display

**2064 × 2752 px** — capture on iPad via TestFlight, same 5 screens.

## Quick check on Mac

```bash
sips -g pixelWidth -g pixelHeight your-screenshot.png
```

Must show **1284 × 2778** (or 1242 × 2688) before upload.
