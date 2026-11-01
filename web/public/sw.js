// ResolvePay Minimal Offline Service Worker for PWA installability
const CACHE_NAME = 'resolvepay-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Pass-through fetch for dynamic Next.js API and pages
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
