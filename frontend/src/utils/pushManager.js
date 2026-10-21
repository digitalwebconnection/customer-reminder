import api from '../api/axios';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Registers or returns active Service Worker
 */
export async function registerServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }
  try {
    const existing = await navigator.serviceWorker.getRegistration();
    if (existing && existing.active) {
      return existing;
    }
    const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    await navigator.serviceWorker.ready;
    return registration;
  } catch (err) {
    console.warn('[SW] Registration failed:', err?.message || err);
    return null;
  }
}

/**
 * Requests persistent storage to prevent Android from evicting background service worker
 */
export async function requestStoragePersistence() {
  if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
    try {
      const isPersisted = await navigator.storage.persist();
      console.log(`[Storage] Persistent storage granted: ${isPersisted}`);
      return isPersisted;
    } catch (e) {
      console.warn('[Storage] Error requesting persistence:', e);
    }
  }
  return false;
}

/**
 * Registers Periodic Background Sync (Android Chrome PWA)
 */
export async function registerPeriodicSync(registration) {
  try {
    if ('periodicSync' in registration) {
      const status = await navigator.permissions.query({ name: 'periodic-background-sync' });
      if (status.state === 'granted') {
        await registration.periodicSync.register('check-due-reminders', {
          minInterval: 60 * 1000, // Check every minute
        });
        console.log('[SW] Periodic background sync registered');
        return true;
      }
    }
  } catch (e) {
    // Expected on browsers without periodic background sync permission
  }
  return false;
}

/**
 * Checks live status of all mobile alarm permissions
 */
export async function getDetailedPermissions() {
  const result = {
    isSupported: typeof window !== 'undefined' && 'Notification' in window,
    notification: typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported',
    serviceWorkerActive: false,
    pushSubscribed: false,
    storagePersisted: false,
    isStandalone: false,
  };

  if (typeof window === 'undefined') return result;

  // Check standalone mode (PWA installed on home screen)
  result.isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true ||
    document.referrer.includes('android-app://');

  // Check storage persistence
  if (navigator.storage && navigator.storage.persisted) {
    try {
      result.storagePersisted = await navigator.storage.persisted();
    } catch (e) {}
  }

  // Check service worker & push subscription
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.getRegistration('/');
      if (reg) {
        result.serviceWorkerActive = !!reg.active;
        if (reg.pushManager) {
          const sub = await reg.pushManager.getSubscription();
          result.pushSubscribed = !!sub;
        }
      }
    } catch (e) {}
  }

  return result;
}

function serializeSubscription(sub) {
  if (!sub) return null;
  if (typeof sub.toJSON === 'function') {
    const json = sub.toJSON();
    if (json && json.endpoint && json.keys) return json;
  }
  return {
    endpoint: sub.endpoint,
    expirationTime: sub.expirationTime || null,
    keys: {
      p256dh: sub.getKey ? btoa(String.fromCharCode.apply(null, new Uint8Array(sub.getKey('p256dh')))) : (sub.keys?.p256dh || ''),
      auth: sub.getKey ? btoa(String.fromCharCode.apply(null, new Uint8Array(sub.getKey('auth')))) : (sub.keys?.auth || ''),
    },
  };
}

/**
 * Full 1-Click Permissions & Push Subscription Activator
 */
export async function requestAndSubscribePush() {
  if (!('Notification' in window)) {
    return { success: false, reason: 'unsupported' };
  }

  // 1. Request Notification Permission
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    return { success: false, reason: 'denied', permission };
  }

  // 2. Request Persistent Storage to guard background worker
  await requestStoragePersistence();

  // 3. Register Service Worker and wait for activation
  const reg = await registerServiceWorker();
  if (!reg) {
    return { success: true, permission: 'granted', pushSupported: false };
  }

  // 4. Try registering periodic background sync
  await registerPeriodicSync(reg);

  // 5. Subscribe to Web Push using server VAPID key
  try {
    const keyRes = await api.get('/push/public-key');
    const vapidPublicKey = keyRes.data?.publicKey;

    if (!vapidPublicKey) {
      return { success: true, permission: 'granted', pushSupported: false };
    }

    const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);

    // Unsubscribe any stale subscription if needed
    try {
      const existing = await reg.pushManager.getSubscription();
      if (existing) {
        // Send existing to ensure backend has it
        const serialized = serializeSubscription(existing);
        if (serialized && serialized.endpoint && serialized.keys?.p256dh) {
          await api.post('/push/subscribe', serialized);
          return { success: true, permission: 'granted', subscribed: true };
        }
      }
    } catch (e) {}

    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey,
    });

    // Save subscription in backend
    const serialized = serializeSubscription(subscription);
    await api.post('/push/subscribe', serialized);
    return { success: true, permission: 'granted', subscribed: true };
  } catch (err) {
    console.warn('[WebPush] Subscription error:', err);
    return { success: true, permission: 'granted', error: err.message };
  }
}

/**
 * Dispatches a real test push alarm from the backend to this device
 * @param {number} delaySeconds - Optional delay (e.g. 5s) allowing user to lock screen first
 */
export async function sendTestMobileAlarmPush(delaySeconds = 0) {
  const res = await api.post('/push/test', { delaySeconds });
  return res.data;
}

