import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/authRoutes.js';
import reminderRoutes from './routes/reminderRoutes.js';
import pushRoutes from './routes/pushRoutes.js';

const app = express();

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow any origin (localhost, 127.0.0.1, mobile LAN IPs, localtunnel, ngrok, and production)
      // Passing true reflects the request origin, which is required for credentials: true
      callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    optionsSuccessStatus: 200,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health Check
app.get('/api/v1/health', (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  res.status(200).json({
    status: 'ok',
    database: isDbConnected ? 'connected' : 'disconnected',
    storage: isDbConnected ? 'mongodb' : 'local-json-store',
    timezone: process.env.APP_TIMEZONE || 'Australia/Sydney',
    service: 'customer-reminder-api',
    timestamp: new Date().toISOString(),
  });
});

// Mount Simplified Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/reminders', reminderRoutes);
app.use('/api/v1/push', pushRoutes);

// Fallback
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

app.use(errorHandler);

export default app;
