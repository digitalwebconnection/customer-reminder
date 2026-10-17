import notifier from 'node-notifier';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const APP_ICON_PATH = path.resolve(__dirname, '../../assets/app-icon.png');

/**
 * Native Windows PC Desktop Notification Service
 * Sends styled 60-second Windows Action Center Toast Notifications with custom branding
 */
export const desktopNotificationService = {
  sendReminderToast(reminder, formattedTime) {
    const title = `📞 Call Reminder: ${reminder.name}`;
    const cleanPhone = reminder.phone || '';
    const message = `📱 ${cleanPhone}\n⏰ Due: ${formattedTime}${reminder.note ? `\n📝 "${reminder.note}"` : ''}`;

    notifier.notify(
      {
        title,
        message,
        appID: 'RemindIQ',
        icon: APP_ICON_PATH,
        sound: true,
        wait: true,
        timeout: 60, // Keep notification visible for 60 seconds (1 minute)
        actions: ['📞 Call Now', 'View in App'],
      },
      (err, response, metadata) => {
        if (err) {
          console.warn('[Desktop Notification] Error sending Windows toast:', err.message);
        } else {
          console.log(`[Desktop Notification] Windows 1-min reminder toast active for "${reminder.name}"`);
          
          // If user clicked notification or action button, open direct link
          const primaryUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').split(',')[0].trim().replace(/\/+$/, '');
          const action = metadata?.activationType || response;
          if (action === 'click' || action === 'View in App') {
            exec(`start ${primaryUrl}/reminders`);
          } else if (action === '📞 Call Now' && cleanPhone) {
            exec(`start tel:${cleanPhone.replace(/\s+/g, '')}`);
          }
        }
      }
    );
  },

  sendTestToast() {
    notifier.notify(
      {
        title: '🔔 RemindIQ Call Reminder Test',
        message: 'Active for 1 minute on your PC!\nAll scheduled customer calls will appear here.',
        appID: 'RemindIQ',
        icon: APP_ICON_PATH,
        sound: true,
        wait: false,
        timeout: 60, // 60 seconds duration
        actions: ['Open RemindIQ', 'Dismiss'],
      },
      (err, response, metadata) => {
        if (err) {
          console.warn('[Desktop Notification] Test error:', err.message);
        } else {
          console.log('[Desktop Notification] 60-second Windows test toast sent successfully!');
          const primaryUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').split(',')[0].trim().replace(/\/+$/, '');
          const action = metadata?.activationType || response;
          if (action === 'click' || action === 'Open RemindIQ') {
            exec(`start ${primaryUrl}/reminders`);
          }
        }
      }
    );
  },
};
