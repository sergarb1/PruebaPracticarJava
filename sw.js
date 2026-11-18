/* ==========================================================================
   sw.js — Service Worker PWA:
   - Motor Java (CDN unpkg @live-codes/java-wasm): cache-first, como siempre.
   - Shell de la app (mismo origen): precache en install + stale-while-
     revalidate en fetch, para funcionar offline desde la 1ª visita y
     actualizarse en segundo plano sin quedarse anticuado.
   ========================================================================== */
const ENGINE_CACHE = 'javalearn-engine-v1';
const SHELL_CACHE = 'javalearn-shell-v1';
const CDN_CACHE = 'javalearn-cdn-v1';
const ENGINE_PREFIX = 'https://unpkg.com/@live-codes/java-wasm';

/* Shell mínimo para arrancar offline (sin tools/ ni legacy/). */
const SHELL_ASSETS = [
  './',
  './index.html',
  './css/theme.css',
  './manifest.webmanifest',
  './data/i18n-dict.js',
  './data/topics.js',
  './data/editor-methods.js',
  './data/activities.js',
  './data/java-support.js',
  './js/app.js',
  './js/i18n.js',
  './js/state.js',
  './js/utils.js',
  './js/blocks.js',
  './js/parsons.js',
  './js/editor.js',
  './js/home.js',
  './js/runner/java-engine.js',
  './js/runner/blocks-runner.js',
  './js/runner/junit-runner.js',
  './js/runner/parsons-compile.js',
  './js/runner/legacy-fallback.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png'
];

/* Instalar: precachear el shell y activación inmediata */
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL_CACHE);
    await Promise.allSettled(
      SHELL_ASSETS.map(async (url) => {
        const res = await fetch(url, { cache: 'reload' });
        if (res && res.ok && res.status === 200) await cache.put(url, res.clone());
      })
    );
    await self.skipWaiting();
  })());
});

/* Activar: purgar versiones antiguas de NUESTRAS cachés y tomar control */
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keep = new Set([ENGINE_CACHE, SHELL_CACHE, CDN_CACHE]);
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter((key) => key.startsWith('javalearn-') && !keep.has(key))
        .map((key) => caches.delete(key))
    );
    await self.clients.claim();
  })());
});

/* ¿Es una petición GET del propio origen? */
function isSameOriginGet(req) {
  if (req.method !== 'GET') return false;
  try {
    return new URL(req.url).origin === self.location.origin;
  } catch (e) {
    return false;
  }
}

self.addEventListener('fetch', (event) => {
  const req = event.request;

  /* 1) Motor en el CDN: cache-first con red como respaldo */
  if (req.method === 'GET' && req.url.startsWith(ENGINE_PREFIX)) {
    event.respondWith((async () => {
      const cached = await caches.match(req);
      if (cached) return cached;

      try {
        const res = await fetch(req);
        if (res && res.ok && res.status === 200) {
          const cache = await caches.open(ENGINE_CACHE);
          await cache.put(req, res.clone());
        }
        return res;
      } catch (err) {
        const fallback = await caches.match(req);
        if (fallback) return fallback;
        throw err;
      }
    })());
    return;
  }

  /* 2) Mismo origen: stale-while-revalidate (+ fallback offline) */
  if (isSameOriginGet(req)) {
    event.respondWith((async () => {
      const cache = await caches.open(SHELL_CACHE);
      const cached = await cache.match(req);

      const network = fetch(req)
        .then((res) => {
          if (res && res.ok && res.status === 200 && res.type === 'basic') {
            cache.put(req, res.clone()).catch(() => { /* cuota/GET extraño */ });
          }
          return res;
        })
        .catch(() => null);

      if (cached) {
        event.waitUntil(network); // actualiza en segundo plano
        return cached;
      }

      const res = await network;
      if (res) return res;

      /* Offline y no está en caché: navegación -> shell */
      if (req.mode === 'navigate') {
        const idx = await cache.match('./index.html');
        if (idx) return idx;
      }
      return Response.error();
    })());
    return;
  }

  /* 3) Resto de GET (Tailwind CDN, Google Fonts…): stale-while-revalidate.
        Las respuestas opacas (peticiones no-cors de scripts/fuentes) también
        se cachean: sin esto la recarga offline perdería estilos y tipografía. */
  event.respondWith((async () => {
    const cache = await caches.open(CDN_CACHE);
    const cached = await cache.match(req);

    const network = fetch(req)
      .then((res) => {
        const cacheable = res && ((res.ok && res.status === 200) || res.type === 'opaque');
        if (cacheable) {
          cache.put(req, res.clone()).catch(() => { /* cuota */ });
        }
        return res;
      })
      .catch(() => null);

    if (cached) {
      event.waitUntil(network);
      return cached;
    }
    const res = await network;
    if (res) return res;
    return Response.error();
  })());
});
