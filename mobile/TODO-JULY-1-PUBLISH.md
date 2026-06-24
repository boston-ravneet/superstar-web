# Mobile client TODO — after Expo EAS credits reset (~July 1, 2026)

New **TestFlight / Play Store build required** for everything below. Web-only changes deploy without this.

Check off items as you ship them.

---

## 0. Build & ship (do first)

- [ ] Confirm EAS free tier quota reset in [expo.dev](https://expo.dev) dashboard
- [ ] Bump `ios.buildNumber` in `app.json` before production build
- [ ] Run `eas build --platform ios --profile production`
- [ ] Run `eas submit --platform ios` (or submit via App Store Connect)
- [ ] Optional: `eas build --platform android --profile production`
- [ ] Smoke-test on **physical device** (not Expo Go) against `https://getsuperstar.info`

**Env vars already in `eas.json`:** `EXPO_PUBLIC_API_URL`, Google OAuth IDs. Verify `.env` locally matches for dev.

---

## 1. Video ads — replace simulation with AdMob

**Already built (needs real SDK):**

- `app/onboarding/generating.tsx` — 3 videos on create, AI runs in parallel
- `lib/ads/use-build-creation-session.ts` — gates preview until ads + API done
- `components/ads/SimulatedVideoAd.tsx` — **replace this**

**Tasks:**

- [ ] Create AdMob app + ad units (iOS + Android): rewarded or interstitial video
- [ ] Install `react-native-google-mobile-ads` (config plugin in `app.json`)
- [ ] Add AdMob app IDs to `app.json` / `eas.json` env (`EXPO_PUBLIC_ADMOB_*`)
- [ ] Implement `AdMobVideoAdProvider` in `lib/ads/video-ad-provider.ts`
- [ ] Call `setVideoAdProvider()` on app startup (`app/_layout.tsx`)
- [ ] Remove or hide `SimulatedVideoAd` in production builds
- [ ] Test: user cannot reach preview without completing all 3 videos
- [ ] Test: AI error still shows if build fails after ads

**Edit / rebuild (same screen, fewer ads):**

- [ ] Read `mode=edit` from route params in `generating.tsx` (already passed from `build.tsx`)
- [ ] Add `EDIT_VIDEO_AD_COUNT = 2` in `lib/ads/constants.ts`
- [ ] Use 2 ads for edit, 3 for create in `use-build-creation-session.ts`

**Optional — refine from preview:**

- [ ] Route `preview.tsx` refine flow through ad gate (1 video before `refineProfileBuilder`) or a mini generating overlay

---

## 2. Push notifications — client half

**Server not built yet** (cron + token API on Cloudflare). Client tasks when both sides are ready:

- [ ] Install `expo-notifications`
- [ ] Add plugin + iOS Push capability in `app.json` / Apple Developer portal
- [ ] Request permission after **first publish** (not on cold login — better opt-in rate)
- [ ] Get Expo push token → `POST /api/push/register` (API TBD on web)
- [ ] Handle notification tap → deep link to `/dashboard` or `/onboarding/build` (edit)
- [ ] Settings toggle: “Daily stage stats & tips” (unregister token when off)
- [ ] Test on physical device; push does **not** work in Expo Go for production tokens

**Notification content (server will send, client displays):**

- Daily view count (“@bully had 5 views yesterday”)
- Nudge to edit (“Refresh your photos for more visits”)
- Weekly summary (optional)

---

## 3. Features already in JS — verify on new build

These shipped in code but **current TestFlight build may not include them**:

- [ ] **Style picker** on build screen (`preferredArchetypeId` — Field Day, Midnight Creator, etc.)
- [ ] **Design instructions** field (private styling notes for AI)
- [ ] **3-video + AI progress** generating screen (replaces old “5 minute” copy)
- [ ] **Dashboard view counts** (`totalViews`, `viewsLast7Days` on published profiles)
- [ ] **Preview analytics** line + refine + bio toggle
- [ ] **Edit stage** flow from dashboard → build → generating → preview
- [ ] **Social connect screen** still uses **mock OAuth** — replace with §4 handle fields + optional Verify

---

## 4. Social handles — simple fields + optional Verify per platform

**Product model (keep it simple):**

1. User **types handles** for each platform (Instagram, TikTok, YouTube, X, LinkedIn, website, email, etc.)
2. Handles show on their **public stage** (social section + Connect CTA)
3. Next to each handle: a **Verify** button → OAuth with that platform → if OAuth handle matches what they typed, mark **verified ✓**
4. Public profile shows a **verified tick** only on handles that passed Verify

No OAuth required to sign up or publish. Verification is optional but visible to visitors.

**Today:** Onboarding forces mock Instagram/TikTok on `oauth.tsx`. Stage only renders IG + TikTok from legacy columns. Replace this flow.

### Target data shape (`social_links_json` or migration)

```json
{
  "accounts": [
    {
      "platform": "instagram",
      "handle": "bully",
      "verified": true,
      "verifiedAt": "2026-07-01T12:00:00Z"
    },
    {
      "platform": "tiktok",
      "handle": "bully",
      "verified": false
    },
    {
      "platform": "youtube",
      "handle": "bullyvlogs",
      "verified": false
    }
  ]
}
```

Keep `instagram_handle` / `tiktok_handle` in sync for backwards compat until fully migrated.

### Phase A — Handle fields + display (no OAuth yet)

**Mobile:**

- [ ] New **Social links** section on build/edit screen (or dedicated step after bio)
- [ ] One row per platform: label + text input + empty Verify button (disabled until Phase B)
- [ ] Platforms v1: Instagram, TikTok, YouTube, X, LinkedIn, website, email, phone
- [ ] Save handles with profile via existing builder submit or new `PATCH /api/profile/social-links`
- [ ] Load saved handles when editing from dashboard
- [ ] **Remove or skip** mandatory `oauth.tsx` mock step for new users (Apple/Google login stays)

**Server + stage (web can ship before new mobile build):**

- [ ] Validate + normalize handles (strip `@`, lowercase where safe)
- [ ] Persist to `social_links_json`
- [ ] Render **all** filled handles on stage `social` section with platform icons + links
- [ ] Update `resolve-connect-actions.ts` to use saved accounts (not bio parsing only)
- [ ] Unverified handles show normally; no tick yet

### Phase B — Verify button + verified tick

**Mobile (per platform, add one at a time):**

- [ ] **Verify** button enabled when handle field is non-empty
- [ ] Tap Verify → platform OAuth (expo-auth-session) → server confirms handle match
- [ ] On success: show ✓ in app row; refresh profile state
- [ ] On mismatch: “Instagram account is @other — update your handle or connect the right account”
- [ ] Re-verify if user changes handle (clears verified flag)

**Server:**

- [ ] `POST /api/profile/social/verify/{platform}` — exchange OAuth code, read handle from provider API, compare to saved field, set `verified: true`
- [ ] Store `oauth_subject` per verified account (for re-checks, no need to keep access token long-term)
- [ ] Rate-limit verify attempts

**Stage (public page):**

- [ ] Verified tick (✓ or badge) next to handle in social section + Connect buttons
- [ ] Tooltip/accessibility: “Verified on Instagram”
- [ ] Optional: verified accounts sort first

### Phase C — Platform OAuth apps (enable Verify buttons)

Register developer apps as you turn on each Verify button:

| Platform | Verify support | Notes |
|----------|----------------|-------|
| Instagram | Meta OAuth | App review; start early |
| TikTok | Login Kit | Developer approval |
| YouTube | Google OAuth | Same GCP project as Google sign-in |
| X (Twitter) | OAuth 2.0 | Developer portal |
| LinkedIn | OAuth | Marketing API app |
| Website / email / phone | **No Verify** | Link / mailto / tel only |

### Suggested order

1. **Phase A** — fields + show on stage (ship value fast, no app review)
2. **Instagram Verify** — most important for creators
3. **TikTok Verify**
4. YouTube, X, LinkedIn Verify as needed
5. Retire mock `oauth.tsx` onboarding step

### UX copy (for App Store / in-app)

- “Add your handles — verify anytime to show a badge on your public page.”
- “Verified means you proved you own this account. Unverified handles still link out; visitors see the difference.”

---

## 5. Polish & UX (nice to have for publish)

- [ ] “Upgrade to Pro” placeholder → instant build, no ads (even if billing comes later)
- [ ] Share sheet: “Copy my link” on dashboard for published handles
- [ ] Empty state when 0 views: “Share your link to get your first visit”
- [ ] Error copy if AdMob fill fails (retry vs skip for paid tier)
- [ ] App Store screenshots showing style picker + live stage preview

---

## 6. Pre-publish QA checklist

- [ ] Sign in with Apple + Google on device build
- [ ] Add social handle fields → handles appear on live stage
- [ ] Verify Instagram (when §4B ready) → ✓ shows on public page
- [ ] Create handle → 3 photos → bio → design notes → style → generate (with ads)
- [ ] Publish → open public URL in Safari
- [ ] Edit stage → 2 ads → preview → republish
- [ ] Dashboard shows updated view counts after visiting public page
- [ ] Push notification received (after §2 complete)
- [ ] No crash when declining notification permission
- [ ] No crash when ad network unavailable (graceful message)

---

## 7. Paired server tasks (not mobile, but block push)

Do on web/Cloudflare when ready — mobile depends on these:

- [ ] `migrations/0007_push_tokens.sql`
- [ ] `POST /api/push/register` + `DELETE /api/push/register`
- [ ] Cron worker: daily digest using `profile_analytics_daily`
- [ ] `wrangler.jsonc` cron trigger (e.g. `0 14 * * *` UTC)

**Social (§4):**

- [ ] `social_links_json` accounts schema + `PATCH /api/profile/social-links`
- [ ] `POST /api/profile/social/verify/{platform}` per platform
- [ ] Stage renderer: all handles + verified tick
- [ ] Privacy policy + data deletion URLs (for Meta/TikTok Verify)

---

## Quick reference — ad + AI economics

| Event              | Video ads | ~LLM cost |
|--------------------|-----------|-----------|
| First create       | 3         | ~$0.02    |
| Edit / rebuild     | 2         | ~$0.02    |
| Profile page view  | 0         | $0        |
| Push notification  | 0         | $0        |

---

_Last updated: June 2026 — regenerate EAS build after checking off §1–§4._
