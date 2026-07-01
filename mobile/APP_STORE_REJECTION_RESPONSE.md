# App Store rejection response — Get Superstar v1.0 (build 6)

Submission ID: `75215e5e-95cb-405e-9be2-2f739cdb1f4d`  
Review date: June 30, 2026

Copy each section below into **App Store Connect → Resolution Center** when replying. Attach screenshots where noted.

---

## Guideline 2.1 — Third-party AI

**1. Does your app use a third-party AI service?**

Yes. Superstar uses **Google Gemini** (Google Cloud) for:

- Generating the layout and copy for a user’s public profile page from their bio, optional design notes, and uploaded photos.
- Automated moderation of uploaded profile and portfolio images before they are stored or used in generation.

We do not use AI for open-ended chat. AI runs only when the user explicitly starts “Create my page” or “Rebuild my page.”

**2. What sensitive personal data is collected and/or sent to the third-party AI service?**

When the user starts a page build, we may send:

- **Photos** the user selects (headshot and portfolio images).
- **Bio text** and optional **design instructions** they enter.
- **Social handles** they optionally provide (plain text usernames, not OAuth tokens).
- **Display name** and **public handle** for the page.

We do **not** send Apple/Google sign-in tokens, passwords, payment data, or device identifiers to Gemini.

**3. Does the app obtain explicit consent before sending data to the third-party AI service?**

Yes.

- On **Sign in**, the user must check a box agreeing to our Terms & Conditions and Privacy Policy before continuing.
- If an existing account has not accepted the current terms, the app shows a dedicated **Accept Terms** screen and blocks profile creation and AI processing until accepted.

**Screenshot for reviewers:** Attach screenshots of (1) the login screen with the terms checkbox, and (2) the Accept Terms screen if shown after sign-in.

---

## Guideline 2.1(b) — Business model

**1. Who are the users that will use paid subscriptions in the app?**

There are **no paid subscriptions** in Get Superstar. The app is **free** for all users.

**2. Do the subscriptions include digital services delivered within the app?**

No. We do not offer subscriptions or in-app purchases.

**3. Where can users purchase subscriptions accessible in the app? Which payment method?**

Users cannot purchase anything in the app. There is no payment flow, no Stripe, and no external checkout linked to app features.

**4. What previously purchased subscriptions can a user access in the app?**

None. We do not restore or honor any external subscriptions.

**5. What paid content, subscriptions, or features are unlocked without in-app purchase?**

Nothing is paid. All features (create handle, upload photos, AI page generation, publish, edit/rebuild, view analytics) are free.

During page generation, users may see **placeholder “Sponsored video” wait screens** (simulated, not real ads). These are loading/wait UI only—not monetization and not unlockable paid content.

**6. How do users obtain an account? Do users pay to create an account?**

Users sign in with **Sign in with Apple** or **Google** at no cost. No fee is required to create or use an account.

---

## Guideline 2.1(a) — Infinite spinner on “Create my page”

**What we fixed in the new build:**

- Added **request timeouts** and clearer error messages if the network or upload fails.
- Improved **multipart image upload** handling for mobile clients.
- Added **progress status** on the build screen (“Creating profile…”, “Uploading headshot…”, etc.) so users see activity instead of a silent spinner.
- Removed misleading **“Upgrade later”** copy that suggested paid tiers.

Please test the updated build on a clean install: Sign in → claim handle → add bio/photos → tap **Create my page**.

---

## Guideline 5.1.1(v) — Account deletion

**What we added:**

- **Account settings** from the dashboard → **Delete my account** with two-step confirmation.
- Deletion removes the account, all handles, published pages, uploaded media references, builder data, and analytics from our database immediately.
- Web info page: https://getsuperstar.info/account/delete

**Screen recording:** Record on a physical device:

1. Sign in (or create account)
2. Dashboard → **Account settings**
3. **Delete my account** → confirm twice
4. Return to login screen

Attach the recording in your reply.

---

## Before resubmitting — checklist

- [ ] Deploy backend changes (account DELETE API, upload fix) to production
- [ ] Run new iOS EAS production build
- [ ] Test full create-page flow on device
- [ ] Test account deletion on device
- [ ] Capture terms-consent screenshots + deletion screen recording
- [ ] Update **App Privacy** labels in App Store Connect (photos, user content, email, etc.)
- [ ] Reply in Resolution Center with text above + attachments
- [ ] Submit new build for review

---

## Build command

```bash
cd mobile
eas build --platform ios --profile production
eas submit --platform ios --profile production
```
