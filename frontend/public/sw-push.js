// RemindIQ Background Push Notification & Alarm Action Handlers
// Imported into generated Service Worker via Workbox importScripts

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
  // - On Android mobile, Notification.maxActions is 2. Passing >2 actions can cause showNotification to reject.
  // - requireInteraction: true keeps alert on mobile lock screen until dismissed
  // - renotify: true ensures fresh audio/vibration for every due reminder
  // - urgent alarm vibration pattern simulating phone ringing cadence
  const actions = phone
    ? [
        { action: 'call', title: `📞 Call ${phone}` },
        { action: 'complete', title: '✅ Complete' },
      ]
    : [
        { action: 'complete', title: '✅ Complete' },
        { action: 'open', title: '📱 Open App' },
      ];

  const primaryOptions = {
    body: data.body || 'High-priority customer call reminder is due right now.',
    icon: '/app-icon.png',
    badge: '/badge-72.png',
    vibrate: [500, 250, 500, 250, 500, 250, 800, 300, 800, 300, 1000],
    requireInteraction: true,
    renotify: true,
    tag: reminderId ? `remindiq-alarm-${reminderId}` : `remindiq-alarm-${Date.now()}`,
    timestamp: data.timestamp || Date.now(),
    data: {
      url: data.url || '/reminders',
      phone: phone,
      reminderId: reminderId,
      name: data.name || '',
      userId: data.userId || '',
      isAlarm: true,
    },
    actions: actions,
  };

  const showSafeNotification = async () => {
    try {
      return await self.registration.showNotification(title, primaryOptions);
    } catch (primaryErr) {
      console.warn('[SW Push] Primary showNotification failed, trying basic fallback:', primaryErr);
      try {
        // Minimal safe notification guaranteed to work on any mobile OS/browser
        return await self.registration.showNotification(title, {
          body: data.body || 'High-priority customer call reminder is due right now.',
          icon: '/app-icon.png',
          tag: reminderId ? `remindiq-alarm-${reminderId}` : 'remindiq-alarm',
          renotify: true,
          data: primaryOptions.data,
        });
      } catch (fallbackErr) {
        console.error('[SW Push] Even minimal fallback notification failed:', fallbackErr);
      }
    }
  };

  // If any app windows are open or in background, wake them immediately with sound & modal
  const broadcastPromise = self.clients
    .matchAll({ type: 'window', includeUncontrolled: true })
    .then((clientList) => {
      for (const client of clientList) {
        try {
          client.postMessage({
            type: 'PUSH_ALARM_RECEIVED',
            data: {
              reminderId,
              name: data.name,
              phone: data.phone,
              title,
              body: data.body,
              userId: data.userId || '',
            },
          });
        } catch (e) {}
      }
    })
    .catch(() => {});

  event.waitUntil(Promise.allSettled([showSafeNotification(), broadcastPromise]));
});

// Notification Click Event: Complete, Dial phone, Snooze 10m in background, or Open App
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  const phone = data.phone;
  const reminderId = data.reminderId;

  // 1. Action: Direct Complete Reminder from mobile notification drawer
  if (event.action === 'complete') {
    if (!reminderId || String(reminderId).startsWith('test-') || reminderId === 'test-alert') {
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        for (const client of clientList) {
          try {
            client.postMessage({ type: 'TEST_ALARM_COMPLETED', data: { reminderId } });
          } catch (e) {}
        }
      });
      return;
    }

    const completePromise = fetch(`/api/v1/reminders/${reminderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ status: 'completed' }),
    })
      .then(() => {
        return self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
          for (const client of clientList) {
            try {
              client.postMessage({ type: 'REMINDER_COMPLETED_BACKGROUND', data: { reminderId } });
            } catch (e) {}
          }
        });
      })
      .then(() => {
        return self.registration.showNotification('✅ Reminder Completed', {
          body: data.name ? `Call follow-up with ${data.name} marked as completed.` : 'Call reminder marked as completed.',
          icon: '/app-icon.png',
          badge: '/badge-72.png',
          tag: `complete-ack-${reminderId}`,
          renotify: false,
        });
      })
      .catch((err) => {
        console.warn('[SW] Complete background error:', err);
      });

    event.waitUntil(completePromise);
    return;
  }

  // 2. Action: Direct Dial Customer
  if (event.action === 'call' && phone) {
    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    event.waitUntil(
      clients.openWindow(`tel:${cleanPhone}`).catch(() => {})
    );
    return;
  }

  // 3. Action: 10-Minute Snooze directly from notification drawer
  if (event.action === 'snooze10' && reminderId && !String(reminderId).startsWith('test-')) {
    const snoozePromise = fetch(`/api/v1/reminders/${reminderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        dueAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        status: 'pending',
      }),
    })
      .then(() => {
        return self.registration.showNotification('⏰ Call Postponed', {
          body: 'Reminder snoozed for 10 minutes.',
          icon: '/app-icon.png',
          badge: '/badge-72.png',
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

  // 4. Action: Open / Focus RemindIQ Window
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
      fetch('/api/v1/reminders?status=pending', { credentials: 'include' })
        .then((res) => res.json())
        .then((data) => {
          const list = data?.data || [];
          const now = Date.now();
          const due = list.filter((r) => r.status === 'pending' && new Date(r.dueAt).getTime() <= now);
          if (due.length > 0) {
            const first = due[0];
            return self.registration.showNotification(`🚨 Call Due: ${first.name}`, {
              body: `Phone: ${first.phone}. Tap to call customer.`,
              icon: '/app-icon.png',
              badge: '/badge-72.png',
              vibrate: [500, 250, 500, 250, 500],
              data: { url: `/reminders?alertId=${first._id}`, phone: first.phone, reminderId: first._id, name: first.name },
              actions: first.phone
                ? [
                    { action: 'call', title: `📞 Call ${first.phone}` },
                    { action: 'complete', title: '✅ Complete' },
                  ]
                : [
                    { action: 'complete', title: '✅ Complete' },
                    { action: 'open', title: '📱 Open App' },
                  ],
            });
          }
        })
        .catch(() => {})
    );
  }
});
