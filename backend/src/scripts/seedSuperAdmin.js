/**
 * Seed Script - Create Super Admin Account
 * 
 * Usage: node src/scripts/seedSuperAdmin.js
 * 
 * Reads SUPERADMIN_EMAIL and SUPERADMIN_PASSWORD from .env
 * Creates (or upgrades) the single super admin account.
 */

import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import User from '../models/User.js';
import Reminder from '../models/Reminder.js';

const seedSuperAdmin = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/customer-reminder';
  const email = (process.env.SUPERADMIN_EMAIL || 'vaibhavdigitalwebconnection@gmail.com').toLowerCase();
  const password = process.env.SUPERADMIN_PASSWORD || 'Admin@123';

  console.log('[Seed] Connecting to MongoDB...');
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  console.log('[Seed] Connected to MongoDB');

  // Check if super admin already exists
  const existing = await User.findOne({ email });

  if (existing) {
    if (!existing.name) {
      existing.name = 'Super Admin';
    }
    if (existing.role === 'superadmin') {
      console.log(`[Seed] Super admin already exists: ${email}`);
      // Update password if needed
      existing.passwordHash = await User.hashPassword(password);
      existing.isActive = true;
      await existing.save();
      console.log(`[Seed] Password updated for: ${email}`);
    } else {
      // Upgrade existing user
      existing.role = 'superadmin';
      existing.passwordHash = await User.hashPassword(password);
      existing.isActive = true;
      await existing.save();
      console.log(`[Seed] Upgraded to super admin: ${email}`);
    }
  } else {
    // Create new super admin
    const hash = await User.hashPassword(password);
    await User.create({
      email,
      name: 'Super Admin',
      passwordHash: hash,
      role: 'superadmin',
      isActive: true,
    });
    console.log(`[Seed] Created super admin: ${email}`);
  }

  // Ensure authorized admins maintain superadmin role and unauthorized are downgraded
  const authorizedEmails = [email,  'vaibhavdigitalwebconnection@gmail.com'];
  await User.updateMany(
    { email: { $in: authorizedEmails } },
    { $set: { role: 'superadmin', isActive: true } }
  );
  const otherAdmins = await User.countDocuments({ role: 'superadmin', email: { $nin: authorizedEmails } });
  if (otherAdmins > 0) {
    await User.updateMany(
      { role: 'superadmin', email: { $nin: authorizedEmails } },
      { $set: { role: 'user' } }
    );
    console.log(`[Seed] Downgraded ${otherAdmins} unauthorized superadmin(s) to user role`);
  }

  // Migrate old 'owner' roles
  const ownerCount = await User.countDocuments({ role: 'owner' });
  if (ownerCount > 0) {
    await User.updateMany(
      { role: 'owner', email: { $ne: email } },
      { $set: { role: 'user' } }
    );
    await User.updateMany(
      { role: 'owner', email },
      { $set: { role: 'superadmin' } }
    );
    console.log(`[Seed] Migrated ${ownerCount} old 'owner' role(s)`);
  }

  // Migrate any legacy unassigned reminders to the primary standard user (superadmin does not own customer reminders)
  const primaryUser = await User.findOne({ role: 'user' }).sort({ createdAt: 1 });
  if (primaryUser) {
    const unassignedCount = await Reminder.countDocuments({
      $or: [{ userId: { $exists: false } }, { userId: null }],
    });
    if (unassignedCount > 0) {
      await Reminder.updateMany(
        { $or: [{ userId: { $exists: false } }, { userId: null }] },
        { $set: { userId: primaryUser._id } }
      );
      console.log(`[Seed] Migrated ${unassignedCount} legacy reminders to primary user (${primaryUser.email})`);
    }
  }

  console.log('[Seed] Done!');
  await mongoose.disconnect();
  process.exit(0);
};

seedSuperAdmin().catch((err) => {
  console.error('[Seed Error]', err);
  process.exit(1);
});
