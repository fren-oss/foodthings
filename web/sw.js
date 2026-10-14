/**
 * Service Worker - FoodThings PWA
 * Cache strategi: stale-while-revalidate untuk aset statis, network-first untuk API
 */

const CACHE_NAME = 'foodthings-v3';
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './sw.js',
  './css/components.css?v=39',
  './css/tokens.css',
  './css/background.css',
  './css/mascot-animations.css',
  './js/app.js?v20261015f',
  './js/config.js?v20261012k',
  './js/api.js?v20261012k',
  './js/ui.js?v20261015a',
  './js/store.js?v20261012k',
  './js/image.js?v20261012k',
  './js/thumbs.js?v20261012k',
  './js/mascot.js?v20261012k',
  './js/editItem.js?v20261015a',
  './js/export.js?v20261015a',
  './js/views/today.js?v20261015a',
  './js/views/scan.js?v20261015d',
  './js/views/history.js?v20261012k',
  './js/views/settings.js?v20261015a',
  './assets/logo/logo-192.png',
  './assets/logo/logo-512.png',
  './assets/logo/logo-maskable-512.png',
  './assets/logo/apple-touch-icon-180.png',
];

// Install: cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

// Fetch: stale-while-revalidate for static, network-first for API
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET
  if (event.request.method !== 'GET') return;

  // Skip cross-origin (Google Apps Script API)
  if (url.origin !== location.origin) {
    // Network-first for API calls
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache successful API responses briefly
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Static assets: stale-while-revalidate
  event.respondWith(
    caches.match(event.request)
      .then((cached) => {
        const fetchPromise = fetch(event.request)
          .then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
            }
            return response;
          })
          .catch(() => cached);

        return cached || fetchPromise;
      })
  );
});

// Background sync untuk analisis (optional)
self.addEventListener('sync', (event) => {
  if (event.tag === 'foodthings-analyze') {
    event.waitUntil(
      // Handle queued analysis requests
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => client.postMessage({ type: 'SYNC_ANALYZE' }));
      })
    );
  }
});