const CACHE_NAME = 'vungtau-dokkaebi-v7';
const APP_SHELL = [
  '/manifest.json',
  '/favicon.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  try {
    const url = new URL(event.request.url);

    if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/ws/')) {
      return;
    }

    if (event.request.mode === 'navigate') {
      event.respondWith(
        fetch(event.request).catch(() => {
          return caches.match('/').then((cached) => {
            return cached || new Response('<html><body><h1>오프라인</h1><p>인터넷 연결을 확인해주세요.</p></body></html>', {
              status: 503,
              headers: { 'Content-Type': 'text/html; charset=utf-8' }
            });
          });
        })
      );
      return;
    }

    if (url.pathname.endsWith('.js') || url.pathname.endsWith('.css')) {
      event.respondWith(
        fetch(event.request).catch(() => caches.match(event.request))
      );
      return;
    }

    event.respondWith(
      caches.match(event.request).then((cached) => {
        return cached || fetch(event.request).then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        }).catch(() => cached);
      })
    );
  } catch (e) {
    return;
  }
});

// 푸시 알림 수신
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  try {
    const data = event.data.json();
    const options = {
      body: data.body || '',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      vibrate: [100, 50, 100],
      data: {
        url: data.url || '/'
      },
      actions: [
        { action: 'open', title: '열기' },
        { action: 'close', title: '닫기' }
      ]
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || '붕따우 도깨비', options)
    );
  } catch (err) {
    console.error('Push notification error:', err);
  }
});

// 알림 클릭 처리
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'close') return;
  
  const url = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(url);
            return client.focus();
          }
        }
        return clients.openWindow(url);
      })
  );
});
