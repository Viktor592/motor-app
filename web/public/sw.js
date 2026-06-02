// МОТОР — Service Worker для Web Push уведомлений
// Файл: /public/sw.js

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'МОТОР', body: event.data.text() };
  }

  const options = {
    body:    payload.body,
    icon:    '/icon-192.png',
    badge:   '/badge-72.png',
    data:    payload.data ?? {},
    vibrate: [200, 100, 200],
    actions: [
      { action: 'open',    title: 'Открыть' },
      { action: 'dismiss', title: 'Закрыть' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(payload.title || 'МОТОР', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const orderId = event.notification.data?.orderId;
  const url     = orderId ? `/orders/${orderId}` : '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});

self.addEventListener('install',  () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(clients.claim()));
