// src/config/db.ts
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config(); // Load .env variables (you can also load it only in index.ts)

const MONGODB_URI = process.env.MONGO_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGO_URI environment variable inside .env');
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development and avoid multiple connections in production.
 * → Important in Next.js / Vercel-like envs, but also helpful in plain Express.
 */
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache;
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectDB(): Promise<typeof mongoose> {
  // If we already have a connection, return it
  if (cached.conn) {
    console.log('→ Using existing MongoDB connection');
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false, // Disable mongoose buffering
      // You can add more options here if needed
      // serverSelectionTimeoutMS: 5000,
      // maxPoolSize: 10,
    };

    console.log('→ Connecting to MongoDB...');

    cached.promise = mongoose
      .connect(MONGODB_URI as string, opts)
      .then((mongooseInstance) => {
        console.log('MongoDB connected successfully');
        return mongooseInstance;
      })
      .catch((error) => {
        console.error('MongoDB connection error:', error);
        cached.promise = null; // Reset promise on failure
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

// Optional: Graceful shutdown (good for production)
process.on('SIGINT', async () => {
  if (cached.conn) {
    await cached.conn.disconnect();
    console.log('MongoDB disconnected on app termination');
  }
  process.exit(0);
});