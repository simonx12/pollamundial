self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => caches.delete(cacheName))
      );
    }).then(() => {
      self.clients.claim();
      // Unregister itself
      self.registration.unregister().then(() => {
        console.log('[ServiceWorker] Self-destructed to prevent caching issues.');
      });
    })
  );
});

// DO NOT intercept fetches to avoid breaking Supabase Auth/CORS
