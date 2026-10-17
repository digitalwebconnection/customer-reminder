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

export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    return null;
  }
  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    return registration;
  } catch (err) {
    console.warn('[SW] Registration failed:', err);
    return null;
  }
}

export async function requestAndSubscribePush() {
  if (!('Notification' in window)) {
    alert('This browser does not support desktop notifications.');
    return { success: false, reason: 'unsupported' };
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    return { success: false, reason: 'denied', permission };
  }

  try {
    const reg = await registerServiceWorker();
    if (!reg) {
      return { success: true, permission: 'granted', pushSupported: false };
    }

    // Get VAPID public key from backend
    const keyRes = await api.get('/push/public-key');
    const vapidPublicKey = keyRes.data?.publicKey;

    if (!vapidPublicKey) {
      return { success: true, permission: 'granted' };
    }

    const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey,
    });

    // Send subscription to backend
    await api.post('/push/subscribe', subscription);
    return { success: true, permission: 'granted', subscribed: true };
  } catch (err) {
    console.warn('[WebPush] Subscription error:', err);
    return { success: true, permission: 'granted', error: err.message };
  }
}
