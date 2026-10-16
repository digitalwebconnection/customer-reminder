import express from 'express';
import { dataService } from '../services/dataService.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Apply auth to all reminder endpoints
router.use(auth);

// GET /reminders - List reminders with filters (all, pending, completed, overdue) and search
router.get('/', async (req, res, next) => {
  try {
    const { status, search } = req.query;
    const reminders = await dataService.getReminders({ status, search });
    res.json({ success: true, data: reminders });
  } catch (err) {
    next(err);
  }
});

// POST /reminders - Create a new reminder
router.post('/', async (req, res, next) => {
  try {
    const { name, phone, email, address, note, dueAt, timezone } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }
    if (!phone || !phone.trim()) {
      return res.status(400).json({ success: false, message: 'Phone number is required' });
    }
    if (!dueAt) {
      return res.status(400).json({ success: false, message: 'Due date and time are required' });
    }

    const reminder = await dataService.createReminder({
      name: name.trim(),
      phone: phone.trim(),
      email: email ? email.trim() : '',
      address: address ? address.trim() : '',
      note: note ? note.trim() : '',
      dueAt,
      timezone: timezone || 'Australia/Sydney',
    });

    res.status(201).json({ success: true, message: 'Reminder created successfully', data: reminder });
  } catch (err) {
    next(err);
  }
});

// GET /reminders/:id - Get single reminder
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

// PATCH /reminders/:id - Update reminder or mark completed
router.patch('/:id', async (req, res, next) => {
  try {
    const updated = await dataService.updateReminder(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Reminder not found' });
    }
    res.json({ success: true, message: 'Reminder updated successfully', data: updated });
  } catch (err) {
    next(err);
  }
});

// DELETE /reminders/:id - Delete reminder
router.delete('/:id', async (req, res, next) => {
  try {
    const deleted = await dataService.deleteReminder(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Reminder not found' });
    }
    res.json({ success: true, message: 'Reminder deleted successfully' });
  } catch (err) {
    next(err);
  }
});

export default router;
