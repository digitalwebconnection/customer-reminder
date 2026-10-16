import express from 'express';
import { dataService } from '../services/dataService.js';
import { DEFAULT_AUSTRALIAN_TIMEZONE } from '../utils/timezones.js';

const router = express.Router();

// List reminders with status/date filters
router.get('/', async (req, res, next) => {
  try {
    const { status, due, timezone = DEFAULT_AUSTRALIAN_TIMEZONE } = req.query;
    const filter = due || status || 'all';
    const reminders = await dataService.getReminders(filter, timezone);
    res.json({ success: true, data: reminders });
  } catch (err) {
    next(err);
  }
});

// Create reminder
router.post('/', async (req, res, next) => {
  try {
    const { customerId, title, dueAt, timezone, priority, notes } = req.body;
    if (!customerId || !dueAt) {
      return res.status(400).json({ success: false, message: 'Customer and Due Date are required' });
    }
    const reminder = await dataService.createReminder({
      customerId,
      title: title || 'Follow-up call',
      dueAt,
      timezone: timezone || DEFAULT_AUSTRALIAN_TIMEZONE,
      priority: priority || 'normal',
      notes: notes || '',
    });
    res.status(201).json({ success: true, data: reminder });
  } catch (err) {
    next(err);
  }
});

// Get single reminder
router.get('/:id', async (req, res, next) => {
  try {
    const reminder = await dataService.getReminderById(req.params.id);
    if (!reminder) {
      return res.status(404).json({ success: false, message: 'Reminder not found' });
    }
    res.json({ success: true, data: reminder });
  } catch (err) {
    next(err);
  }
});

// Complete reminder with outcome and optional next follow-up
router.post('/:id/complete', async (req, res, next) => {
  try {
    const { outcome, notes, nextReminderDueAt, nextReminderTitle, nextReminderNotes } = req.body;
    const result = await dataService.completeReminder(req.params.id, {
      outcome,
      notes,
      nextReminderDueAt,
      nextReminderTitle,
      nextReminderNotes,
    });
    if (!result) {
      return res.status(404).json({ success: false, message: 'Reminder not found' });
    }
    res.json({
      success: true,
      message: 'Reminder completed and call history logged',
      data: result,
    });
  } catch (err) {
    next(err);
  }
});

// Snooze reminder
router.post('/:id/snooze', async (req, res, next) => {
  try {
    const { minutes, dueAt } = req.body;
    const updated = await dataService.snoozeReminder(req.params.id, minutes || dueAt || 15);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Reminder not found' });
    }
    res.json({ success: true, message: 'Reminder rescheduled', data: updated });
  } catch (err) {
    next(err);
  }
});

// Cancel reminder
router.post('/:id/cancel', async (req, res, next) => {
  try {
    const updated = await dataService.cancelReminder(req.params.id);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Reminder not found' });
    }
    res.json({ success: true, message: 'Reminder cancelled', data: updated });
  } catch (err) {
    next(err);
  }
});

export default router;
