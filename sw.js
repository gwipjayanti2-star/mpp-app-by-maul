const CACHE_NAME = 'mpp-apps-v2'; // UBAH INI SETIAP KALI ADA PEMBARUAN (misal: v2, v3)
const ASSETS_TO_CACHE = [
'./index.html',
'./manifest.json',
'https://cdn.tailwindcss.com',
'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
'https://cdn.jsdelivr.net/npm/chart.js'
];

self.addEventListener('install', event => {
// Paksa service worker baru untuk segera mengambil alih (skip waiting)
self.skipWaiting();

event.waitUntil(
caches.open(CACHE_NAME).then(cache => {
console.log('Opened cache');
return cache.addAll(ASSETS_TO_CACHE);
})
);
});

self.addEventListener('fetch', event => {
// Hanya intercept GET request, jangan intercept API fetch ke Google Apps Script (POST)
if (event.request.method !== 'GET') return;
if (event.request.url.includes('script.google.com')) return;

// Network First, fallback to Cache strategy untuk index.html agar selalu up-to-date jika online
if (event.request.mode === 'navigate' || event.request.url.endsWith('index.html')) {
event.respondWith(
fetch(event.request)
.then(response => {
// Jika berhasil fetch dari network, update cache-nya
return caches.open(CACHE_NAME).then(cache => {
cache.put(event.request, response.clone());
return response;
});
})
.catch(() => {
// Jika offline, ambil dari cache
return caches.match(event.request).then(response => {
return response || caches.match('./index.html');
});
})
);
return;
}

// Cache First, fallback to Network untuk aset statis lainnya (Tailwind, FontAwesome, js, css, dll)
event.respondWith(
caches.match(event.request).then(response => {
return response || fetch(event.request).then(fetchResponse => {
// Opsional: Anda bisa menyimpan aset baru ke cache di sini jika mau
return fetchResponse;
});
}).catch(() => {
// Jika offline dan aset tidak ada di cache
if (event.request.mode === 'navigate') {
return caches.match('./index.html');
}
})
);
});

self.addEventListener('activate', event => {
// Pastikan service worker baru langsung mengontrol semua halaman yang terbuka
event.waitUntil(clients.claim());

event.waitUntil(
caches.keys().then(keys => {
return Promise.all(
keys.filter(key => key !== CACHE_NAME).map(key => {
console.log('Menghapus cache lama:', key);
return caches.delete(key);
})
);
})
);
});
