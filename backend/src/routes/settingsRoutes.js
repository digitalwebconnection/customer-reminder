import express from 'express';
import { dataService } from '../services/dataService.js';
import { AUSTRALIAN_TIMEZONES } from '../utils/timezones.js';

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const settings = await dataService.getSettings();
    res.json({
      success: true,
      data: {
        ...settings,
        supportedTimezones: AUSTRALIAN_TIMEZONES,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.patch('/', async (req, res, next) => {
  try {
    const updated = await dataService.updateSettings(req.body);
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

export default router;
