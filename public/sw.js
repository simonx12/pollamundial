const CACHE_NAME = 'pollamundial-no-cache-v1';

self.addEventListener('install', (event) => {
  // Force the waiting service worker to become the active service worker.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Delete all caches to ensure no stale data is kept
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          console.log('[ServiceWorker] Deleting old cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      // Tell the active service worker to take control of the page immediately.
      self.clients.claim();
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Force network-only strategy to prevent ANY caching
  event.respondWith(
    fetch(event.request, { cache: 'no-store' })
      .catch(() => {
        // Fallback if network fails, but we don't return cached data
        return new Response('Network error occurred', {
          status: 408,
          headers: { 'Content-Type': 'text/plain' },
        });
      })
  );
});
