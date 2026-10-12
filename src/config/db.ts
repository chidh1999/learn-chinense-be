import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDb(retries = 30, delayMs = 2000): Promise<void> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await mongoose.connect(env.mongoUri);
      console.log('Connected to MongoDB');
      return;
    } catch (err) {
      lastError = err;
      console.warn(`MongoDB connection attempt ${attempt}/${retries} failed`);
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Failed to connect to MongoDB');
}

export async function disconnectDb(): Promise<void> {
  await mongoose.disconnect();
}
