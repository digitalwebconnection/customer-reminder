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

export default router;
