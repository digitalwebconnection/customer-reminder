// RemindIQ Service Worker for Background Web Push Notifications (when browser is closed)
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
    icon: '/vite.svg',
    badge: '/vite.svg',
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
