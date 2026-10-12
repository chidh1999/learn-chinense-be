import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 5000),
  mongoUri: required('MONGODB_URI', 'mongodb://localhost:27017/chinese_learning'),
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  audioDir: process.env.AUDIO_DIR ?? path.join(process.cwd(), 'data', 'audio'),
  maxAudioBytes: Number(process.env.MAX_AUDIO_BYTES ?? 10 * 1024 * 1024),
};
