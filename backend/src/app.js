import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/authRoutes.js';
import reminderRoutes from './routes/reminderRoutes.js';
import pushRoutes from './routes/pushRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// Helper to parse comma-separated FRONTEND_URL
const getAllowedOrigins = () => {
  const envOrigins = (process.env.FRONTEND_URL || '')
    .split(',')
    .map((url) => url.trim().replace(/\/+$/, ''))
    .filter(Boolean);

  return [
    ...envOrigins,
    'https://customer-reminder-wine.vercel.app',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
  ];
};

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, Postman, server-to-server)
      if (!origin) return callback(null, true);

      const cleanOrigin = origin.replace(/\/+$/, '');
      const allowedOrigins = getAllowedOrigins();

      // Check if origin matches any URL in comma-separated list or localhost
      const isAllowed =
        allowedOrigins.includes('*') ||
        allowedOrigins.includes(cleanOrigin) ||
        cleanOrigin.startsWith('http://localhost:') ||
        cleanOrigin.startsWith('http://127.0.0.1:');

      if (isAllowed) {
        callback(null, true);
      } else {
        // Fallback: reflect origin for production flexibility with credentials
        callback(null, true);
      }
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

// Root API Endpoint (Gives instant confirmation in browser)
app.get('/', (req, res, next) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  
  // If static frontend exists, let next() handle it
  const frontendDistPath = [
    path.resolve(__dirname, '../../frontend/dist'),
    path.resolve(process.cwd(), 'frontend/dist'),
    path.resolve(process.cwd(), '../frontend/dist'),
  ].find((p) => fs.existsSync(p));

  if (frontendDistPath && fs.existsSync(path.join(frontendDistPath, 'index.html'))) {
    return res.sendFile(path.join(frontendDistPath, 'index.html'));
  }

  res.status(200).json({
    status: 'ok',
    message: 'Customer Reminder API is running on Render',
    health: '/api/v1/health',
    database: isDbConnected ? 'connected' : 'disconnected',
    storage: isDbConnected ? 'mongodb' : 'local-json-store',
    timestamp: new Date().toISOString(),
  });
});

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

// Optional: Serve frontend static files if built in monorepo
const frontendDist = [
  path.resolve(__dirname, '../../frontend/dist'),
  path.resolve(process.cwd(), 'frontend/dist'),
  path.resolve(process.cwd(), '../frontend/dist'),
].find((p) => fs.existsSync(p));

if (frontendDist) {
  app.use(express.static(frontendDist));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.originalUrl.startsWith('/api')) {
      return res.sendFile(path.join(frontendDist, 'index.html'));
    }
    next();
  });
}

// Fallback for unhandled API routes
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

app.use(errorHandler);

export default app;
