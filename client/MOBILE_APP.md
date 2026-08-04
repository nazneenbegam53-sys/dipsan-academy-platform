# Dipsan Academy — Mobile App (Play Store + App Store)

## Free “real app” install (no store fees)

Opening the website in Chrome/Safari is **not** the app — you’ll still see the browser bar.

To get a real full-screen app icon:

1. On your phone open https://dipsan-academy-platform.vercel.app/install  
2. Tap **Install to home screen** (Android) or Safari Share → **Add to Home Screen** (iPhone)  
3. **Leave the browser** and open the new **Dipsan Academy** icon  

That installed icon runs standalone (no address bar), with an app-style home and bottom tabs.

**Website ↔ app sync:** the free install and Capacitor store builds load the **live** site at
`https://dipsan-academy-platform.vercel.app`. Every Vercel deploy (subscription, exams, teacher
tools, etc.) is the same product students and teachers see in the app. Same API:
`https://dipsan-academy-platform.onrender.com/api`.

Official Play Store / App Store builds still need paid developer accounts — see below.


---

Native shells for **Dipsan Academy** are built with [Capacitor](https://capacitorjs.com/).
`capacitor.config.ts` sets `server.url` to the live Vercel site so native apps do **not** ship a
stale snapshot of the UI — they always open the current website (plus Razorpay checkout domains).

| Field | Value |
|-------|-------|
| App name | **Dipsan Academy** |
| Package / Bundle ID | `com.dipsanacademy.app` |
| Platforms | Android (Play Store) · iOS (App Store) |
| Live web URL | `https://dipsan-academy-platform.vercel.app` |

---

## Prerequisites

- Node.js 20+
- For Android: Android Studio + JDK 17 + Android SDK
- For iOS: macOS with Xcode 15+ and CocoaPods
- Apple Developer Program ($99/yr) and Google Play Console ($25 one-time)

---

## One-time setup

```bash
cd client
npm install
npm run assets:mobile          # icons + splash from dipsan-logo.png
npm run build:mobile           # production web bundle → dist/ (fallback offline assets)
npx cap add android            # once
npx cap add ios                # once (macOS)
npx cap sync
```

Open native projects:

```bash
npm run mobile:android   # opens Android Studio
npm run mobile:ios       # opens Xcode (macOS only)
```

---

## Day-to-day

**Most product changes:** deploy the client to Vercel (push/merge to `main`). The installed PWA and
Capacitor apps pick up the new UI automatically — no store resubmit required for web features.

After Capacitor config / native plugin changes:

```bash
cd client
npm run build:mobile
npx cap sync
```

Then run/build from Android Studio or Xcode.

---

## Play Store (Android)

1. In Android Studio → **Build → Generate Signed Bundle / APK** → Android App Bundle (`.aab`).
2. Create an app in [Google Play Console](https://play.google.com/console) named **Dipsan Academy**.
3. Upload the `.aab`, fill store listing:
   - Short description: *Timed mock exams for NEET, JEE & boards.*
   - Full description: see `store-assets/STORE_LISTING.md`
   - Icon: `store-assets/play-store-icon-512.png`
4. Complete content rating, privacy policy URL, and target audience (education).
5. Roll out to internal testing, then production.

`android/` uses `applicationId` / namespace `com.dipsanacademy.app`.

---

## App Store (iOS)

1. Open `ios/App/App.xcworkspace` in Xcode.
2. Signing & Capabilities → select your Team; bundle id `com.dipsanacademy.app`.
3. Set display name **Dipsan Academy**, version, and build number.
4. **Product → Archive** → Distribute to App Store Connect.
5. In App Store Connect, create the app **Dipsan Academy**, upload screenshots
   (use device frames from the running app), and submit for review.

Icon: `store-assets/app-store-icon-1024.png`.

---

## Privacy & review notes

- Auth uses email/password (JWT). State why you collect email, name, class, roll number.
- Exam anti-cheat uses focus/visibility signals in the WebView — disclose this in the privacy policy.
- Camera/mic are only needed if teachers record video solutions; declare those permissions when enabled.
- Payments use Razorpay (₹2000 full-access subscription); disclose payment data handling.
- Provide a demo teacher + student account for store reviewers.

---

## Web fallback (PWA)

The client also ships a web manifest (`public/manifest.webmanifest`) so users can
**Add to Home Screen** from Safari/Chrome while the store builds are in review.
The service worker uses network-first for app shell files so website deploys sync quickly.
