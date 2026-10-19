import express from 'express';
import { pushService } from '../services/pushService.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/public-key', (req, res) => {
  res.json({
    success: true,
    publicKey: pushService.getPublicKey(),
  });
});

router.post('/subscribe', optionalAuth, async (req, res) => {
  const subscription = req.body;
  if (!subscription || !subscription.endpoint) {
    return res.status(400).json({ success: false, message: 'Valid push subscription is required' });
  }

  const userId = req.user?.id || null;
  const userAgent = req.headers['user-agent'] || '';

  try {
    await pushService.addSubscription(subscription, userId, userAgent);
    res.json({
      success: true,
      message: 'Mobile push subscription armed and registered successfully',
      userId: userId || 'anonymous',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /test - Dispatches high-urgency test alarm notification to mobile devices (optional delaySeconds)
router.post('/test', optionalAuth, async (req, res) => {
  try {
    const delaySeconds = Math.max(0, parseInt(req.body?.delaySeconds, 10) || 0);

    const payload = {
      title: '🚨 RemindIQ Mobile Alarm: Call Due!',
      body: '📞 Phone: +61 400 123 456 | Customer: John Smith\nApp is closed — phone ringing test succeeded!',
      phone: '+61 400 123 456',
      url: '/reminders?testAlarm=1',
      reminderId: 'test-alarm-' + Date.now(),
      name: 'John Smith',
      isAlarm: true,
      isTest: true,
      timestamp: Date.now(),
    };

    const sendPush = async () => {
      let pushResult;
      if (req.user?.id) {
        pushResult = await pushService.sendPushToUser(req.user.id, payload);
        if (pushResult.sent === 0) {
          pushResult = await pushService.sendPushToAll(payload);
        }
      } else {
        pushResult = await pushService.sendPushToAll(payload);
      }
      return pushResult;
    };

    if (delaySeconds > 0) {
      setTimeout(async () => {
        try {
          await sendPush();
        } catch (e) {
          console.warn('[Push] Delayed test error:', e.message);
        }
      }, delaySeconds * 1000);

      return res.json({
        success: true,
        delayed: true,
        delaySeconds,
        message: `Alarm scheduled to fire in ${delaySeconds} seconds! Press your phone's Home button or lock your screen now to test.`,
      });
    }

    const result = await sendPush();
    res.json({
      success: true,
      message: `Alarm notification dispatched with high urgency to ${result.sent || 0} mobile device(s).`,
      result,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /status - Returns status of Web Push configuration and active subscribers
router.get('/status', optionalAuth, async (req, res) => {
  try {
    const subs = await pushService.getSubscriptions(req.user?.id);
    res.json({
      success: true,
      hasPublicKey: !!pushService.getPublicKey(),
      subscriptionCount: subs.length,
      userId: req.user?.id || null,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
