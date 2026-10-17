// RemindIQ Progressive Web App (PWA) Service Worker
// Provides offline capability, background push notifications, and home-screen installability.

const CACHE_NAME = 'remindiq-pwa-v1';
const PRECACHE_URLS = [
  '/',
  '/reminders',
  '/manifest.json',
  '/favicon.svg',
  '/app-icon.png',
];

// Install Event: Precaches essential offline app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch((err) => {
        console.warn('[SW] Cache precache warning:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate Event: Cleans up obsolete caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch Event: Network-first with cache fallback for static assets
self.addEventListener('fetch', (event) => {
  // Let API requests and non-GET requests pass directly through
  if (event.request.method !== 'GET' || event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses for same-origin requests
        if (response.status === 200 && event.request.url.startsWith(self.location.origin)) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        // Fallback to cached index for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('/');
        }
        return new Response('Offline - RemindIQ', { status: 503, statusText: 'Service Unavailable' });
      })
  );
});

// Web Push Event: Triggers notifications when app is in background or closed
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'Call Reminder Due', body: event.data.text() };
    }
  }

  const title = data.title || '🔔 Customer Call Reminder';
  const options = {
    body: data.body || 'You have a customer follow-up call due now.',
    icon: '/app-icon.png',
    badge: '/favicon.svg',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/reminders',
      phone: data.phone || '',
    },
    actions: data.phone
      ? [
          { action: 'call', title: `Call ${data.phone}` },
          { action: 'open', title: 'Open Reminders' },
        ]
      : [{ action: 'open', title: 'Open Reminders' }],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification Click Event: Focuses window or dials phone
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const phone = event.notification.data?.phone;
  if (event.action === 'call' && phone) {
    clients.openWindow(`tel:${phone}`);
    return;
  }

  const targetUrl = event.notification.data?.url || '/reminders';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('/reminders') && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
