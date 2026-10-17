import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import { connectDB } from './config/db.js';
import { startReminderWorker } from './jobs/reminderWorker.js';
import { startKeepAliveWorker } from './jobs/keepAliveWorker.js';
import { ensureOwnerExists } from './routes/authRoutes.js';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Running on http://localhost:${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
    console.log(`[Server] Health check: http://localhost:${PORT}/api/v1/health`);
    console.log(`[Server] Timezone: ${process.env.APP_TIMEZONE || 'Australia/Sydney'}`);
  });

  // Connect to DB in background
  connectDB()
    .then(async () => {
      await ensureOwnerExists();
    })
    .catch((err) => {
      console.warn(`[Database] Connection warning: ${err.message}`);
    });

  // Start the 1-minute cron worker for email & push reminders
  startReminderWorker();

  // Start the 14-minute keep-alive worker to keep Render active 24/7
  startKeepAliveWorker();

  return server;
};

startServer();
