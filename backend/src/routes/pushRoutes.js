import express from 'express';
import { pushService } from '../services/pushService.js';

const router = express.Router();

router.get('/public-key', (req, res) => {
  res.json({
    success: true,
    publicKey: pushService.getPublicKey(),
  });
});

router.post('/subscribe', (req, res) => {
  const subscription = req.body;
  if (!subscription || !subscription.endpoint) {
    return res.status(400).json({ success: false, message: 'Valid push subscription is required' });
  }

  pushService.addSubscription(subscription);
  res.json({ success: true, message: 'Push subscription saved successfully' });
});

// POST /test - Dispatches high-urgency test alarm notification to mobile devices
router.post('/test', async (req, res) => {
  try {
    const payload = {
      title: '🚨 RemindIQ Alarm: Call Customer Due!',
      body: '📞 Phone: +61 400 123 456 | Customer: John Smith\nTap to call or snooze 10m.',
      phone: '+61 400 123 456',
      url: '/reminders?testAlarm=1',
      reminderId: 'test-alarm-' + Date.now(),
      name: 'John Smith',
      isAlarm: true,
      isTest: true,
      timestamp: Date.now(),
    };

    const pushResult = await pushService.sendPushToAll(payload);
    res.json({
      success: true,
      message: `Alarm notification dispatched with high urgency to ${pushResult.sent || 0} mobile device(s).`,
      result: pushResult,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /status - Returns status of Web Push configuration and active subscribers
router.get('/status', (req, res) => {
  const subs = pushService.getSubscriptions ? pushService.getSubscriptions() : [];
  res.json({
    success: true,
    hasPublicKey: !!pushService.getPublicKey(),
    subscriptionCount: subs.length,
  });
});

export default router;
