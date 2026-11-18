/* ==========================================================================
   sw.js — Service Worker: caché del motor Java (solo peticiones GET
   al CDN unpkg @live-codes/java-wasm). Estrategia cache-first.
   ========================================================================== */
const CACHE = 'javalearn-engine-v1';
const PREFIX = 'https://unpkg.com/@live-codes/java-wasm';

/* Instalar: activación inmediata */
self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

/* Activar: purgar caches antiguos del motor y tomar control de los clientes */
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter((key) => !key.startsWith('javalearn-engine-'))
        .map((key) => caches.delete(key))
    );
    await self.clients.claim();
  })());
});

/* Fetch: solo interceptamos GET al CDN del motor; cache-first con
   reintentado de caché si falla la red. */
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  if (!req.url.startsWith(PREFIX)) return;

  event.respondWith((async () => {
    const cached = await caches.match(req);
    if (cached) return cached;

    try {
      const res = await fetch(req);
      if (res && res.ok && res.status === 200) {
        const cache = await caches.open(CACHE);
        await cache.put(req, res.clone());
      }
      return res;
    } catch (err) {
      /* Error de red: último intento contra la caché antes de rethrow */
      const fallback = await caches.match(req);
      if (fallback) return fallback;
      throw err;
    }
  })());
});
