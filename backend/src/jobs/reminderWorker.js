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

        // Determine the owner of this reminder for per-user notification
        let ownerEmail = null;
        let ownerUser = null;
        if (reminder.userId) {
          // userId may be populated or an ObjectId
          if (typeof reminder.userId === 'object' && reminder.userId.email) {
            ownerUser = reminder.userId;
            ownerEmail = reminder.userId.email;
          } else {
            try {
              ownerUser = await User.findById(reminder.userId);
              ownerEmail = ownerUser?.email || null;
            } catch (e) {
              console.warn(`[Worker] Could not find owner for reminder ${reminder._id}`);
            }
          }
        }

        // 1. Send Email Notification to the reminder OWNER (not global recipient)
        await sendReminderEmail(reminder, ownerEmail);
        await dataService.markEmailSent(reminder._id);
        console.log(`[Worker] Email sent to ${ownerEmail || 'default'} for reminder ${reminder._id}`);

        // 2. Send High-Urgency Web Push Notification
        const pushPayload = {
          title: `🚨 Call Reminder Alarm: ${reminder.name}`,
          body: `📞 Due Now: Call ${reminder.phone} (${formattedTime})${reminder.note ? `\nNote: ${reminder.note}` : ''}`,
          phone: reminder.phone,
          url: `/reminders?alertId=${reminder._id}`,
          reminderId: reminder._id,
          name: reminder.name,
          dueAt: reminder.dueAt,
          isAlarm: true,
          timestamp: Date.now(),
        };

        // Send push to the specific user's subscription if available
        if (ownerUser && ownerUser.pushSubscription) {
          await pushService.sendPushToSubscription(ownerUser.pushSubscription, pushPayload);
        } else {
          await pushService.sendPushToAll(pushPayload);
        }

        await oneSignalService.sendPushNotification({
          title: pushPayload.title,
          message: pushPayload.body,
          url: pushPayload.url,
          phone: pushPayload.phone,
        });

        // 3. Send Native Windows Action Center PC Toast Notification
        try {
          desktopNotificationService.sendReminderToast(reminder, formattedTime);
        } catch (e) {
          console.warn('[Worker] Native Windows toast warning:', e.message);
        }

        await dataService.markNotified(reminder._id);
      } catch (err) {
        console.error(`[Worker Error] Failed to process reminder ${reminder._id}:`, err.message);
        // Will retry automatically on next minute cycle because emailSentAt remains null
      }
    }
  } catch (err) {
    console.error('[Worker Error] Unexpected error in reminder loop:', err);
  } finally {
    isRunning = false;
  }
}

export function startReminderWorker() {
  // Catch up immediately on server startup
  console.log('[Worker] Checking for due/missed reminders on startup...');
  processDueReminders();

  // Run every minute: * * * * *
  cron.schedule('* * * * *', () => {
    processDueReminders();
  });

  console.log('[Worker] Reminder cron worker scheduled (running every minute)');
}
