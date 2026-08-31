/* Indexes Store PWA fallback service worker. vite-plugin-pwa replaces this with the generated worker during production builds. */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
