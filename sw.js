/* Everest PWA — offline-friendly, but network-first so phones always get updates */
const CACHE_NAME = 'everest-pwa-v8';
const PRECACHE_URLS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './data.js',
  './supabase-fixed.js',
  './yasmine.js',
  './manifest.json',
  './assets/everest-logo.svg',
  './assets/everest-logo.png',
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return Promise.all(
        PRECACHE_URLS.map(function (url) {
          return cache.add(url).catch(function () {
            return null;
          });
        })
      );
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys
          .filter(function (k) {
            return k !== CACHE_NAME;
          })
          .map(function (k) {
            return caches.delete(k);
          })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function (event) {
  if (event.request.method !== 'GET') return;
  var url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  /* Network-first: when online you always see latest HTML/CSS/JS; cache is fallback offline */
  event.respondWith(
    fetch(event.request)
      .then(function (response) {
        if (response && response.status === 200 && response.type === 'basic') {
          var copy = response.clone();
          caches.open(CACHE_NAME).then(function (cache) {
            cache.put(event.request, copy);
          });
        }
        return response;
      })
      .catch(function () {
        return caches.match(event.request).then(function (cached) {
          if (cached) return cached;
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html').then(function (page) {
              return page || caches.match('/index.html') || caches.match('/');
            });
          }
          return null;
        }).then(function (fallback) {
          if (fallback) return fallback;
          return new Response('', { status: 503, statusText: 'Offline' });
        });
      })
  );
});
