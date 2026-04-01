// Echo Przodków – Service Worker v1.2
const CACHE = 'echo-przodkow-v2';
const BASE = '/';

self.addEventListener('install', e => {
  e.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Sieć najpierw, cache jako fallback – idealne przy słabym zasięgu
self.addEventListener('fetch', e => {
  if(e.request.method !== 'GET') return;
  // Firebase i Google APIs – nie cachuj nigdy
  if(e.request.url.includes('firebase') ||
     e.request.url.includes('googleapis') ||
     e.request.url.includes('gstatic')) return;

  e.respondWith(
    fetch(e.request)
      .then(response => {
        // zapisz w cache jeśli odpowiedź ok
        if(response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(e.request))
  );
});

// ── PUSH NOTIFICATIONS ──
self.addEventListener('push', e => {
  let data = {};
  try { data = e.data.json(); } catch(_) {
    data = { notification: { title: 'Echo Przodków', body: e.data?.text()||'' }};
  }
  const { title='Echo Przodków', body='Nowe powiadomienie' } = data.notification || {};
  e.waitUntil(
    self.registration.showNotification(title, {
      body,
      vibrate: [200, 100, 200],
      data: { url: BASE }
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type:'window', includeUncontrolled:true }).then(list => {
      if(list.length > 0) return list[0].focus();
      return clients.openWindow(BASE);
    })
  );
});
