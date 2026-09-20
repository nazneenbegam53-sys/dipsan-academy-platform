# DIPSAN ACADEMY CLASSROOM

Standalone installable PWA for live classroom features (whiteboard + video/mic calls). Uses the same backend API as the main Dipsan Academy platform — no exams.

## Stack

- Vite + React 18 + TypeScript + Tailwind
- Konva / react-konva whiteboard
- socket.io-client for realtime board + WebRTC signaling
- PWA (manifest + service worker)

## Local development

```bash
cd classroom-app
npm install
cp .env.example .env   # optional; defaults to production API
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

### Environment

| Variable        | Default                                                       |
| --------------- | ------------------------------------------------------------- |
| `VITE_API_URL`  | `https://dipsan-academy-platform.onrender.com/api`            |

For a local API server:

```bash
echo 'VITE_API_URL=http://localhost:5001/api' > .env
```

Auth uses the same `/auth/login` and `/auth/register` endpoints (phone + password) and stores JWT in `localStorage` under `dipsan_token`.

## Build

```bash
npm run build
npm run preview
```

## Deploy as a separate Vercel project

1. Import the **same GitHub repo** in Vercel as a new project.
2. Set **Root Directory** to `classroom-app`.
3. Framework preset: Vite (build `npm run build`, output `dist`).
4. Env (optional if using `.env.production`):
   - `VITE_API_URL=https://dipsan-academy-platform.onrender.com/api`
5. Deploy. SPA rewrites and PWA headers are in `vercel.json`.

Link this Classroom app URL from the main platform (Landing / dashboard) so students and teachers can open or install it separately.

## Routes

| Path                         | Description              |
| ---------------------------- | ------------------------ |
| `/`                          | Brand home + install CTA |
| `/login` / `/register`       | Auth                     |
| `/classroom`                 | Create / join / boards   |
| `/classroom/board/:boardId`  | Whiteboard + CallDock    |

## PWA install

- Production builds register `public/sw.js`.
- Home shows an install banner (`beforeinstallprompt` + iOS Add to Home Screen help).
- Manifest: `public/manifest.webmanifest` — name **DIPSAN ACADEMY CLASSROOM**.
