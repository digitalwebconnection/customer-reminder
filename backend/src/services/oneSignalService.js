/**
 * OneSignal Backend Push Notification Service
 */

export const oneSignalService = {
  getAppId() {
    return process.env.ONESIGNAL_APP_ID || 'c211ef15-5ef5-45a5-80ce-e6f36c3fe58a';
  },

  getApiKey() {
    return process.env.ONESIGNAL_REST_API_KEY || '';
  },

  async sendPushNotification({ title, message, url = '/reminders', phone, userId = null }) {
    const apiKey = this.getApiKey();
    const appId = this.getAppId();

    if (!apiKey) {
      return false;
    }

    // STRICT PRIVACY PROTECTION:
    // Reminders belong to a specific user. Never broadcast to all subscribers!
    if (!userId) {
      console.log('[OneSignal] Broadcast prevented: No specific userId target provided for reminder push.');
      return false;
    }

    try {
      const primaryFrontend = (process.env.FRONTEND_URL || 'https://customer-reminder-wine.vercel.app').split(',')[0].trim().replace(/\/+$/, '');
      const payload = {
        app_id: appId,
        // Target specifically by owner's external ID in OneSignal
        include_aliases: { external_id: [String(userId)] },
        target_channel: 'push',
        headings: { en: title },
        contents: { en: message },
        url: url.startsWith('http') ? url : `${primaryFrontend}${url}`,
        chrome_web_badge: '/favicon.svg',
        data: { phone, url, userId: String(userId) },
      };

      const response = await fetch('https://onesignal.com/api/v1/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${apiKey}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        console.warn('[OneSignal Error]', data);
        return false;
      }

      console.log(`[OneSignal] Push sent successfully! Recipients: ${data.recipients || 0}, Notification ID: ${data.id}`);
      return true;
    } catch (err) {
      console.error('[OneSignal Error] Failed to send push:', err.message);
      return false;
    }
  },
};
