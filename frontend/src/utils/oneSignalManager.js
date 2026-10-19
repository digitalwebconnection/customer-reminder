/**
 * OneSignal Web Push Manager (v16) with resilient timeout safeguard
 */

const isProdDomain = () => {
  if (typeof window === 'undefined') return false;
  return (
    window.location.hostname === 'digitalwebconnection.com' ||
    window.location.hostname.endsWith('.digitalwebconnection.com')
  );
};

export async function promptOneSignalPush() {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false);

    // If not running on the OneSignal authorized production domain, fallback directly to browser notification API
    if (!isProdDomain()) {
      if ('Notification' in window) {
        Notification.requestPermission()
          .then((perm) => resolve(perm === 'granted'))
          .catch(() => resolve(false));
      } else {
        resolve(false);
      }
      return;
    }

    // Timeout safety: never let this promise hang the UI longer than 2.5 seconds
    const timeout = setTimeout(() => {
      console.warn('[OneSignal] Initialization timed out, falling back to browser notifications.');
      resolve(false);
    }, 2500);

    try {
      window.OneSignalDeferred = window.OneSignalDeferred || [];
      window.OneSignalDeferred.push(async function (OneSignal) {
        clearTimeout(timeout);
        try {
          if (OneSignal.Notifications && OneSignal.Notifications.requestPermission) {
            await OneSignal.Notifications.requestPermission();
            const permission = OneSignal.Notifications.permission;
            resolve(permission);
          } else if (OneSignal.Slidedown) {
            await OneSignal.Slidedown.promptPush();
            resolve(true);
          } else if ('Notification' in window) {
            const perm = await Notification.requestPermission();
            resolve(perm === 'granted');
          } else {
            resolve(false);
          }
        } catch (err) {
          console.warn('[OneSignal] Prompt error:', err);
          resolve(false);
        }
      });
    } catch (err) {
      clearTimeout(timeout);
      resolve(false);
    }
  });
}

export function isOneSignalSubscribed() {
  if (typeof window === 'undefined') return false;
  try {
    if (isProdDomain() && window.OneSignal && window.OneSignal.User && window.OneSignal.User.PushSubscription) {
      return !!window.OneSignal.User.PushSubscription.optedIn;
    }
    if ('Notification' in window) {
      return Notification.permission === 'granted';
    }
  } catch (e) {}
  return false;
}
