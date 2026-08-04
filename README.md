# Dipsan Academy — Online Examination Platform

A full-stack mock exam platform for NEET/JEE (and general school exams): teachers
create exams with image-based questions, students take timed CBT-style tests,
and results + detailed solutions are generated automatically.

This codebase follows the stack from the spec doc:
**React + TypeScript + Tailwind (client) · Node/Express (server) · MongoDB/Mongoose ·
JWT auth · Cloudinary (optional) file storage · Chart.js (analytics) · jsPDF (scorecard export).**

> ⚠️ **Important — read this first.** This was generated in an environment with no
> network access, so none of it has been run, `npm install`ed, or connected to a
> real database. Treat it as a solid, working-architecture starting point that
> you'll need to install, configure, and test — not a verified, running app.
> Expect to fix small bugs during first setup (mistyped imports, a missing
> field, etc.) — that's normal for a codebase this size generated in one pass.

## What's fully implemented

- Auth (register/login, JWT, student + teacher roles)
- **Student subscription (₹2000 INR via Razorpay)** — one-time payment unlocks all
  mock tests and detailed solutions (text / image / video)
- Exam CRUD (title, subject, duration, marking scheme, instructions, publish/unpublish)
- Question editor: text, **image upload (shown above the options)**, 4 options,
  correct answer, marks, negative marks, chapter/topic/difficulty, explanation
- Image upload via Cloudinary if configured, else **MongoDB GridFS** (durable;
  survives Render restarts — local disk is no longer used for new uploads)
- Student flow: browse published exams → instructions → timed attempt with
  question palette (answered/not answered/marked for review/current), clear
  response, mark for review, autosave-on-change, submit anytime, auto-submit on
  timeout
- Basic anti-cheat: tab/window blur detection + fullscreen-exit detection,
  logged as violations with timestamp and count, configurable auto-submit
  threshold per exam
- Auto-grading (correct/wrong/unattempted, negative marking) on submit
- Results page + detailed solutions (your answer vs correct answer + explanation)
- Scorecard download as PDF (client-side, jsPDF)
- Teacher dashboard: exam list, per-exam results table, violation report,
  basic analytics (average/highest/lowest score, question-wise accuracy)

## What's scaffolded but NOT implemented (clearly marked `TODO` in code)

- PDF/ZIP bulk question-bank upload and parsing
- CSV/Excel export of reports (endpoint stub returns JSON only)
- Email/SMS notifications (stub function, logs to console)
- Certificates (participation/merit/topper)
- All "Future AI Features" (weak-topic detection, AI question/solution generation, study plans)
- Rank calculation across students (needs a defined cohort/batch concept — left as TODO)

These are stubbed with clear comments so you (or I, in a follow-up) can build
them out incrementally without restructuring what's already there.

## Mobile app

**Free (recommended first):** share the live site — users install from the browser
with no store fees: https://dipsan-academy-platform.vercel.app/install

The installed app and Capacitor store shells load that **same live website**, so
exams, subscriptions, and teacher tools stay in sync whenever you deploy to Vercel.

**Play Store / App Store (paid accounts):** the React client is also packaged with
Capacitor as a native **Dipsan Academy** app. See
**[client/MOBILE_APP.md](client/MOBILE_APP.md)** for build steps and listing copy.
```
cd client
npm install
npm run mobile:sync    # build + sync into android/ and ios/
```

## Getting it running

### 1. MongoDB
Easiest path: create a free cluster at mongodb.com/atlas, get the connection string.

### 2. Server
```
cd server
cp .env.example .env      # fill in MONGODB_URI, JWT_SECRET, and Cloudinary keys if you have them
# For paid student access, also set Razorpay keys:
#   RAZORPAY_KEY_ID=rzp_test_...
#   RAZORPAY_KEY_SECRET=...
npm install
npm run dev                # starts on http://localhost:5000
```

### Student subscription (Razorpay)
Students must pay **₹2000 INR** (one-time) before they can start mock tests or open
solutions. Create test/live keys at [Razorpay Dashboard → API Keys](https://dashboard.razorpay.com/app/keys)
and set `RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET` on the server. Checkout lives at
`/subscribe` in the client.
### 3. Client
```
cd client
cp .env.example .env      # set VITE_API_URL=http://localhost:5000/api
npm install
npm run dev                # starts on http://localhost:5173
```

### 4. First use
1. Open the client, register a **teacher** account (there's a role toggle on the register page).
2. Log in, create an exam, add a few questions (try uploading an image on one).
3. Publish the exam.
4. Register/log in as a **student** in another browser (or incognito), take the exam.
5. Back in the teacher dashboard, open the exam's results.

## Deployment suggestions (not set up for you, just pointers)
- Server → Render, Railway, or Fly.io (needs `MONGODB_URI`, `JWT_SECRET`, Cloudinary keys,
  and `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` for student subscriptions as env vars)
- Client → Vercel or Netlify (needs `VITE_API_URL` pointed at your deployed server)
- Database → MongoDB Atlas free tier
- Images → Cloudinary free tier (optional) or MongoDB GridFS by default — both
  persist across Render restarts. Do not rely on `server/uploads` in production.
- Payments → Razorpay (₹2000 one-time full access). Use test keys until go-live.
## Honest limitations of browser-based anti-cheating
No website can fully stop someone switching apps or screens — this implements
the strongest standard-browser measures (fullscreen request, tab/blur
detection, warnings, configurable auto-submit) as the spec requests, and notes
where a dedicated secure-browser product would be a stronger next step.
