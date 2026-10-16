import cron from 'node-cron';
import { dataService } from '../services/dataService.js';
import { sendReminderEmail, formatInTimezone } from '../services/emailService.js';
import { pushService } from '../services/pushService.js';
import { oneSignalService } from '../services/oneSignalService.js';
import { desktopNotificationService } from '../services/desktopNotificationService.js';

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
        const tz = reminder.timezone || 'Australia/Sydney';
        const formattedTime = formatInTimezone(reminder.dueAt, tz);
        console.log(`[Worker] Processing reminder: "${reminder.name}" (${reminder.phone}) due at ${formattedTime}`);

        // 1. Send Email Notification
        await sendReminderEmail(reminder);
        await dataService.markEmailSent(reminder._id);
        console.log(`[Worker] Email sent successfully for reminder ${reminder._id}`);

        // 2. Send Web Push & OneSignal Notification
        const pushPayload = {
          title: `Call Reminder: ${reminder.name}`,
          body: `Time to call ${reminder.phone}. Due: ${formattedTime}`,
          phone: reminder.phone,
          url: '/reminders',
        };
        await pushService.sendPushToAll(pushPayload);
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
