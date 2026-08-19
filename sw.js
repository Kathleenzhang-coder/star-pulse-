/** StarPulse 离线壳 — JS/CSS 始终走网络，避免缓存旧代码 */
const CACHE = 'starpulse-v9';
const SHELL = ['/', '/index.html', '/manifest.webmanifest', '/icons/icon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL).catch(() => {})),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
    ),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/uploads/')) {
    event.respondWith(fetch(request));
    return;
  }

  // JS / CSS 始终优先网络，防止树洞等模块用到旧代码
  if (url.pathname.startsWith('/js/') || url.pathname.startsWith('/css/')) {
    event.respondWith(
      fetch(request).catch(() => caches.match(request)),
    );
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok && url.origin === self.location.origin) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(() => caches.match(request).then((cached) => cached || caches.match('/index.html'))),
  );
});
