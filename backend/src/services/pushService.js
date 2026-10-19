import webpush from 'web-push';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import PushSubscription from '../models/PushSubscription.js';
import User from '../models/User.js';

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

const isMongoActive = () => mongoose.connection && mongoose.connection.readyState === 1;

// File fallback helpers for local persistence
function getFileSubscriptions() {
  try {
    if (!fs.existsSync(SUBS_FILE)) return [];
    return JSON.parse(fs.readFileSync(SUBS_FILE, 'utf-8'));
  } catch (err) {
    return [];
  }
}

function saveFileSubscription(sub) {
  try {
    const subs = getFileSubscriptions();
    const exists = subs.some((s) => s.endpoint === sub.endpoint);
    if (!exists) {
      subs.push(sub);
      fs.writeFileSync(SUBS_FILE, JSON.stringify(subs, null, 2), 'utf-8');
    }
  } catch (err) {
    console.error('[WebPush] Error saving to file fallback:', err);
  }
}

function removeFileSubscription(endpoint) {
  try {
    const subs = getFileSubscriptions().filter((s) => s.endpoint !== endpoint);
    fs.writeFileSync(SUBS_FILE, JSON.stringify(subs, null, 2), 'utf-8');
  } catch (err) {}
}

const PUSH_OPTIONS = {
  TTL: 86400, // 24 hours Time To Live
  urgency: 'high', // 'very-low' | 'low' | 'normal' | 'high'
  topic: 'reminders',
  headers: {
    Urgency: 'high',
  },
};

export const pushService = {
  getPublicKey: () => publicKey,

  /**
   * Save a push subscription in MongoDB and associate with user (with file backup)
   */
  addSubscription: async (sub, userId = null, userAgent = '') => {
    if (!sub || !sub.endpoint || !sub.keys) return null;

    // 1. File fallback save with userId
    saveFileSubscription({ ...sub, userId: userId ? String(userId) : null });

    // 2. MongoDB persistent save
    if (isMongoActive()) {
      try {
        const query = { endpoint: sub.endpoint };
        const update = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.keys.p256dh,
            auth: sub.keys.auth,
          },
          isActive: true,
          userAgent: userAgent || '',
        };

        if (userId && mongoose.isValidObjectId(userId)) {
          update.userId = new mongoose.Types.ObjectId(userId);
        }

        const savedSub = await PushSubscription.findOneAndUpdate(query, update, {
          upsert: true,
          returnDocument: 'after',
        });

        // Ensure this device endpoint is ONLY bound to this user (remove from any previous accounts)
        if (userId && mongoose.isValidObjectId(userId)) {
          await User.updateMany(
            { _id: { $ne: userId }, 'pushSubscriptions.endpoint': sub.endpoint },
            { $pull: { pushSubscriptions: { endpoint: sub.endpoint } } }
          );

          const user = await User.findById(userId);
          if (user) {
            user.pushSubscription = sub;
            const existingIndex = (user.pushSubscriptions || []).findIndex(
              (s) => s.endpoint === sub.endpoint
            );
            if (existingIndex >= 0) {
              user.pushSubscriptions[existingIndex] = sub;
            } else {
              user.pushSubscriptions = [...(user.pushSubscriptions || []), sub];
            }
            await user.save();
          }
        }

        console.log(`[WebPush] ✅ Saved push subscription for ${userId ? `user ${userId}` : 'guest device'}`);
        return savedSub;
      } catch (err) {
        console.error('[WebPush] Error saving to MongoDB:', err.message);
      }
    }

    return sub;
  },

  /**
   * Deactivate a push subscription (e.g. on logout or revoke)
   */
  deactivateSubscription: async (endpoint, userId = null) => {
    if (!endpoint) return false;

    if (isMongoActive()) {
      try {
        await PushSubscription.updateOne({ endpoint }, { isActive: false });
        if (userId && mongoose.isValidObjectId(userId)) {
          await User.updateOne(
            { _id: userId },
            { $pull: { pushSubscriptions: { endpoint } } }
          );
        }
      } catch (e) {
        console.warn('[WebPush] Error deactivating subscription:', e.message);
      }
    }
    removeFileSubscription(endpoint);
    return true;
  },

  /**
   * Send high-urgency alarm Web Push to a single subscription object
   */
  sendPushToSubscription: async (sub, payload) => {
    if (!sub || !sub.endpoint) return { success: false, reason: 'invalid_subscription' };

    const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);

    try {
      await webpush.sendNotification(sub, payloadString, PUSH_OPTIONS);
      return { success: true };
    } catch (err) {
      if (err.statusCode === 410 || err.statusCode === 404) {
        console.log(`[WebPush] Subscription expired or unregistered (HTTP ${err.statusCode}): ${sub.endpoint?.slice(0, 45)}...`);
        // Deactivate in Mongo and file
        if (isMongoActive()) {
          try {
            await PushSubscription.updateOne({ endpoint: sub.endpoint }, { isActive: false });
          } catch (e) {}
        }
        removeFileSubscription(sub.endpoint);
        return { success: false, expired: true, statusCode: err.statusCode };
      }

      console.warn(`[WebPush] Push delivery warning for ${sub.endpoint?.slice(0, 30)}...:`, err.message);
      return { success: false, error: err.message };
    }
  },

  /**
   * Send high-urgency push notification to ALL registered devices of a specific user
   */
  sendPushToUser: async (userId, payload) => {
    if (!userId) return { total: 0, sent: 0 };

    let userSubs = [];

    if (isMongoActive() && mongoose.isValidObjectId(userId)) {
      try {
        // 1. Get from PushSubscription collection
        const dbSubs = await PushSubscription.find({ userId, isActive: true }).lean();
        userSubs = [...dbSubs];

        // 2. Also check User model pushSubscriptions
        const user = await User.findById(userId).lean();
        if (user) {
          if (Array.isArray(user.pushSubscriptions)) {
            for (const s of user.pushSubscriptions) {
              if (s?.endpoint && !userSubs.some((item) => item.endpoint === s.endpoint)) {
                userSubs.push(s);
              }
            }
          }
          if (user.pushSubscription?.endpoint && !userSubs.some((item) => item.endpoint === user.pushSubscription.endpoint)) {
            userSubs.push(user.pushSubscription);
          }
        }
      } catch (e) {
        console.warn(`[WebPush] Error fetching user subscriptions for ${userId}:`, e.message);
      }
    }

    if (userSubs.length === 0) {
      console.log(`[WebPush] No device push subscriptions found for user ${userId}.`);
      return { total: 0, sent: 0 };
    }

    let sent = 0;
    const payloadWithUser =
      typeof payload === 'object' && payload !== null
        ? { ...payload, userId: String(userId) }
        : payload;

    for (const sub of userSubs) {
      const res = await pushService.sendPushToSubscription(sub, payloadWithUser);
      if (res.success) sent++;
    }

    console.log(`[WebPush] Dispatched alarm push to ${sent}/${userSubs.length} device(s) of user ${userId}`);
    return { total: userSubs.length, sent };
  },

  /**
   * Broadcast high-urgency alarm Web Push to all devices in the system
   * NOTE: NEVER use for private user reminders! Only for system-wide alerts.
   */
  sendPushToAll: async (payload) => {
    console.warn('[WebPush] Notice: sendPushToAll invoked. Ensure this is a system-wide broadcast, not a private reminder.');
    const allSubs = [];
    const seenEndpoints = new Set();

    // 1. Load from MongoDB
    if (isMongoActive()) {
      try {
        const dbSubs = await PushSubscription.find({ isActive: true }).lean();
        for (const s of dbSubs) {
          if (s?.endpoint && !seenEndpoints.has(s.endpoint)) {
            seenEndpoints.add(s.endpoint);
            allSubs.push(s);
          }
        }
      } catch (e) {}
    }

    // 2. Merge with file subscriptions
    const fileSubs = getFileSubscriptions();
    for (const s of fileSubs) {
      if (s?.endpoint && !seenEndpoints.has(s.endpoint)) {
        seenEndpoints.add(s.endpoint);
        allSubs.push(s);
      }
    }

    if (allSubs.length === 0) {
      console.log('[WebPush] No active push subscriptions found across all devices.');
      return { total: 0, sent: 0 };
    }

    let sent = 0;
    for (const sub of allSubs) {
      const res = await pushService.sendPushToSubscription(sub, payload);
      if (res.success) sent++;
    }

    console.log(`[WebPush] Sent high-urgency alarm to ${sent}/${allSubs.length} device(s)`);
    return { total: allSubs.length, sent };
  },

  getSubscriptions: async (userId = null) => {
    if (isMongoActive()) {
      try {
        const query = { isActive: true };
        if (userId) query.userId = userId;
        return await PushSubscription.find(query).lean();
      } catch (e) {}
    }
    return getFileSubscriptions();
  },
};
