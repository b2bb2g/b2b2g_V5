// Minimal service worker: enables PWA installability. Network-first, no cache
// (content freshness matters more than offline for a trade board).
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", () => {
  // Intentionally pass-through.
});
