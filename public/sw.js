/**
 * Service Worker for Grateful Relief Loan Manager (PWA)
 * Strategy: Cache-First with Stale-While-Revalidate for app shell & static assets
 * Optimized for Nigerian field microfinance operations in low/no connectivity market zones.
 */

const CACHE_VERSION = 'grp-loan-v5';
const STATIC_CACHE = `grp-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `grp-dynamic-${CACHE_VERSION}`;
const FONT_CACHE = `grp-fonts-${CACHE_VERSION}`;

// Precache essential application shell files
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/pwa-icon.svg',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/apple-touch-icon.png',
  '/assets/aistudio/logo_ff978855.jpg'
];

// Install event: cache the core application shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch((err) => {
        console.warn('SW: Precache partial warning:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate event: clean up outdated caches immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (
            key !== STATIC_CACHE &&
            key !== DYNAMIC_CACHE &&
            key !== FONT_CACHE
          ) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event handler with smart Network-First for navigation & Stale-While-Revalidate for assets
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Only handle GET requests
  if (request.method !== 'GET') return;

  // Ignore chrome-extension or other non-http(s) schemes
  if (!url.protocol.startsWith('http')) return;

  // 1. Google Fonts: Cache-First strategy with long-term retention
  if (url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com') {
    event.respondWith(
      caches.open(FONT_CACHE).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            // Update in background
            fetch(request).then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                cache.put(request, networkResponse.clone());
              }
            }).catch(() => {});
            return cachedResponse;
          }
          return fetch(request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          });
        });
      })
    );
    return;
  }

  // 2. Navigation requests (App Shell): Network-First with instant offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const resClone = networkResponse.clone();
            caches.open(STATIC_CACHE).then((c) => c.put(request, resClone));
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(request).then((cachedNav) => {
            return cachedNav || caches.match('/index.html') || caches.match('/');
          });
        })
    );
    return;
  }
  // 3. Static assets, scripts, styles, images: Cache-First with Stale-While-Revalidate
  const isStaticAsset = 
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.jpeg') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.woff') ||
    url.pathname.endsWith('.ico') ||
    url.pathname.startsWith('/assets/');

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchPromise = fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, clone);
            });
          }
          return networkResponse;
        }).catch(() => {
          // Network failed, nothing to revalidate
        });

        // Return cached immediately if present, otherwise await fetch
        return cached || fetchPromise;
      })
    );
    return;
  }

  // 4. Default handler for all other GET requests: Cache with Network Fallback & dynamic caching
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const clone = networkResponse.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, clone);
          });
        }
        return networkResponse;
      }).catch((err) => {
        // Return null or handle offline fallback
        return cachedResponse;
      });
    })
  );
});

// Handle incoming messages from the client (e.g. skip waiting or cache stats)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
