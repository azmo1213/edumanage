const CACHE_NAME = 'edumanage-v3';
const urlsToCache = [
  '/edumanage/',
  '/edumanage/index.html',
  '/edumanage/styles.css',
  '/edumanage/app.js',
  '/edumanage/db.js',
  '/edumanage/auth.js',
  '/edumanage/seed.js',
  '/edumanage/firebase-config.js',
  '/edumanage/manifest.json',
  '/edumanage/favicon.svg',
  '/edumanage/icons/icon-192.png',
  '/edumanage/icons/icon-512.png'
];

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    }).catch(error => console.error('Cache open failed:', error))
  );
});

// Activate Event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) {
          return caches.delete(key);
        }
      }));
    }).catch(error => console.error('Cache cleanup failed:', error))
  );
});

// Fetch Event
self.addEventListener('fetch', (event) => {
  const url = event.request.url;
  if (event.request.method !== 'GET') return;
  if (url.includes('favicon.ico') ||
      url.includes('ws://') ||
      url.includes('hot-update') ||
      url.includes('firebaseapp') ||
      url.includes('googleapis')) return;

  event.respondWith(
    fetch(event.request)
      .then(async (response) => {
        if (response && response.ok) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(event.request, response.clone());
        }
        return response;
      })
      .catch(() => caches.match(event.request)
        .then(cached => cached || new Response('Offline', { status: 503 }))
      )
  );
});
