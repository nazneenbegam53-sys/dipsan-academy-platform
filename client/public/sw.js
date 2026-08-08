/* PWA service worker — busts old caches so website deploys (e.g. removing
 * subscription) show up in the installed app immediately.
 */
const CACHE = "dipsan-academy-v4-video-login";
const PRECACHE = [
  "/",
  "/manifest.webmanifest",
  "/dipsan-logo.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
      .catch(() => undefined)
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      // Drop every previous cache (including v1/v2 with subscription UI).
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
      const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of clients) {
        client.postMessage({ type: "DIPSAN_SW_UPDATED", cache: CACHE });
      }
    })()
  );
});

function isAppShellAsset(url) {
  const path = url.pathname;
  return (
    path.endsWith(".js") ||
    path.endsWith(".css") ||
    path.endsWith(".html") ||
    path === "/" ||
    path.endsWith("/index.html") ||
    path.startsWith("/assets/")
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Network-first for app shell so deploys sync into the installed app.
  if (request.mode === "navigate" || isAppShellAsset(url)) {
    event.respondWith(
      fetch(request, { cache: "no-store" })
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(request, copy));
          }
          return res;
        })
        .catch(() => caches.match(request).then((r) => r || caches.match("/")))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const fetched = fetch(request)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(request, copy));
          }
          return res;
        })
        .catch(() => cached);
      return fetched.then((res) => res || cached);
    })
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
