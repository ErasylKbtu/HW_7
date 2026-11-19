/* StudyFlow service worker (Workbox, injectManifest mode).
 * Lifecycle: install → precache the app shell · activate → delete old caches · fetch → routing below.
 * Update flow: a new worker waits until the user presses "Update" in the app (SKIP_WAITING message). */
import { clientsClaim } from 'workbox-core';
import { cleanupOutdatedCaches, createHandlerBoundToURL, matchPrecache, precacheAndRoute } from 'workbox-precaching';
import { NavigationRoute, registerRoute, setCatchHandler } from 'workbox-routing';
import { CacheFirst, NetworkFirst, NetworkOnly } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

// Bump CACHE_VERSION when the runtime cache format changes. Old studyflow-* caches are removed on activate.
const CACHE_VERSION = 'v1';
const RUNTIME_CACHES = {
  assets: `studyflow-assets-${CACHE_VERSION}`,
  api: `studyflow-api-${CACHE_VERSION}`,
};
const API_ORIGIN = 'https://jsonplaceholder.typicode.com';

// ---- install: Workbox precaches every file listed in self.__WB_MANIFEST (JS, CSS, HTML, icons, offline.html).
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches(); // removes old workbox-precache-* caches from previous builds

self.addEventListener('install', () => {
  // Intentionally NOT calling skipWaiting(): the user decides when to switch to the new version.
});

// ---- activate: drop outdated runtime caches and take control of open tabs.
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keep = new Set(Object.values(RUNTIME_CACHES));
    const names = await caches.keys();
    await Promise.all(names
      .filter((name) => name.startsWith('studyflow-') && !keep.has(name))
      .map((name) => caches.delete(name)));
  })());
});
clientsClaim();

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

// ---- fetch routing (first matching route wins).

// 1) Authentication and Google/Firebase traffic is never cached: always straight to the network.
registerRoute(({ url, request }) =>
  request.headers.has('Authorization') ||
  /(^|\.)(googleapis\.com|firebaseapp\.com|firebaseio\.com|google\.com)$/.test(url.hostname) ||
  url.pathname.includes('/__/auth/'),
new NetworkOnly());

// Adds a timestamp when saving and a marker when a response is served from the cache,
// so the UI can say "you are viewing saved data".
const cacheMarker = {
  cacheWillUpdate: async ({ response }) => {
    if (!response || response.status !== 200) return null;
    const headers = new Headers(response.headers);
    headers.set('x-sw-cached-at', new Date().toISOString());
    return new Response(await response.clone().blob(), { status: 200, statusText: response.statusText, headers });
  },
  cachedResponseWillBeUsed: async ({ cachedResponse }) => {
    if (!cachedResponse) return cachedResponse;
    const headers = new Headers(cachedResponse.headers);
    headers.set('x-sw-cache', 'hit');
    return new Response(await cachedResponse.blob(), { status: cachedResponse.status, statusText: cachedResponse.statusText, headers });
  },
};

// 2) Public API (list + details): NETWORK-FIRST with a cache fallback, limited to 50 entries / 7 days.
registerRoute(({ url, request }) =>
  request.method === 'GET' && url.origin === API_ORIGIN && url.pathname.startsWith('/posts'),
new NetworkFirst({
  cacheName: RUNTIME_CACHES.api,
  networkTimeoutSeconds: 4,
  plugins: [
    new CacheableResponsePlugin({ statuses: [200] }),
    new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 7 * 24 * 60 * 60, purgeOnQuotaError: true }),
    cacheMarker,
  ],
}));

// 3) Static assets (images, icons, fonts): CACHE-FIRST, limited to 60 entries / 30 days.
registerRoute(({ request, url }) =>
  request.method === 'GET' &&
  ['image', 'font'].includes(request.destination) &&
  (url.origin === self.location.origin || url.hostname === 'fonts.gstatic.com'),
new CacheFirst({
  cacheName: RUNTIME_CACHES.assets,
  plugins: [
    new CacheableResponsePlugin({ statuses: [0, 200] }),
    new ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 30 * 24 * 60 * 60, purgeOnQuotaError: true }),
  ],
}));

// 4) Navigations: serve the precached app shell (the app uses HashRouter, so every page is index.html).
//    If even that fails, show the precached offline page.
const shell = createHandlerBoundToURL('index.html');
registerRoute(new NavigationRoute(async (params) => {
  try { return await shell(params); }
  catch { return (await matchPrecache('offline.html')) || Response.error(); }
}, { denylist: [/\/__\//] }));

setCatchHandler(async ({ request }) => {
  if (request.mode === 'navigate') return (await matchPrecache('offline.html')) || Response.error();
  return Response.error();
});
