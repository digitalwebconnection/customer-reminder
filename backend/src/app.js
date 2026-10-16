import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import { errorHandler } from './middleware/errorHandler.js';
import customerRoutes from './routes/customerRoutes.js';
import reminderRoutes from './routes/reminderRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';

const app = express();

// Security headers
app.use(helmet());

// Dynamic CORS for local development & production frontend
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, postman)
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes(origin) ||
        origin.startsWith('http://localhost:') ||
        origin.startsWith('http://127.0.0.1:')
      ) {
        return callback(null, true);
      }
      return callback(new Error('CORS policy: Not allowed by CORS'));
    },
    credentials: true,
  })
);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health check endpoint
app.get('/api/v1/health', (req, res) => {
  const dbStatusMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  const dbState = dbStatusMap[mongoose.connection.readyState] || 'disconnected';

  res.status(200).json({
    status: 'ok',
    database: dbState,
    storageMode: dbState === 'connected' ? 'mongodb' : 'persistent-local-store',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    timezone: process.env.APP_TIMEZONE || 'Australia/Sydney',
    service: 'customer-reminder-api',
  });
});

// Mount application API routes
app.use('/api/v1/customers', customerRoutes);
app.use('/api/v1/reminders', reminderRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/settings', settingsRoutes);

// Fallback for unhandled routes
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Global error handler
app.use(errorHandler);

export default app;
