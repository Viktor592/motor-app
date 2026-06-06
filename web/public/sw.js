/**
 * МОТОР — PWA Service Worker v2
 * Cache strategies: Shell→CacheFirst, API→NetworkFirst, Images→CacheFirst
 */
const CACHE_VERSION = 'motor-v2';
const SHELL_CACHE   = `${CACHE_VERSION}-shell`;
const API_CACHE     = `${CACHE_VERSION}-api`;
const IMAGE_CACHE   = `${CACHE_VERSION}-images`;

const SHELL_URLS = ['/', '/offline.html', '/icons/icon-192.png', '/icons/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(SHELL_CACHE).then(c => c.addAll(SHELL_URLS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('motor-') && ![SHELL_CACHE,API_CACHE,IMAGE_CACHE].includes(k)).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const { request } = e;
  const url = new URL(request.url);
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) return;

  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/socket.io/')) {
    e.respondWith(networkFirst(request, API_CACHE, 4000)); return;
  }
  if (request.destination === 'image') {
    e.respondWith(cacheFirst(request, IMAGE_CACHE)); return;
  }
  if (['script','style','font'].includes(request.destination)) {
    e.respondWith(cacheFirst(request, SHELL_CACHE)); return;
  }
  if (request.mode === 'navigate') {
    e.respondWith(fetch(request).catch(() => caches.match('/offline.html') || caches.match('/'))); return;
  }
  e.respondWith(networkFirst(request, SHELL_CACHE, 5000));
});

async function cacheFirst(req, cacheName) {
  const cached = await caches.match(req);
  if (cached) return cached;
  const resp = await fetch(req).catch(() => null);
  if (resp?.ok) { const c = await caches.open(cacheName); c.put(req, resp.clone()); }
  return resp || new Response('Offline', { status: 503 });
}

async function networkFirst(req, cacheName, ms) {
  const ctrl = new AbortController();
  const t    = setTimeout(() => ctrl.abort(), ms);
  try {
    const resp = await fetch(req, { signal: ctrl.signal });
    clearTimeout(t);
    if (resp.ok) { const c = await caches.open(cacheName); c.put(req, resp.clone()); }
    return resp;
  } catch {
    clearTimeout(t);
    return (await caches.match(req)) || new Response(JSON.stringify({ error: 'offline' }), { status: 503, headers: { 'Content-Type':'application/json' } });
  }
}

// Push
self.addEventListener('push', e => {
  if (!e.data) return;
  let p; try { p = e.data.json(); } catch { p = { title:'МОТОР', body: e.data.text() }; }
  e.waitUntil(self.registration.showNotification(p.title || 'МОТОР', {
    body: p.body, icon: '/icons/icon-192.png', badge: '/icons/badge-72.png',
    data: p.data ?? {}, vibrate: [200,100,200], tag: p.data?.orderId || 'motor', renotify: true,
    actions: [{ action:'open', title:'Открыть' }, { action:'dismiss', title:'Закрыть' }],
  }));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  if (e.action === 'dismiss') return;
  const path = e.notification.data?.orderId ? `/orders/${e.notification.data.orderId}` : '/';
  e.waitUntil(clients.matchAll({ type:'window', includeUncontrolled:true }).then(ws => {
    const w = ws.find(x => x.url.includes(self.location.origin));
    if (w) { w.focus(); w.navigate(path); } else clients.openWindow(path);
  }));
});

// Background sync
self.addEventListener('sync', e => {
  if (e.tag === 'sync-orders') e.waitUntil(syncPending());
});
async function syncPending() {
  const c = await caches.open('motor-pending');
  for (const req of await c.keys()) {
    try { const b = await c.match(req).then(r=>r?.text()); await fetch(req.url,{method:'POST',headers:{'Content-Type':'application/json'},body:b}); await c.delete(req); } catch {}
  }
}
