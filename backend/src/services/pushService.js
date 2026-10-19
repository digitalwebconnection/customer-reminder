import webpush from 'web-push';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SUBS_FILE = path.resolve(__dirname, '../../data/subscriptions.json');

const defaultPublicKey = 'BAOI-h5EPr4lTcKf6nfByWNX0JtYfD7GXo3NBofsDnU5wSncqEUx4IwIWddAg-4A_dahjYKLOag00tvn9vBf3bE';
const defaultPrivateKey = 'efARUsaWQmfC1RJTLLooyAeczM3RvAoKMTQAphWFHEY';
const defaultSubject = 'mailto:vaibhavdigitalwebconnection@gmail.com';

const publicKey = process.env.VAPID_PUBLIC_KEY || defaultPublicKey;
const privateKey = process.env.VAPID_PRIVATE_KEY || defaultPrivateKey;
const subject = process.env.VAPID_SUBJECT || defaultSubject;

try {
  webpush.setVapidDetails(subject, publicKey, privateKey);
} catch (err) {
  console.warn('[WebPush] VAPID details error:', err.message);
}

function getSubscriptions() {
  try {
    if (!fs.existsSync(SUBS_FILE)) {
      return [];
    }
    return JSON.parse(fs.readFileSync(SUBS_FILE, 'utf-8'));
  } catch (err) {
    return [];
  }
}

function saveSubscription(sub) {
  try {
    const subs = getSubscriptions();
    const exists = subs.some((s) => s.endpoint === sub.endpoint);
    if (!exists) {
      subs.push(sub);
      fs.writeFileSync(SUBS_FILE, JSON.stringify(subs, null, 2), 'utf-8');
    }
  } catch (err) {
    console.error('[WebPush] Error saving subscription:', err);
  }
}

export const pushService = {
  getPublicKey: () => publicKey,

  getSubscriptions: () => getSubscriptions(),

  addSubscription: (sub) => {
    saveSubscription(sub);
  },

  sendPushToAll: async (payload) => {
    const subs = getSubscriptions();
    if (subs.length === 0) {
      console.log('[WebPush] No active push subscriptions found.');
      return { total: 0, sent: 0 };
    }

    const payloadString = JSON.stringify(payload);
    const validSubs = [];
    let sentCount = 0;

    // High Urgency and 24h TTL ensures Android Google FCM wakes mobile device from Doze/standby immediately
    const pushOptions = {
      TTL: 86400, // 24 hours Time To Live
      urgency: 'high', // 'very-low' | 'low' | 'normal' | 'high'
      topic: 'reminders',
      headers: {
        Urgency: 'high',
      },
    };

    for (const sub of subs) {
      try {
        await webpush.sendNotification(sub, payloadString, pushOptions);
        validSubs.push(sub);
        sentCount++;
      } catch (err) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          // Expired subscription, omit from validSubs
          console.log(`[WebPush] Removing expired subscription: ${sub.endpoint}`);
        } else {
          validSubs.push(sub);
          console.warn(`[WebPush] Notification warning for ${sub.endpoint?.slice(0, 30)}...: ${err.message}`);
        }
      }
    }

    try {
      fs.writeFileSync(SUBS_FILE, JSON.stringify(validSubs, null, 2), 'utf-8');
    } catch (e) {}

    console.log(`[WebPush] Sent high-urgency alarm to ${sentCount}/${subs.length} device(s)`);
    return { total: subs.length, sent: sentCount };
  },
};
