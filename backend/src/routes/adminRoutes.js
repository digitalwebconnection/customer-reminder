import express from 'express';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Reminder from '../models/Reminder.js';
import ActivityLog from '../models/ActivityLog.js';
import { auth, requireSuperAdmin } from '../middleware/auth.js';
import { dataService } from '../services/dataService.js';
import { logActivity } from './authRoutes.js';
import { createTransporter } from '../services/emailService.js';
import crypto from 'crypto';

const router = express.Router();

// All admin routes require auth + superadmin role
router.use(auth);
router.use(requireSuperAdmin);

// ==========================================
// DASHBOARD STATS
// ==========================================

// GET /admin/dashboard - Admin dashboard statistics
router.get('/dashboard', async (req, res, next) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      activeUsers,
      blockedUsers,
      totalReminders,
      pendingReminders,
      completedReminders,
      overdueReminders,
      totalCustomers,
      recentSignups,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ isActive: false }),
      Reminder.countDocuments(),
      Reminder.countDocuments({ status: 'pending' }),
      Reminder.countDocuments({ status: 'completed' }),
      Reminder.countDocuments({ status: 'pending', dueAt: { $lt: now } }),
      // Unique customer names across all reminders
      Reminder.distinct('phone').then((phones) => phones.length),
      User.find({ createdAt: { $gte: sevenDaysAgo } })
        .select('name email role createdAt isActive')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        blockedUsers,
        totalReminders,
        pendingReminders,
        completedReminders,
        overdueReminders,
        totalCustomers,
        recentSignups,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// USERS MANAGEMENT
// ==========================================

// GET /admin/users - List all users with pagination, search, filter
router.get('/users', async (req, res, next) => {
  try {
    const { search, status, role, page = 1, limit = 20, sort = 'latest' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    let query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }
    if (status === 'active') query.isActive = true;
    else if (status === 'blocked') query.isActive = false;
    if (role) query.role = role;

    let sortOptions = { createdAt: -1 };
    if (sort === 'oldest') sortOptions = { createdAt: 1 };
    else if (sort === 'name') sortOptions = { name: 1 };

    const [users, total] = await Promise.all([
      User.find(query).sort(sortOptions).skip(skip).limit(Number(limit)).lean(),
      User.countDocuments(query),
    ]);

    // Robust reminder counts matching both ObjectId and string representation, plus legacy ownerId
    const userObjectIds = users
      .filter((u) => u._id && mongoose.Types.ObjectId.isValid(u._id))
      .map((u) => new mongoose.Types.ObjectId(u._id));
    const userStringIds = users.map((u) => (u._id ? u._id.toString() : ''));
    const allUserIds = [...userObjectIds, ...userStringIds].filter(Boolean);

    let countMap = {};
    if (allUserIds.length > 0) {
      try {
        const reminderCounts = await Reminder.aggregate([
          {
            $match: {
              $or: [
                { userId: { $in: allUserIds } },
                { ownerId: { $in: allUserIds } },
              ],
            },
          },
          {
            $group: {
              _id: { $toString: { $ifNull: ['$userId', '$ownerId'] } },
              count: { $sum: 1 },
            },
          },
        ]);
        reminderCounts.forEach((r) => {
          if (r._id) countMap[r._id] = r.count;
        });
      } catch (aggErr) {
        console.warn('[AdminUsers] Reminder count aggregation error:', aggErr.message);
      }
    }

    const enrichedUsers = users.map((u) => ({
      ...u,
      reminderCount: countMap[u._id ? u._id.toString() : ''] || 0,
    }));

    res.json({
      success: true,
      data: enrichedUsers,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    next(err);
  }
});

// GET /admin/users/:id - Get single user detail with their data
router.get('/users/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }

    const user = await User.findById(req.params.id).lean();
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const userObjectId = new mongoose.Types.ObjectId(user._id);
    const userStringId = user._id.toString();
    const userMatchFilter = {
      $or: [
        { userId: userObjectId },
        { userId: userStringId },
        { ownerId: userObjectId },
        { ownerId: userStringId },
      ],
    };

    const [reminders, reminderStats] = await Promise.all([
      Reminder.find(userMatchFilter).sort({ createdAt: -1 }).limit(100).lean(),
      Reminder.aggregate([
        { $match: userMatchFilter },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
            completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          },
        },
      ]),
    ]);

    const now = new Date();
    const enrichedReminders = reminders.map((r) => ({
      ...r,
      isOverdue: r.status === 'pending' && new Date(r.dueAt) < now,
    }));

    res.json({
      success: true,
      data: {
        user,
        reminders: enrichedReminders,
        stats: reminderStats[0] || { total: 0, pending: 0, completed: 0 },
      },
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /admin/users/:id - Update user details (name, phone)
router.patch('/users/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }

    const { name, phone } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (name !== undefined) user.name = name.trim();
    if (phone !== undefined) user.phone = phone.trim();
    await user.save();

    await logActivity(
      req.user.id,
      'user_updated',
      `Admin updated user profile: ${user.email} (Name: ${user.name}, Phone: ${user.phone})`,
      req,
      user._id
    );

    res.json({
      success: true,
      message: 'User profile updated successfully',
      data: user,
    });
  } catch (err) {
    next(err);
  }
});

// POST /admin/users/:id/reminders - Create a reminder directly for this user
router.post('/users/:id/reminders', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }

    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { name, phone, email, address, note, dueAt, timezone } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Customer name is required' });
    }
    if (!phone || !phone.trim()) {
      return res.status(400).json({ success: false, message: 'Customer phone is required' });
    }
    if (!dueAt) {
      return res.status(400).json({ success: false, message: 'Due date is required' });
    }

    const reminder = await dataService.createReminder({
      name: name.trim(),
      phone: phone.trim(),
      email: email ? email.trim() : '',
      address: address ? address.trim() : '',
      note: note ? note.trim() : '',
      dueAt,
      timezone: timezone || 'Asia/Kolkata',
      userId: targetUser._id,
    });

    res.status(201).json({
      success: true,
      message: 'Reminder created for user',
      data: reminder,
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /admin/users/:id/block - Block/Unblock user
router.patch('/users/:id/block', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (user.role === 'superadmin') {
      return res.status(403).json({ success: false, message: 'Cannot block the super admin account' });
    }

    user.isActive = !user.isActive;
    await user.save();

    const action = user.isActive ? 'user_unblocked' : 'user_blocked';
    await logActivity(req.user.id, action, `${action}: ${user.email}`, req, user._id);

    res.json({
      success: true,
      message: `User ${user.isActive ? 'unblocked' : 'blocked'} successfully`,
      data: { isActive: user.isActive },
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /admin/users/:id - Delete user and all their data
router.delete('/users/:id', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (user.role === 'superadmin') {
      return res.status(403).json({ success: false, message: 'Cannot delete the super admin account' });
    }

    // Delete all user's reminders
    await Reminder.deleteMany({ userId: user._id });
    // Delete user's activity logs
    await ActivityLog.deleteMany({ userId: user._id });
    // Delete user
    await User.findByIdAndDelete(user._id);

    await logActivity(req.user.id, 'user_deleted', `Deleted user: ${user.email}`, req, user._id);

    res.json({ success: true, message: `User "${user.name}" and all their data deleted successfully` });
  } catch (err) {
    next(err);
  }
});

// POST /admin/users/:id/reset-password - Admin reset user password
router.post('/users/:id/reset-password', async (req, res, next) => {
  try {
    const { newPassword } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (newPassword) {
      // Direct password reset by admin
      if (newPassword.length < 6) {
        return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
      }
      user.passwordHash = await User.hashPassword(newPassword);
      await user.save();
      await logActivity(req.user.id, 'admin_password_reset', `Admin reset password for: ${user.email}`, req, user._id);
      return res.json({ success: true, message: `Password reset successfully for ${user.email}` });
    }

    // Send password reset email link
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    await User.findByIdAndUpdate(user._id, {
      resetPasswordToken: resetTokenHash,
      resetPasswordExpires: new Date(Date.now() + 60 * 60 * 1000),
    });

    const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').split(',')[0].trim();
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

    const transporter = createTransporter();
    if (transporter) {
      const emailFrom = process.env.EMAIL_FROM || `"Customer Reminder" <${process.env.SMTP_USER}>`;
      await transporter.sendMail({
        from: emailFrom,
        to: user.email,
        subject: '🔑 Password Reset - RemindIQ (Admin Request)',
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
            <div style="background: #4f46e5; padding: 20px 24px; color: #ffffff;">
              <h2 style="margin: 0;">Password Reset (Admin Request)</h2>
            </div>
            <div style="padding: 24px;">
              <p style="color: #334155;">Hi ${user.name},</p>
              <p style="color: #334155;">An administrator has requested a password reset for your account. Click below to set a new password:</p>
              <div style="text-align: center; margin: 24px 0;">
                <a href="${resetUrl}" style="display: inline-block; background: #4f46e5; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 600;">Reset Password</a>
              </div>
              <p style="color: #94a3b8; font-size: 13px;">This link expires in 1 hour.</p>
            </div>
          </div>
        `,
      });
    }

    await logActivity(req.user.id, 'admin_password_reset', `Admin sent reset email to: ${user.email}`, req, user._id);

    res.json({ success: true, message: `Password reset link sent to ${user.email}` });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// GLOBAL DATA VIEWS
// ==========================================

// GET /admin/reminders - All reminders across all users
router.get('/reminders', async (req, res, next) => {
  try {
    const { status, search, sort, page = 1, limit = 10 } = req.query;
    const result = await dataService.getAllReminders({
      status,
      search,
      sort,
      page: Number(page),
      limit: Number(limit),
    });
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

// GET /admin/users/:id/reminders - Get specific user's reminders
router.get('/users/:id/reminders', async (req, res, next) => {
  try {
    const { status, search, sort } = req.query;
    const reminders = await dataService.getUserReminders(req.params.id, { status, search, sort });
    res.json({ success: true, data: reminders });
  } catch (err) {
    next(err);
  }
});

// Admin can edit/delete any reminder
router.patch('/reminders/:id', async (req, res, next) => {
  try {
    // Admin bypass: no userId filter
    const updated = await dataService.updateReminder(req.params.id, req.body, null);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Reminder not found' });
    }
    res.json({ success: true, message: 'Reminder updated', data: updated });
  } catch (err) {
    next(err);
  }
});

router.delete('/reminders/:id', async (req, res, next) => {
  try {
    const deleted = await dataService.deleteReminder(req.params.id, null);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Reminder not found' });
    }
    res.json({ success: true, message: 'Reminder deleted' });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// ACTIVITY LOG
// ==========================================

// GET /admin/activity or /admin/activity-logs - Activity log
router.get(['/activity', '/activity-logs'], async (req, res, next) => {
  try {
    const { action, userId, page = 1, limit = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    let query = {};
    if (action) query.action = action;
    if (userId && mongoose.isValidObjectId(userId)) query.userId = userId;

    const [logs, total] = await Promise.all([
      ActivityLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('userId', 'name email')
        .populate('targetUserId', 'name email')
        .lean(),
      ActivityLog.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: logs,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
