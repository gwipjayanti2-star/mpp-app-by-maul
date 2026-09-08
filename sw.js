const CACHE_NAME = 'mpp-apps-v1';
const ASSETS_TO_CACHE = [
  './index.html',
  './manifest.json',
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/chart.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('fetch', event => {
  // Hanya intercept GET request, jangan intercept API fetch ke Google Apps Script (POST)
  if (event.request.method !== 'GET') return;
  if (event.request.url.includes('script.google.com')) return; 

  event.respondWith(
    caches.match(event.request).then(response => {
      // Kembalikan dari cache jika ada, jika tidak, fetch dari jaringan
      return response || fetch(event.request);
    }).catch(() => {
      // Jika offline dan gagal fetch, tetap tampilkan index.html
      if (event.request.mode === 'navigate') {
        return caches.match('./index.html');
      }
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
});
