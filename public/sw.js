/* Quartz Judge service worker (offline-first) for the static export.
 * The cache-name constant and the precache manifest constant below are
 * injected by scripts/build-sw.js after `next build`. Never edit the
 * generated out/sw.js directly.
 */
const CACHE_NAME = "qz-b5cd94f2b1";
const PRECACHE = ["/","/404.html","/__next.__PAGE__.txt","/__next._full.txt","/__next._tree.txt","/_next/static/chunks/363642f4-2ad6a20169b8bd6d.js","/_next/static/chunks/401-a6be201f863bad33.js","/_next/static/chunks/4bd1b696-92152b0f5947070d.js","/_next/static/chunks/500-b13bb91f5a6311b6.js","/_next/static/chunks/589-1588a5c7f335aab2.js","/_next/static/chunks/794-dbea506235e91bd2.js","/_next/static/chunks/899.5ce6b3cbad015b59.js","/_next/static/chunks/966.1775eb621d8d3e09.js","/_next/static/chunks/app/_global-error/page-c7ac3aad383218bf.js","/_next/static/chunks/app/_not-found/page-c7ac3aad383218bf.js","/_next/static/chunks/app/admin/page-b1bfa54e53c39055.js","/_next/static/chunks/app/editor/page-11f7d75202d18d48.js","/_next/static/chunks/app/layout-146a4007262c8a58.js","/_next/static/chunks/app/not-found-ef45f6a8ffa2763f.js","/_next/static/chunks/app/page-ef45f6a8ffa2763f.js","/_next/static/chunks/app/problems/page-65f82b466768d7fa.js","/_next/static/chunks/app/profile/page-c7ac3aad383218bf.js","/_next/static/chunks/framework-6860ebc283a60d07.js","/_next/static/chunks/main-0057af99d287dd7b.js","/_next/static/chunks/main-app-4c7f1fa3ca44eb04.js","/_next/static/chunks/next/dist/client/components/builtin/app-error-c7ac3aad383218bf.js","/_next/static/chunks/next/dist/client/components/builtin/forbidden-c7ac3aad383218bf.js","/_next/static/chunks/next/dist/client/components/builtin/global-error-99c96f674fd67260.js","/_next/static/chunks/next/dist/client/components/builtin/unauthorized-c7ac3aad383218bf.js","/_next/static/chunks/polyfills-42372ed130431b0a.js","/_next/static/chunks/webpack-4fdc4e5d0071ede6.js","/_next/static/css/6e80c59aa8c149a6.css","/_next/static/ivF4zCPqBgxXJYG1hPYsL/_buildManifest.js","/_next/static/ivF4zCPqBgxXJYG1hPYsL/_ssgManifest.js","/_next/static/media/0336a89fb4e7fc1d-s.p.woff2","/_not-found.html","/_not-found.txt","/_not-found/__next._full.txt","/_not-found/__next._not-found/__PAGE__.txt","/_not-found/__next._tree.txt","/admin.html","/admin.txt","/admin/__next._full.txt","/admin/__next._tree.txt","/admin/__next.admin/__PAGE__.txt","/catalog/index.json","/catalog/problems/longest-increasing-subsequence.json","/catalog/problems/max-of-list.json","/catalog/problems/median-of-two-sorted-arrays.json","/catalog/problems/merge-intervals.json","/catalog/problems/two-sum.json","/catalog/problems/valid-parentheses.json","/catalog/problems/word-ladder.json","/editor.html","/editor.txt","/editor/__next._full.txt","/editor/__next._tree.txt","/editor/__next.editor/__PAGE__.txt","/favicon.ico","/file.svg","/fonts/FiraCode-Regular.woff2","/fonts/InterVariable.woff2","/globe.svg","/icons/apple-touch-icon.png","/icons/icon-192.png","/icons/icon-512.png","/index.html","/index.txt","/manifest.json","/next.svg","/problems.html","/problems.txt","/problems/__next._full.txt","/problems/__next._tree.txt","/problems/__next.problems/__PAGE__.txt","/profile.html","/profile.txt","/profile/__next._full.txt","/profile/__next._tree.txt","/profile/__next.profile/__PAGE__.txt","/pyodide-worker.js","/pyodide/pyodide-lock.json","/pyodide/pyodide.asm.mjs","/pyodide/pyodide.asm.wasm","/pyodide/pyodide.js","/pyodide/pyodide.mjs","/pyodide/python_stdlib.zip","/vercel.svg","/window.svg"];
const SELF_ORIGIN = self.location.origin;

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      // Tolerant precache: cache each entry individually so a single stale
      // URL (e.g. a chunk hash that drifted on the host) can't fail the
      // whole install and disable offline.
      await Promise.all(
        PRECACHE.map(async (url) => {
          try {
            const res = await fetch(url);
            if (res.ok) await cache.put(url, res.clone());
            else console.warn("precache skip (not ok)", url, res.status);
          } catch (e) {
            console.warn("precache skip", url, String(e));
          }
        }),
      );
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

function normalize(url) {
  return new URL(url).origin === SELF_ORIGIN ? new URL(url) : null;
}

async function navigationHandler(request) {
  const u = normalize(request.url);
  const path = u ? u.pathname : "/";
  // Prefer the exact route file (e.g. /editor.html), then the app shell,
  // and only fall back to the landing route "/" last.
  const candidates = [];
  if (path !== "/") {
    candidates.push(path);
    if (!path.endsWith(".html")) {
      candidates.push(path.replace(/\/+$/, "") + ".html");
    }
    candidates.push("/index.html");
  }
  candidates.push("/");
  const cache = await caches.open(CACHE_NAME);
  for (const candidate of candidates) {
    const hit = await cache.match(SELF_ORIGIN + candidate);
    if (hit) return hit;
  }
  try {
    const res = await fetch(request);
    if (res.ok) cache.put(request, res.clone());
    return res;
  } catch {
    const fallback = await cache.match(SELF_ORIGIN + "/index.html");
    return fallback || new Response("Offline", { status: 503 });
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const hit = await cache.match(request.url);
  if (hit) return hit;
  try {
    const res = await fetch(request);
    if (res.ok) cache.put(request.url, res.clone());
    return res;
  } catch {
    if (hit) return hit;
    return new Response("", { status: 503 });
  }
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  if (normalize(request.url) === null) return;
  if (request.mode === "navigate") {
    event.respondWith(navigationHandler(request));
  } else {
    event.respondWith(cacheFirst(request));
  }
});