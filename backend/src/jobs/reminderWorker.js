import cron from 'node-cron';
import { dataService } from '../services/dataService.js';
import { sendReminderEmail, formatInTimezone } from '../services/emailService.js';
import { pushService } from '../services/pushService.js';
import { oneSignalService } from '../services/oneSignalService.js';
import { desktopNotificationService } from '../services/desktopNotificationService.js';
import User from '../models/User.js';

let isRunning = false;

export async function processDueReminders() {
  if (isRunning) return;
  isRunning = true;

  try {
    const dueReminders = await dataService.getDuePendingReminders();

    if (dueReminders.length > 0) {
      console.log(`[Worker] Found ${dueReminders.length} due reminder(s) to process.`);
    }

    for (const reminder of dueReminders) {
      try {
        const tz = reminder.timezone || 'Asia/Kolkata';
        const formattedTime = formatInTimezone(reminder.dueAt, tz);
        console.log(`[Worker] Processing reminder: "${reminder.name}" (${reminder.phone}) due at ${formattedTime}`);

        // Determine owner for user-specific alert delivery
        let ownerEmail = null;
        let ownerUserId = null;

        if (reminder.userId) {
          if (typeof reminder.userId === 'object') {
            ownerEmail = reminder.userId.email || null;
            ownerUserId = reminder.userId._id ? reminder.userId._id.toString() : null;
          } else {
            ownerUserId = reminder.userId.toString();
            try {
              const u = await User.findById(reminder.userId);
              ownerEmail = u?.email || null;
            } catch (e) {}
          }
        }

        // 1. High-Urgency Web Push Notification (ONLY to reminder owner's registered devices)
        const pushPayload = {
          title: `🚨 Call Reminder Alarm: ${reminder.name}`,
          body: `📞 Due Now: Call ${reminder.phone} (${formattedTime})${reminder.note ? `\nNote: ${reminder.note}` : ''}`,
          phone: reminder.phone,
          url: `/reminders?alertId=${reminder._id}`,
          reminderId: reminder._id.toString(),
          name: reminder.name,
          userId: ownerUserId || null,
          dueAt: reminder.dueAt,
          isAlarm: true,
          timestamp: Date.now(),
        };

        if (ownerUserId) {
          try {
            const userPushResult = await pushService.sendPushToUser(ownerUserId, pushPayload);
            if (userPushResult.sent > 0) {
              console.log(`[Worker] ✅ Mobile push alarm delivered to ${userPushResult.sent} device(s) of owner user ${ownerUserId}`);
            } else {
              console.log(`[Worker] Notice: Owner user ${ownerUserId} has no active push device subscriptions. Alert skipped for other users (privacy preserved).`);
            }
          } catch (pushErr) {
            console.error('[Worker Error] Push notification failure:', pushErr.message);
          }
        } else {
          console.log(`[Worker] Notice: Reminder ${reminder._id} has no owner user ID. Alert skipped for other users (privacy preserved).`);
        }

        // 2. OneSignal Push Notification (ONLY to reminder owner, NEVER broadcast to other users)
        if (ownerUserId) {
          try {
            await oneSignalService.sendPushNotification({
              title: pushPayload.title,
              message: pushPayload.body,
              url: pushPayload.url,
              phone: pushPayload.phone,
              userId: ownerUserId,
            });
          } catch (oneSignalErr) {
            console.warn('[Worker] OneSignal push notice:', oneSignalErr.message);
          }
        }

        // 3. Email Notification to reminder owner (ONLY to reminder owner's email)
        if (ownerEmail) {
          try {
            await sendReminderEmail(reminder, ownerEmail);
            console.log(`[Worker] Email sent to owner (${ownerEmail}) for reminder ${reminder._id}`);
          } catch (emailErr) {
            console.error('[Worker Error] Email sending failure:', emailErr.message);
          }
        } else {
          console.log(`[Worker] Notice: No owner email for reminder ${reminder._id}. Skipping email to prevent sending to other users.`);
        }
        await dataService.markEmailSent(reminder._id);

        // 4. Native Windows Action Center PC Toast Notification (only for local admin's own reminders)
        try {
          const superAdminEmail = (process.env.SUPERADMIN_EMAIL || 'vaibhavdigitalwebconnection@gmail.com').toLowerCase();
          if (ownerEmail && ownerEmail.toLowerCase() === superAdminEmail) {
            desktopNotificationService.sendReminderToast(reminder, formattedTime);
          }
        } catch (toastErr) {
          console.warn('[Worker] Native Windows toast warning:', toastErr.message);
        }

        // Mark as notified in database
        await dataService.markNotified(reminder._id);
      } catch (err) {
        console.error(`[Worker Error] Failed to process reminder ${reminder._id}:`, err.message);
      }
    }
  } catch (err) {
    console.error('[Worker Error] Unexpected error in reminder loop:', err);
  } finally {
    isRunning = false;
  }
}

export function startReminderWorker() {
  console.log('[Worker] Checking for due/missed reminders on startup...');
  processDueReminders();

  // Run every minute: * * * * *
  cron.schedule('* * * * *', () => {
    processDueReminders();
  });

  console.log('[Worker] Reminder cron worker scheduled (running every minute)');
}
