/**
 * OneSignal Web Push Manager (v16)
 */

export async function promptOneSignalPush() {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false);

    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async function (OneSignal) {
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
        console.warn('OneSignal prompt error:', err);
        if ('Notification' in window) {
          const perm = await Notification.requestPermission();
          resolve(perm === 'granted');
        } else {
          resolve(false);
        }
      }
    });
  });
}

export function isOneSignalSubscribed() {
  if (typeof window === 'undefined') return false;
  try {
    if (window.OneSignal && window.OneSignal.User && window.OneSignal.User.PushSubscription) {
      return window.OneSignal.User.PushSubscription.optedIn;
    }
    if ('Notification' in window) {
      return Notification.permission === 'granted';
    }
  } catch (e) {}
  return false;
}
