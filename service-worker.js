const CACHE_NAME = 'habitquest-ledger-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './styles/themes.css',
  './styles/main.css',
  './js/app.js',
  './js/ui.js',
  './js/storage.js',
  './js/gamification.js',
  './js/charts.js',
  './assets/icon-192.png',
  './assets/icon-512.png'
];

// Install Service Worker and cache all vital assets
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Service Worker: Caching critical assets...');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate Service Worker and clean up older caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('Service Worker: Cleared old cache', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Interceptor: Serve assets from cache, fallback to network
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(e.request).then((networkResponse) => {
        // Cache dynamic assets if needed or just return
        return networkResponse;
      });
    }).catch(() => {
      // Fallback offline handler
      if (e.request.mode === 'navigate') {
        return caches.match('./index.html');
      }
    })
  );
});
