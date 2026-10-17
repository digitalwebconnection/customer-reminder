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

  async sendPushNotification({ title, message, url = '/reminders', phone }) {
    const apiKey = this.getApiKey();
    const appId = this.getAppId();

    if (!apiKey) {
      console.log('[OneSignal] ONESIGNAL_REST_API_KEY is not set yet in backend/.env. Client-side OneSignal web SDK is active for prompts.');
      return false;
    }

    try {
      const primaryFrontend = (process.env.FRONTEND_URL || 'https://customer-reminder-wine.vercel.app').split(',')[0].trim().replace(/\/+$/, '');
      const payload = {
        app_id: appId,
        included_segments: ['Subscribed Users', 'Total Subscriptions'],
        headings: { en: title },
        contents: { en: message },
        url: url.startsWith('http') ? url : `${primaryFrontend}${url}`,
        chrome_web_badge: '/favicon.svg',
        data: { phone, url },
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
