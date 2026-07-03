const CACHE = 'radio-pampa-v2';

// radios.js NO va al cache: cambia con cada rotación del túnel Cloudflare
const ALWAYS_NETWORK = ['/radios.js'];

const SHELL = [
  '/radios.html',
  '/styles.css',
  '/script.js',
  '/manifest.json'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = e.request.url;

  // Nunca cachear: socket.io, cloudflare (streaming), radios.js (URL del túnel cambia)
  if (url.includes('socket.io') || url.includes('trycloudflare') ||
      ALWAYS_NETWORK.some(p => url.endsWith(p))) {
    e.respondWith(fetch(e.request).catch(() => new Response('', { status: 503 })));
    return;
  }

  // Cache-first para el resto del shell
  e.respondWith(
    caches.match(e.request).then(cached => {
      const network = fetch(e.request).then(res => {
        if (res.ok && e.request.method === 'GET') {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      });
      return cached || network;
    })
  );
});
