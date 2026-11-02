// ResolvePay PWA Offline & Background Update Service Worker
const CACHE_NAME = 'resolvepay-v2.2';

self.addEventListener('install', (event) => {
  // Do not automatically force activate on install so the user gets the update banner
  console.log('[SW] New version installed:', CACHE_NAME);
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Listen for SKIP_WAITING signal from app when user taps "Update Now"
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  // Pass-through fetch for dynamic Next.js API and pages
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
