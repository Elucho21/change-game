// Cache-first solo para los assets estaticos pesados del globo: no cambian
// entre partidas ni entre jugadores, asi que una vez que se bajaron una vez
// no hace falta pedirlos de nuevo al servidor.
const CACHE = 'change-game-assets-v1';
const ASSETS = ['/countries.geojson', '/earth-night.webp', '/earth-topology.webp'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (!ASSETS.includes(url.pathname)) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(event.request, copy));
        return res;
      });
    })
  );
});
