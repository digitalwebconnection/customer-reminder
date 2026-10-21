import express from 'express';
import { dataService } from '../services/dataService.js';
import { auth } from '../middleware/auth.js';
import { desktopNotificationService } from '../services/desktopNotificationService.js';
import { validateEmail, validatePhone } from '../utils/validation.js';

const router = express.Router();

// Apply auth to all reminder endpoints
router.use(auth);

// GET /reminders - List reminders with filters (all, pending, completed, overdue) and search
router.get('/', async (req, res, next) => {
  try {
    const { status, search, sort } = req.query;
    const userId = req.user.id; // From JWT
    const reminders = await dataService.getReminders({ status, search, sort, userId });
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
      return res.status(400).json({ success: false, message: 'Customer name is required' });
    }

    const phoneCheck = validatePhone(phone, timezone === 'Asia/Kolkata' ? 'India' : 'Australia', true);
    if (!phoneCheck.isValid) {
      return res.status(400).json({ success: false, message: phoneCheck.error });
    }

    if (email && email.trim()) {
      const emailCheck = validateEmail(email, false);
      if (!emailCheck.isValid) {
        return res.status(400).json({ success: false, message: emailCheck.error });
      }
    }

    if (!dueAt) {
      return res.status(400).json({ success: false, message: 'Due date and time are required' });
    }

    const userId = req.user.id; // From JWT
    const reminder = await dataService.createReminder({
      name: name.trim(),
      phone: phone.trim(),
      email: email ? email.trim() : '',
      address: address ? address.trim() : '',
      note: note ? note.trim() : '',
      dueAt,
      timezone: timezone || 'Asia/Kolkata',
      userId,
    });

    res.status(201).json({ success: true, message: 'Reminder created successfully', data: reminder });
  } catch (err) {
    next(err);
  }
});

// GET /reminders/:id - Get single reminder
router.get('/:id', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const reminder = await dataService.getReminderById(req.params.id, userId);
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
    const isPrivileged = req.user?.role === 'superadmin' || req.user?.role === 'admin';
    const userId = isPrivileged ? null : req.user.id;

    if (req.body.name !== undefined && !req.body.name.trim()) {
      return res.status(400).json({ success: false, message: 'Customer name cannot be empty' });
    }

    if (req.body.phone !== undefined) {
      const tz = req.body.timezone || 'Asia/Kolkata';
      const phoneCheck = validatePhone(req.body.phone, tz === 'Asia/Kolkata' ? 'India' : 'Australia', true);
      if (!phoneCheck.isValid) {
        return res.status(400).json({ success: false, message: phoneCheck.error });
      }
    }

    if (req.body.email !== undefined && req.body.email.trim()) {
      const emailCheck = validateEmail(req.body.email, false);
      if (!emailCheck.isValid) {
        return res.status(400).json({ success: false, message: emailCheck.error });
      }
    }

    const updated = await dataService.updateReminder(req.params.id, req.body, userId);
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
    const isPrivileged = req.user?.role === 'superadmin' || req.user?.role === 'admin';
    const userId = isPrivileged ? null : req.user.id;
    const deleted = await dataService.deleteReminder(req.params.id, userId);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Reminder not found' });
    }
    res.json({ success: true, message: 'Reminder deleted successfully' });
  } catch (err) {
    next(err);
  }
});

// POST /reminders/test-pc-alert - Trigger native Windows PC Toast notification
router.post('/test-pc-alert', (req, res) => {
  desktopNotificationService.sendTestToast();
  res.json({ success: true, message: 'Windows toast notification sent' });
});

export default router;
