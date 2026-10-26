// Service worker: keeps the app and the KJV on the device so reading works without signal.
// - Pages: network first, falling back to the saved copy when offline.
// - Built assets (/assets/*, hashed) and Bible books (/bible/*): saved on first use, then served
//   from the device. The page itself downloads every book in the background (src/lib/offline.js).
// - Google Fonts: served from the device, refreshed in the background.
// Everything else (Supabase sync) goes straight to the network.
const SHELL = 'app-shell-v1';
const BIBLE = 'bible-kjv-v1';
const FONTS = 'fonts-v1';
const KEEP = [SHELL, BIBLE, FONTS];

const assetsIn = (html) => [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map((m) => m[1]);

// Saves the page and the assets it references, and drops assets from older builds.
async function saveShell(response) {
  const html = await response.clone().text();
  const cache = await caches.open(SHELL);
  await cache.put('/', response);
  const current = new Set(assetsIn(html));
  await Promise.all(
    [...current].map(async (url) => {
      if (!(await cache.match(url))) await cache.add(url).catch(() => {});
    }),
  );
  for (const request of await cache.keys()) {
    const path = new URL(request.url).pathname;
    if (path.startsWith('/assets/') && !current.has(path)) await cache.delete(request);
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    fetch('/', { cache: 'no-cache' })
      .then((response) => response.ok && saveShell(response))
      .catch(() => {})
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) => Promise.all(names.filter((name) => !KEEP.includes(name)).map((name) => caches.delete(name))))
      .then(() => self.clients.claim()),
  );
});

async function cacheFirst(cacheName, request) {
  const cache = await caches.open(cacheName);
  const saved = await cache.match(request);
  if (saved) return saved;
  const response = await fetch(request);
  if (response.ok || response.type === 'opaque') cache.put(request, response.clone());
  return response;
}

async function page(request) {
  try {
    const response = await fetch(request);
    if (response.ok) saveShell(response.clone()).catch(() => {});
    return response;
  } catch {
    const saved = await caches.match('/', { cacheName: SHELL });
    if (saved) return saved;
    throw new Error('offline and no saved page');
  }
}

async function staleWhileRevalidate(cacheName, request) {
  const cache = await caches.open(cacheName);
  const saved = await cache.match(request);
  const fresh = fetch(request)
    .then((response) => {
      if (response.ok || response.type === 'opaque') cache.put(request, response.clone());
      return response;
    })
    .catch(() => saved);
  return saved || fresh;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  if (request.mode === 'navigate' && url.origin === self.location.origin) {
    event.respondWith(page(request));
  } else if (url.origin === self.location.origin && url.pathname.startsWith('/bible/')) {
    event.respondWith(cacheFirst(BIBLE, request));
  } else if (url.origin === self.location.origin && url.pathname.startsWith('/assets/')) {
    event.respondWith(cacheFirst(SHELL, request));
  } else if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(staleWhileRevalidate(FONTS, request));
  } else if (url.origin === self.location.origin) {
    // Icons, manifest: network, then the saved copy.
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(SHELL).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => caches.match(request)),
    );
  }
});
