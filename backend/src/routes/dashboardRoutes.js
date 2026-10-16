import express from 'express';
import { dataService } from '../services/dataService.js';
import { DEFAULT_AUSTRALIAN_TIMEZONE } from '../utils/timezones.js';

const router = express.Router();

router.get('/summary', async (req, res, next) => {
  try {
    const timezone = req.query.timezone || DEFAULT_AUSTRALIAN_TIMEZONE;
    const summary = await dataService.getDashboardSummary(timezone);
    res.json({ success: true, data: summary });
  } catch (err) {
    next(err);
  }
});

export default router;
