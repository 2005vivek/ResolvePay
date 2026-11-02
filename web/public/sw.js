// ResolvePay PWA Offline & Background Update Service Worker
const CACHE_NAME = 'resolvepay-v2.3';

self.addEventListener('install', (event) => {
  self.skipWaiting();
  console.log('[SW] Installed & activated version:', CACHE_NAME);
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

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
