// RemindIQ Progressive Web App (PWA) Service Worker v2
// High-Urgency Background Push Alarms, Offline Cache & Action Handlers

const CACHE_NAME = 'remindiq-pwa-v2';
const PRECACHE_URLS = [
  '/',
  '/reminders',
  '/manifest.json',
  '/favicon.svg',
  '/app-icon.png',
  '/ringtone.wav',
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
  if (event.request.method !== 'GET' || event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
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
        if (event.request.mode === 'navigate') {
          return caches.match('/');
        }
        return new Response('Offline - RemindIQ', { status: 503, statusText: 'Service Unavailable' });
      })
  );
});

// Web Push Event: Triggers phone notifications and loud alarm when app is closed / backgrounded
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: '🚨 Call Reminder Due', body: event.data.text() };
    }
  }

  const title = data.title || '🚨 Customer Call Alarm';
  const phone = data.phone || '';
  const reminderId = data.reminderId || '';

  // Mobile Alarm Notification Options:
  // - requireInteraction: true keeps alert on mobile lock screen until dismissed
  // - renotify: true ensures fresh audio/vibration for every due reminder
  // - urgent alarm vibration pattern simulating phone ringing cadence
  const options = {
    body: data.body || 'High-priority customer call reminder is due right now.',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    vibrate: [500, 250, 500, 250, 500, 250, 800, 300, 800, 300, 1000],
    sound: '/ringtone.wav',
    silent: false,
    requireInteraction: true,
    renotify: true,
    tag: reminderId ? `remindiq-alarm-${reminderId}` : `remindiq-alarm-${Date.now()}`,
    timestamp: data.timestamp || Date.now(),
    data: {
      url: data.url || '/reminders',
      phone: phone,
      reminderId: reminderId,
      name: data.name || '',
      isAlarm: true,
    },
    actions: [
      ...(phone ? [{ action: 'call', title: `📞 Call ${phone}` }] : []),
      { action: 'snooze10', title: '⏰ Snooze 10m' },
      { action: 'open', title: '📱 Open App' },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification Click Event: Dial phone, Snooze 10m in background, or Open App
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  const phone = data.phone;
  const reminderId = data.reminderId;

  // 1. Action: Direct Dial Customer
  if (event.action === 'call' && phone) {
    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    event.waitUntil(
      clients.openWindow(`tel:${cleanPhone}`).catch(() => {})
    );
    return;
  }

  // 2. Action: 10-Minute Snooze directly from notification drawer
  if (event.action === 'snooze10' && reminderId && !reminderId.startsWith('test-')) {
    const snoozePromise = fetch(`/api/v1/reminders/${reminderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dueAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        status: 'pending',
      }),
    })
      .then(() => {
        return self.registration.showNotification('⏰ Call Postponed', {
          body: 'Reminder snoozed for 10 minutes.',
          icon: '/favicon.svg',
          badge: '/favicon.svg',
          tag: 'snooze-ack',
          renotify: false,
        });
      })
      .catch((err) => {
        console.warn('[SW] Snooze background error:', err);
      });

    event.waitUntil(snoozePromise);
    return;
  }

  // 3. Action: Open / Focus RemindIQ Window
  const targetUrl = data.url || '/reminders';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('/reminders') && 'focus' in client) {
          try {
            client.postMessage({ type: 'CALL_REMINDER_NOTIFICATION_CLICK', data });
          } catch (e) {}
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Periodic Background Sync: Background check if permitted by browser
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'check-due-reminders') {
    event.waitUntil(
      fetch('/api/v1/reminders?status=pending')
        .then((res) => res.json())
        .then((data) => {
          const list = data?.data || [];
          const now = Date.now();
          const due = list.filter((r) => new Date(r.dueAt).getTime() <= now);
          if (due.length > 0) {
            const first = due[0];
            return self.registration.showNotification(`🚨 Call Due: ${first.name}`, {
              body: `Phone: ${first.phone}. Tap to call customer.`,
              icon: '/favicon.svg',
              badge: '/favicon.svg',
              vibrate: [500, 250, 500, 250, 500],
              data: { url: '/reminders', phone: first.phone, reminderId: first._id },
            });
          }
        })
        .catch(() => {})
    );
  }
});
