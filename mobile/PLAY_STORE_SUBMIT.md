# Google Play submission — Superstar

Checklist for **Superstar** Android (`info.getsuperstar.mobile`).

## App identity

| Item | Value |
|------|--------|
| **App name** | Superstar |
| **Package name** | `info.getsuperstar.mobile` |
| **Version** | 1.0.1 |
| **Sign in** | Google Sign-In (Android); Apple hidden on Android |
| **Privacy policy** | https://getsuperstar.info/privacy |
| **Terms** | https://getsuperstar.info/terms |
| **Support / website** | https://getsuperstar.info/app |

## One-time setup

### 1. Google Play Developer account

- https://play.google.com/console — **$25 one-time** fee
- Create app → **Superstar** → default language English (US)

### 2. Google Cloud — Android Google Sign-In (native SDK)

Android uses **@react-native-google-signin/google-signin** (not browser OAuth).

**A. Android OAuth client** (`753240227728-gapm38qpu4a4hudt8kghdvtacfemld6i...`):

- Package name: `info.getsuperstar.mobile`
- **SHA-1 (required for Play installs):** Play Console → **Release → Setup → App integrity → App signing key certificate** → copy SHA-1
- **Also add** Upload key certificate SHA-1 (same page) if listed separately
- Wait **5–10 minutes** after saving in Google Cloud

`DEVELOPER_ERROR` on device = wrong or missing SHA-1. EAS upload SHA-1 alone is **not** enough for Play Store installs.

Verify with (optional, needs device + USB):

```bash
adb shell pm path info.getsuperstar.mobile
adb pull /data/app/.../base.apk ./superstar.apk
npx @react-native-google-signin/config-doctor --apk-path ./superstar.apk --package-name info.getsuperstar.mobile
```

### 3. Play Console service account (for `eas submit`)

1. Play Console → **Setup → API access** → Link Google Cloud project
2. Create service account with **Release manager** (or Admin) role
3. Download JSON key → save as `mobile/google-play-service-account.json` (**never commit**)
4. `eas.json` already points to this path

## Build & submit

### AdMob (Android) — one-time

1. [AdMob](https://admob.google.com) → **Add app** → Android → package `info.getsuperstar.mobile`
2. **Add ad unit** → **Rewarded interstitial** (same format as iOS) → name e.g. `Android build flow rewarded`
3. Copy **App ID** (`ca-app-pub-…~…`) and **Ad unit ID** (`ca-app-pub-…/…`)
4. Put them in `eas.json` under `production.env`:
   - `EXPO_PUBLIC_ADMOB_ANDROID_APP_ID`
   - `EXPO_PUBLIC_ADMOB_ANDROID_REWARDED_UNIT_ID`
5. `app-ads.txt` on https://getsuperstar.info/app-ads.txt already covers both platforms (same publisher ID)

### Local build (free — no EAS cloud credits)

Requires Android SDK + Java on your Mac:

```bash
cd mobile
npm run build:android:local    # prebuild + EAS local AAB
```

### Android Studio build (free — recommended if EAS local fails)

Use this when `gradlew` errors happen with EAS local.

**1. Generate native Android project**

```bash
cd mobile
npm run prebuild:android
```

**2. Open in Android Studio**

- **File → Open** → select `mobile/android` (not the whole repo)
- Wait for Gradle sync to finish

**3. Create a release keystore (first time only)**

- **Build → Generate Signed App Bundle / APK**
- **Android App Bundle** → Next
- **Create new…** keystore — save `.jks` file and passwords somewhere safe
- Key alias: e.g. `superstar-upload`
- Build variant: **release**

**4. Find the AAB**

After build succeeds, Android Studio shows the path. Usually:

`mobile/android/app/build/outputs/bundle/release/app-release.aab`

**5. Upload to Play Console**

- **Testing → Closed testing** → Create release → Upload `app-release.aab`

**Note:** Keep the same upload keystore for all future releases. If you already use EAS credentials, you can download the keystore via `eas credentials -p android`.

**When native deps change** (AdMob, Google Sign-In, etc.), re-run `npm run prebuild:android` before building again.

### Upload to Play Console (closed testing)

```bash
npm run submit:android         # uploads to **closed testing** (alpha track)
```

Or upload the `.aab` manually: Play Console → **Testing → Closed testing** → Create release → Upload.

First time: create a **Closed testing** track and add your email as a tester.

### Cloud build (optional, ~$1)

```bash
npm run build:android
npm run submit:android
```

## Store listing copy

| Field | Value |
|-------|--------|
| **Short description** (80 chars) | Claim your handle and publish a polished public page in minutes. |
| **Full description** | Same as iOS App Store description (see `APP_STORE_SUBMIT.md`) |
| **Category** | Social |
| **Tags** | portfolio, link in bio, profile, creator, resume |
| **Contact email** | your email |
| **Privacy policy URL** | https://getsuperstar.info/privacy |

### Review notes (if asked)

```
Sign in with Google. Reviewers use their own Google account — no demo password.

Flow: Sign in → Accept Terms → Create handle → Add bio/photos → AI builds page → Watch rewarded video ads → Preview → Publish.

AdMob rewarded interstitial videos during page build (tap Play video, watch to end). Account deletion: Dashboard → Account settings → Delete my account.

Privacy: https://getsuperstar.info/privacy
Terms: https://getsuperstar.info/terms
```

## Graphics

| Asset | Size | Notes |
|-------|------|--------|
| **App icon** | 512 × 512 | Export from `assets/icon.png` |
| **Feature graphic** | 1024 × 500 | Required — banner for store listing |
| **Phone screenshots** | 1080 × 1920 min | 2–8 images; see `play-store-screenshots/` |

Ready-made assets in `mobile/play-store-screenshots/`:

- `feature-graphic-1024x500.png`
- `icon-512.png`
- `IMG_*-play.PNG` (1080×1920 phone screenshots)

Generate phone screenshots from iPhone ASC files:

```bash
cd mobile
python3 scripts/iphone-to-play-screenshots.py ~/Downloads/Photos-3-001\ \(8\)/asc/*.PNG
```

## Data safety (Play Console)

Mirror iOS App Privacy:

| Data | Collected | Purpose |
|------|-----------|---------|
| Name, Email | Yes | Account |
| Photos | Yes | Profile |
| User IDs | Yes | Account |
| App interactions | Yes | Analytics (page views) |

- Data encrypted in transit: **Yes**
- Users can request deletion: **Yes** (privacy@getsuperstar.info)
- No data sold to third parties

## Content rating

Complete **IARC questionnaire** in Play Console:

- User-generated content: **Yes** (photos, bios)
- Moderation: **Yes** (AI + Terms)
- Ads: **Yes** (placeholder videos)
- No violence, gambling, etc.

## Pre-submit smoke test (Android device)

1. Install internal test build from Play Console
2. Google Sign-In works
3. Accept terms → create handle → build → preview → publish
4. Public URL loads in browser

---

_Last updated: June 24, 2026_
