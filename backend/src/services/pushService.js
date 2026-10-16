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

  addSubscription: (sub) => {
    saveSubscription(sub);
  },

  sendPushToAll: async (payload) => {
    const subs = getSubscriptions();
    if (subs.length === 0) return;

    const payloadString = JSON.stringify(payload);
    const validSubs = [];

    for (const sub of subs) {
      try {
        await webpush.sendNotification(sub, payloadString);
        validSubs.push(sub);
      } catch (err) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          // Expired subscription, omit from validSubs
          console.log(`[WebPush] Removing expired subscription: ${sub.endpoint}`);
        } else {
          validSubs.push(sub);
          console.warn(`[WebPush] Notification failed: ${err.message}`);
        }
      }
    }

    try {
      fs.writeFileSync(SUBS_FILE, JSON.stringify(validSubs, null, 2), 'utf-8');
    } catch (e) {}
  },
};
