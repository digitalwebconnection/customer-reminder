import mongoose from 'mongoose';

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/customer-reminder';
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[Database] MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.warn(`[Database Warning] Could not connect to MongoDB at ${uri}: ${error.message}`);
    console.warn(`[Database Hint] Ensure MongoDB is running locally or provide a MONGODB_URI in backend/.env`);
    return null;
  }
};

mongoose.connection.on('disconnected', () => {
  console.warn('[Database] MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  console.log('[Database] MongoDB reconnected');
});
