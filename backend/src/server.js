import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import { connectDB } from './config/db.js';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  const server = app.listen(PORT, () => {
    console.log(`[Server] Running on http://localhost:${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
    console.log(`[Server] Health check available at: http://localhost:${PORT}/api/v1/health`);
  });

  // Attempt DB connection without blocking the HTTP server from responding
  connectDB().catch((err) => {
    console.warn(`[Database] Background connection error: ${err.message}`);
  });

  return server;
};

startServer();
