# iOS App Store submission — Superstar

Final checklist for **Superstar** (`info.getsuperstar.mobile`).

## App identity (verified)

| Item | Value |
|------|--------|
| **App name (home screen)** | Superstar |
| **Bundle ID** | `info.getsuperstar.mobile` |
| **Version** | 1.0.0 |
| **Build** | Auto-incremented by EAS (`production` profile) |
| **Icon** | 1024×1024 gold star on white (`mobile/assets/icon.png`) |
| **Splash** | White background + star |
| **Theme** | Light (`userInterfaceStyle: light`) |
| **Sign in with Apple** | Yes (required alongside Google) |
| **Photo permission** | User-facing string in `app.json` |
| **Encryption** | `ITSAppUsesNonExemptEncryption: false` |
| **Privacy policy** | https://getsuperstar.info/privacy |
| **Support URL** | https://getsuperstar.info/app |
| **Apple Team ID** | NF2SAY2CK9 |

## Screenshots

See `mobile/app-store-screenshots/README.md` for upload order.

### iPhone (required)

Upload to **6.7" Display** slot. Apple **only** accepts:

- **1284 × 2778** px (portrait) ← use this
- 1242 × 2688 px (6.5" slot)
- Landscape variants: 2778 × 1284 or 2688 × 1242

Native iPhone captures are often **1290 × 2796** — resize before upload:

```bash
cd mobile && ./scripts/resize-app-store-screenshots.sh ~/path/to/IMG_*.PNG
```

Upload the `*-asc.png` files. See `mobile/app-store-screenshots/README.md`.

### iPad (required once tablet support is enabled)

**13" Display:** **2064 × 2752 px** — capture the **same 5 screens** on a physical iPad via TestFlight.

`app.json` has `supportsTablet: true` so the app runs full-screen on iPad (iPhone UI scaled up). Re-build iOS after this change before capturing iPad screenshots.

**Important:** Upload **full-resolution** originals from Photos — not compressed chat copies (~470px wide).

## Build & submit

```bash
cd mobile
npm run build:ios          # EAS production build
npm run submit:ios         # Upload to App Store Connect
```

Before submit, add **ascAppId** to `eas.json` (numeric App Store Connect app ID):

```json
"submit": {
  "production": {
    "ios": {
      "appleTeamId": "NF2SAY2CK9",
      "appleId": "ravneet.s.batra@gmail.com",
      "ascAppId": "YOUR_NUMERIC_APP_ID"
    }
  }
}
```

## App Store Connect metadata

| Field | Value |
|-------|--------|
| **Name** | Superstar |
| **Subtitle** | Your digital stage, one link |
| **Category** | Social Networking |
| **Privacy Policy URL** | https://getsuperstar.info/privacy |
| **Support URL** | https://getsuperstar.info/app |
| **Copyright** | © 2026 Superstar |
| **Age rating** | 4+ |
| **Price** | Free |

### Description

Claim your handle on getsuperstar.info and publish a polished public page in minutes. Add your bio, headshot, portfolio photos, showreel links, and social handles — AI designs a layout that fits you. One link for your résumé, bio, or portfolio.

### Keywords (suggested)

portfolio, link in bio, profile, creator, resume, personal page, stage, bio

### Review notes

```
Superstar lets users create a public profile page at getsuperstar.info/username.

Sign in: Apple Sign In and Google Sign In (reviewers can use their own Apple ID).

Flow: Sign in → Create handle → Add bio/photos/socials → AI builds page → Preview → Publish.

Sponsored videos during build/refine are placeholder ads (tap Play video to continue). AdMob integration planned for a future update.

Privacy policy: https://getsuperstar.info/privacy
```

## App Privacy (nutrition labels)

| Data type | Linked to user | Purpose |
|-----------|----------------|---------|
| Name, Email | Yes | App functionality |
| Photos | Yes | App functionality |
| User ID | Yes | App functionality |
| Product interaction | No | Analytics (page views) |

## TestFlight → Review

1. Submit build via EAS
2. Wait ~15–30 min for TestFlight processing
3. Install on a **physical iPhone** (not Expo Go)
4. Smoke-test: sign in → create/edit → build → preview → publish
5. Submit for App Store Review in App Store Connect

## After approval

- [ ] Add App Store link to https://getsuperstar.info/app
- [ ] Update homepage “Get the app” CTA

---

_Last updated: June 24, 2026_
