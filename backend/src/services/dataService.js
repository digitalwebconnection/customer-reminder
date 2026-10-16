import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import Customer from '../models/Customer.js';
import Reminder from '../models/Reminder.js';
import CallLog from '../models/CallLog.js';
import User from '../models/User.js';
import { getDayBoundariesInTimezone, DEFAULT_AUSTRALIAN_TIMEZONE } from '../utils/timezones.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');
const STORE_FILE = path.join(DATA_DIR, 'store.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial seed data with Australian context
const DEFAULT_STORE = {
  settings: {
    timezone: 'Australia/Sydney',
    emailNotificationsEnabled: true,
    browserNotificationsEnabled: true,
  },
  customers: [
    {
      _id: 'cust_01',
      ownerId: 'owner_01',
      name: 'Liam Hemsworth',
      phone: '+61 412 345 678',
      email: 'liam.h@sydneytech.com.au',
      company: 'Sydney Tech Solutions',
      notes: 'Interested in enterprise phone follow-up system. Call back on Monday.',
      isArchived: false,
      createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    },
    {
      _id: 'cust_02',
      ownerId: 'owner_01',
      name: 'Chloe Zhang',
      phone: '+61 423 987 654',
      email: 'chloe@melbourneretail.com.au',
      company: 'Melbourne Retail Hub',
      notes: 'Met at Melbourne Expo. Wants demo of quote workflow.',
      isArchived: false,
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
    {
      _id: 'cust_03',
      ownerId: 'owner_01',
      name: 'Oliver Vance',
      phone: '+61 433 112 233',
      email: 'oliver@brisbanesolar.com.au',
      company: 'Brisbane Solar Energy',
      notes: 'Requested quotation for 5 users.',
      isArchived: false,
      createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    },
  ],
  reminders: [
    {
      _id: 'rem_01',
      ownerId: 'owner_01',
      customerId: 'cust_01',
      title: 'Discuss commercial proposal',
      dueAt: new Date(Date.now() + 15 * 60000).toISOString(), // 15 mins ahead (Due Today)
      timezone: 'Australia/Sydney',
      status: 'pending',
      priority: 'high',
      notes: 'Review 3-tier pricing and implementation timeline.',
      completedAt: null,
      completedOutcome: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      _id: 'rem_02',
      ownerId: 'owner_01',
      customerId: 'cust_02',
      title: 'Follow-up on quote response',
      dueAt: new Date(Date.now() - 2 * 3600000).toISOString(), // 2 hours ago (Overdue)
      timezone: 'Australia/Melbourne',
      status: 'pending',
      priority: 'normal',
      notes: 'Ask if Chloe had a chance to review the terms.',
      completedAt: null,
      completedOutcome: null,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      _id: 'rem_03',
      ownerId: 'owner_01',
      customerId: 'cust_03',
      title: 'Initial intake discovery call',
      dueAt: new Date(Date.now() - 86400000).toISOString(),
      timezone: 'Australia/Brisbane',
      status: 'completed',
      priority: 'normal',
      notes: 'Customer answered promptly and confirmed budget.',
      completedAt: new Date(Date.now() - 86400000).toISOString(),
      completedOutcome: 'answered',
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 86400000).toISOString(),
    },
  ],
  callLogs: [
    {
      _id: 'call_01',
      ownerId: 'owner_01',
      customerId: 'cust_03',
      reminderId: 'rem_03',
      calledAt: new Date(Date.now() - 86400000).toISOString(),
      outcome: 'answered',
      notes: 'Spoke with Oliver. He is happy to proceed once quote arrives.',
      nextReminderId: null,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
  ],
};

function readStore() {
  try {
    if (!fs.existsSync(STORE_FILE)) {
      fs.writeFileSync(STORE_FILE, JSON.stringify(DEFAULT_STORE, null, 2), 'utf-8');
      return DEFAULT_STORE;
    }
    const data = fs.readFileSync(STORE_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('[Store Read Error]:', err);
    return DEFAULT_STORE;
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
  // Settings
  getSettings: async () => {
    const store = readStore();
    return store.settings || { timezone: DEFAULT_AUSTRALIAN_TIMEZONE };
  },

  updateSettings: async (updates) => {
    const store = readStore();
    store.settings = { ...store.settings, ...updates };
    writeStore(store);
    return store.settings;
  },

  // Customers
  getCustomers: async (search = '', page = 1, limit = 50) => {
    if (isMongoActive()) {
      const query = { isArchived: false };
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
          { company: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ];
      }
      return await Customer.find(query).sort({ createdAt: -1 }).limit(limit);
    } else {
      const store = readStore();
      let list = store.customers.filter((c) => !c.isArchived);
      if (search) {
        const s = search.toLowerCase();
        list = list.filter(
          (c) =>
            c.name.toLowerCase().includes(s) ||
            c.phone.toLowerCase().includes(s) ||
            (c.company && c.company.toLowerCase().includes(s)) ||
            (c.email && c.email.toLowerCase().includes(s))
        );
      }
      return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
  },

  getCustomerById: async (id) => {
    if (isMongoActive() && mongoose.isValidObjectId(id)) {
      return await Customer.findById(id);
    }
    const store = readStore();
    return store.customers.find((c) => c._id === id) || null;
  },

  createCustomer: async (customerData) => {
    if (isMongoActive()) {
      return await Customer.create(customerData);
    }
    const store = readStore();
    const newCustomer = {
      _id: 'cust_' + Date.now(),
      ownerId: customerData.ownerId || 'owner_01',
      name: customerData.name,
      phone: customerData.phone,
      email: customerData.email || '',
      company: customerData.company || '',
      notes: customerData.notes || '',
      isArchived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.customers.unshift(newCustomer);
    writeStore(store);
    return newCustomer;
  },

  updateCustomer: async (id, updates) => {
    if (isMongoActive() && mongoose.isValidObjectId(id)) {
      return await Customer.findByIdAndUpdate(id, updates, { new: true });
    }
    const store = readStore();
    const idx = store.customers.findIndex((c) => c._id === id);
    if (idx === -1) return null;
    store.customers[idx] = {
      ...store.customers[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    writeStore(store);
    return store.customers[idx];
  },

  archiveCustomer: async (id) => {
    return dataService.updateCustomer(id, { isArchived: true });
  },

  // Reminders
  getReminders: async (filter = 'all', timezone = DEFAULT_AUSTRALIAN_TIMEZONE) => {
    const now = new Date();
    const { startOfDay, endOfDay } = getDayBoundariesInTimezone(timezone, now);

    let list = [];
    if (isMongoActive()) {
      let query = {};
      if (filter === 'pending') query = { status: 'pending' };
      else if (filter === 'overdue') query = { status: 'pending', dueAt: { $lt: now } };
      else if (filter === 'today') query = { status: 'pending', dueAt: { $gte: startOfDay, $lte: endOfDay } };
      else if (filter === 'upcoming') query = { status: 'pending', dueAt: { $gt: now } };
      else if (filter === 'completed') query = { status: 'completed' };

      list = await Reminder.find(query).populate('customerId').sort({ dueAt: 1 }).lean();
      return list.map((r) => ({
        ...r,
        customer: r.customerId,
        isOverdue: r.status === 'pending' && new Date(r.dueAt) < now,
      }));
    } else {
      const store = readStore();
      list = store.reminders.map((r) => {
        const customer = store.customers.find((c) => c._id === r.customerId) || null;
        const due = new Date(r.dueAt);
        const isOverdue = r.status === 'pending' && due < now;
        const isToday = r.status === 'pending' && due >= startOfDay && due <= endOfDay;
        const isUpcoming = r.status === 'pending' && due > now;

        return {
          ...r,
          customer,
          isOverdue,
          isToday,
          isUpcoming,
        };
      });

      if (filter === 'overdue') list = list.filter((r) => r.isOverdue);
      else if (filter === 'today') list = list.filter((r) => r.isToday);
      else if (filter === 'upcoming') list = list.filter((r) => r.isUpcoming);
      else if (filter === 'completed') list = list.filter((r) => r.status === 'completed');
      else if (filter === 'pending') list = list.filter((r) => r.status === 'pending');

      return list.sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt));
    }
  },

  getReminderById: async (id) => {
    if (isMongoActive() && mongoose.isValidObjectId(id)) {
      return await Reminder.findById(id).populate('customerId');
    }
    const store = readStore();
    const rem = store.reminders.find((r) => r._id === id);
    if (!rem) return null;
    const customer = store.customers.find((c) => c._id === rem.customerId);
    return { ...rem, customer };
  },

  createReminder: async (reminderData) => {
    if (isMongoActive()) {
      const created = await Reminder.create(reminderData);
      return await Reminder.findById(created._id).populate('customerId');
    }
    const store = readStore();
    const newReminder = {
      _id: 'rem_' + Date.now(),
      ownerId: reminderData.ownerId || 'owner_01',
      customerId: reminderData.customerId,
      title: reminderData.title || 'Follow-up call',
      dueAt: new Date(reminderData.dueAt).toISOString(),
      timezone: reminderData.timezone || DEFAULT_AUSTRALIAN_TIMEZONE,
      status: 'pending',
      priority: reminderData.priority || 'normal',
      notes: reminderData.notes || '',
      completedAt: null,
      completedOutcome: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.reminders.push(newReminder);
    writeStore(store);
    const customer = store.customers.find((c) => c._id === newReminder.customerId);
    return { ...newReminder, customer };
  },

  completeReminder: async (id, { outcome, notes, nextReminderDueAt, nextReminderTitle, nextReminderNotes }) => {
    const now = new Date();
    const store = readStore();

    // 1. Mark reminder completed
    let reminder = null;
    if (isMongoActive() && mongoose.isValidObjectId(id)) {
      reminder = await Reminder.findByIdAndUpdate(
        id,
        {
          status: 'completed',
          completedAt: now,
          completedOutcome: outcome,
          notes: notes ? notes : undefined,
        },
        { new: true }
      ).populate('customerId');
    } else {
      const idx = store.reminders.findIndex((r) => r._id === id);
      if (idx !== -1) {
        store.reminders[idx].status = 'completed';
        store.reminders[idx].completedAt = now.toISOString();
        store.reminders[idx].completedOutcome = outcome;
        if (notes) store.reminders[idx].notes = notes;
        reminder = store.reminders[idx];
      }
    }

    if (!reminder) return null;

    // 2. Schedule next reminder if requested
    let nextReminder = null;
    if (nextReminderDueAt) {
      nextReminder = await dataService.createReminder({
        customerId: reminder.customerId?._id || reminder.customerId,
        title: nextReminderTitle || `Follow-up after ${outcome}`,
        dueAt: nextReminderDueAt,
        timezone: reminder.timezone || DEFAULT_AUSTRALIAN_TIMEZONE,
        priority: 'normal',
        notes: nextReminderNotes || '',
      });
    }

    // 3. Create call log entry
    const callLogData = {
      ownerId: reminder.ownerId,
      customerId: reminder.customerId?._id || reminder.customerId,
      reminderId: reminder._id,
      calledAt: now,
      outcome: outcome || 'answered',
      notes: notes || '',
      nextReminderId: nextReminder ? nextReminder._id : null,
    };

    let callLog = null;
    if (isMongoActive()) {
      callLog = await CallLog.create(callLogData);
    } else {
      callLog = {
        _id: 'call_' + Date.now(),
        ...callLogData,
        calledAt: now.toISOString(),
        createdAt: now.toISOString(),
      };
      store.callLogs.unshift(callLog);
      writeStore(store);
    }

    return { reminder, nextReminder, callLog };
  },

  snoozeReminder: async (id, minutesOrIso) => {
    let newDue = null;
    if (typeof minutesOrIso === 'number') {
      newDue = new Date(Date.now() + minutesOrIso * 60000);
    } else {
      newDue = new Date(minutesOrIso);
    }

    if (isMongoActive() && mongoose.isValidObjectId(id)) {
      return await Reminder.findByIdAndUpdate(
        id,
        { dueAt: newDue, status: 'pending', updatedAt: new Date() },
        { new: true }
      ).populate('customerId');
    }
    const store = readStore();
    const idx = store.reminders.findIndex((r) => r._id === id);
    if (idx === -1) return null;
    store.reminders[idx].dueAt = newDue.toISOString();
    store.reminders[idx].status = 'pending';
    store.reminders[idx].updatedAt = new Date().toISOString();
    writeStore(store);
    const customer = store.customers.find((c) => c._id === store.reminders[idx].customerId);
    return { ...store.reminders[idx], customer };
  },

  cancelReminder: async (id) => {
    if (isMongoActive() && mongoose.isValidObjectId(id)) {
      return await Reminder.findByIdAndUpdate(id, { status: 'cancelled' }, { new: true });
    }
    const store = readStore();
    const idx = store.reminders.findIndex((r) => r._id === id);
    if (idx === -1) return null;
    store.reminders[idx].status = 'cancelled';
    writeStore(store);
    return store.reminders[idx];
  },

  // Call Logs for Customer
  getCustomerCallLogs: async (customerId) => {
    if (isMongoActive() && mongoose.isValidObjectId(customerId)) {
      return await CallLog.find({ customerId }).sort({ calledAt: -1 }).populate('nextReminderId');
    }
    const store = readStore();
    return store.callLogs
      .filter((c) => c.customerId === customerId)
      .sort((a, b) => new Date(b.calledAt) - new Date(a.calledAt));
  },

  // Dashboard Metrics
  getDashboardSummary: async (timezone = DEFAULT_AUSTRALIAN_TIMEZONE) => {
    const now = new Date();
    const { startOfDay, endOfDay } = getDayBoundariesInTimezone(timezone, now);

    const customers = await dataService.getCustomers();
    const allReminders = await dataService.getReminders('all', timezone);

    const pending = allReminders.filter((r) => r.status === 'pending');
    const dueToday = pending.filter((r) => {
      const d = new Date(r.dueAt);
      return d >= startOfDay && d <= endOfDay;
    });
    const overdue = pending.filter((r) => new Date(r.dueAt) < now);
    const upcoming = pending.filter((r) => new Date(r.dueAt) > now);
    const completed = allReminders.filter((r) => r.status === 'completed');

    return {
      timezone,
      currentServerTime: now.toISOString(),
      totalCustomers: customers.length,
      dueTodayCount: dueToday.length,
      overdueCount: overdue.length,
      upcomingCount: upcoming.length,
      completedCount: completed.length,
      dueToday,
      overdue,
      upcoming: upcoming.slice(0, 5),
      recentlyCompleted: completed.slice(-5).reverse(),
    };
  },
};
