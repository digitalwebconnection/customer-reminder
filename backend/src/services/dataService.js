import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import Reminder from '../models/Reminder.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');
const STORE_FILE = path.join(DATA_DIR, 'reminders.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readStore() {
  try {
    if (!fs.existsSync(STORE_FILE)) {
      fs.writeFileSync(STORE_FILE, JSON.stringify([], null, 2), 'utf-8');
      return [];
    }
    const data = fs.readFileSync(STORE_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
}

function writeStore(data) {
  try {
    fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Store Write Error]:', err);
  }
}

const isMongoActive = () => mongoose.connection.readyState === 1;

export const dataService = {
  createReminder: async (data) => {
    const payload = {
      name: data.name,
      phone: data.phone,
      email: data.email || '',
      address: data.address || '',
      note: data.note || '',
      dueAt: new Date(data.dueAt),
      timezone: data.timezone || 'Australia/Sydney',
      status: 'pending',
      emailSentAt: null,
      notifiedAt: null,
    };

    if (isMongoActive()) {
      return await Reminder.create(payload);
    } else {
      const store = readStore();
      const newReminder = {
        _id: 'rem_' + Date.now(),
        ...payload,
        dueAt: payload.dueAt.toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      store.unshift(newReminder);
      writeStore(store);
      return newReminder;
    }
  },

  getReminders: async ({ status, search } = {}) => {
    const now = new Date();

    if (isMongoActive()) {
      let query = {};
      if (status === 'pending') {
        query.status = 'pending';
      } else if (status === 'completed') {
        query.status = 'completed';
      } else if (status === 'overdue') {
        query.status = 'pending';
        query.dueAt = { $lt: now };
      }

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { address: { $regex: search, $options: 'i' } },
        ];
      }

      const list = await Reminder.find(query).sort({ dueAt: 1 }).lean();
      return list.map((r) => ({
        ...r,
        isOverdue: r.status === 'pending' && new Date(r.dueAt) < now,
      }));
    } else {
      const store = readStore();
      let list = store.map((r) => ({
        ...r,
        isOverdue: r.status === 'pending' && new Date(r.dueAt) < now,
      }));

      if (status === 'pending') {
        list = list.filter((r) => r.status === 'pending');
      } else if (status === 'completed') {
        list = list.filter((r) => r.status === 'completed');
      } else if (status === 'overdue') {
        list = list.filter((r) => r.isOverdue);
      }

      if (search) {
        const s = search.toLowerCase();
        list = list.filter(
          (r) =>
            r.name.toLowerCase().includes(s) ||
            r.phone.toLowerCase().includes(s) ||
            (r.email && r.email.toLowerCase().includes(s)) ||
            (r.address && r.address.toLowerCase().includes(s))
        );
      }

      return list.sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt));
    }
  },

  getReminderById: async (id) => {
    if (isMongoActive() && mongoose.isValidObjectId(id)) {
      return await Reminder.findById(id);
    }
    const store = readStore();
    return store.find((r) => r._id === id) || null;
  },

  updateReminder: async (id, updates) => {
    if (updates.dueAt) {
      updates.dueAt = new Date(updates.dueAt);
      // If due date was updated and pushed forward, reset emailSentAt so it can alert again at the new time
      if (updates.dueAt > new Date()) {
        updates.emailSentAt = null;
        updates.notifiedAt = null;
      }
    }

    if (isMongoActive() && mongoose.isValidObjectId(id)) {
      return await Reminder.findByIdAndUpdate(id, updates, { returnDocument: 'after' });
    }

    const store = readStore();
    const idx = store.findIndex((r) => r._id === id);
    if (idx === -1) return null;
    store[idx] = {
      ...store[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    writeStore(store);
    return store[idx];
  },

  deleteReminder: async (id) => {
    if (isMongoActive() && mongoose.isValidObjectId(id)) {
      return await Reminder.findByIdAndDelete(id);
    }
    const store = readStore();
    const filtered = store.filter((r) => r._id !== id);
    writeStore(filtered);
    return { success: true };
  },

  // Worker helpers
  getDuePendingReminders: async () => {
    const now = new Date();
    if (isMongoActive()) {
      return await Reminder.find({
        status: 'pending',
        dueAt: { $lte: now },
        emailSentAt: null,
      }).sort({ dueAt: 1 });
    }
    const store = readStore();
    return store.filter(
      (r) => r.status === 'pending' && new Date(r.dueAt) <= now && !r.emailSentAt
    );
  },

  markEmailSent: async (id) => {
    const now = new Date();
    if (isMongoActive() && mongoose.isValidObjectId(id)) {
      return await Reminder.findByIdAndUpdate(id, { emailSentAt: now }, { returnDocument: 'after' });
    }
    const store = readStore();
    const idx = store.findIndex((r) => r._id === id);
    if (idx !== -1) {
      store[idx].emailSentAt = now.toISOString();
      writeStore(store);
    }
  },

  markNotified: async (id) => {
    const now = new Date();
    if (isMongoActive() && mongoose.isValidObjectId(id)) {
      return await Reminder.findByIdAndUpdate(id, { notifiedAt: now }, { returnDocument: 'after' });
    }
    const store = readStore();
    const idx = store.findIndex((r) => r._id === id);
    if (idx !== -1) {
      store[idx].notifiedAt = now.toISOString();
      writeStore(store);
    }
  },
};
