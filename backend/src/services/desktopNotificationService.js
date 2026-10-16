import notifier from 'node-notifier';

/**
 * Native Windows PC Desktop Notification Service
 * Sends native Windows Action Center Toast Notifications directly to the user's PC
 */
export const desktopNotificationService = {
  sendReminderToast(reminder, formattedTime) {
    const title = `📞 Call Reminder: ${reminder.name}`;
    const message = `Time to call ${reminder.phone}\nDue: ${formattedTime}${reminder.note ? `\n"${reminder.note}"` : ''}`;

    notifier.notify(
      {
        title,
        message,
        appID: 'RemindIQ',
        sound: true,
        wait: false,
      },
      (err, response) => {
        if (err) {
          console.warn('[Desktop Notification] Error sending Windows toast:', err.message);
        } else {
          console.log(`[Desktop Notification] Windows Action Center notification sent for "${reminder.name}"`);
        }
      }
    );
  },

  sendTestToast() {
    notifier.notify(
      {
        title: 'RemindIQ Customer Reminder',
        message: '🔔 Success! Native Windows PC notifications are active on this computer.',
        appID: 'RemindIQ',
        sound: true,
        wait: false,
      },
      (err, response) => {
        if (err) {
          console.warn('[Desktop Notification] Test error:', err.message);
        } else {
          console.log('[Desktop Notification] Test Windows toast notification sent successfully!');
        }
      }
    );
  },
};
