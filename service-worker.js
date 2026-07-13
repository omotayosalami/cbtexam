/* Ultimate CBT Exam — offline service worker
   Caches the app shell on first (online) visit so it keeps working
   with no internet connection on every visit after that. */

const CACHE_NAME = "cbt-exam-cache-v1";
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json"
];

// Cache the app shell as soon as the service worker installs.
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

// Remove old caches when a new version of the service worker takes over.
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Cache-first strategy: serve from cache instantly (works offline),
// but refresh the cache in the background when online.
self.addEventListener("fetch", (event) => {
  if(event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const networkFetch = fetch(event.request)
        .then((networkResponse) => {
          if(networkResponse && networkResponse.status === 200){
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        })
        .catch(() => cachedResponse); // offline: fall back to cache

      // Serve cached version immediately if we have one, else wait for network.
      return cachedResponse || networkFetch;
    })
  );
});
