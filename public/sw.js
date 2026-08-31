// Self-destroying Service Worker: Unregisters itself and clears all browser caches
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all([
        ...keys.map((key) => caches.delete(key)),
        self.clients.claim(),
        self.registration.unregister()
      ]);
    })
  );
});
