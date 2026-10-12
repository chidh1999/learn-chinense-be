import fs from 'fs/promises';
import path from 'path';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

const ALLOWED_MIME = new Set([
  'audio/webm',
  'audio/ogg',
  'audio/mpeg',
  'audio/mp4',
  'audio/wav',
  'audio/x-wav',
  'audio/wave',
  'video/webm',
]);

const EXT_BY_MIME: Record<string, string> = {
  'audio/webm': '.webm',
  'video/webm': '.webm',
  'audio/ogg': '.ogg',
  'audio/mpeg': '.mp3',
  'audio/mp4': '.m4a',
  'audio/wav': '.wav',
  'audio/x-wav': '.wav',
  'audio/wave': '.wav',
};

export async function ensureAudioDir(): Promise<void> {
  await fs.mkdir(env.audioDir, { recursive: true });
}

export function assertAllowedMime(mime: string): void {
  if (!ALLOWED_MIME.has(mime)) {
    throw new ApiError(400, `Unsupported audio type: ${mime}`);
  }
}

export function buildAudioFilename(itemId: string, mime: string): string {
  const ext = EXT_BY_MIME[mime] ?? '.webm';
  return `${itemId}-${Date.now()}${ext}`;
}

export function resolveSafeAudioPath(filename: string): string {
  const base = path.resolve(env.audioDir);
  const resolved = path.resolve(base, path.basename(filename));
  if (!resolved.startsWith(base + path.sep) && resolved !== base) {
    throw new ApiError(400, 'Invalid audio path');
  }
  return resolved;
}

export async function deleteAudioFile(storedPath: string | null | undefined): Promise<void> {
  if (!storedPath) return;
  const filename = path.basename(storedPath);
  const fullPath = resolveSafeAudioPath(filename);
  try {
    await fs.unlink(fullPath);
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code !== 'ENOENT') {
      throw err;
    }
  }
}

export function toStoredPath(filename: string): string {
  return path.basename(filename);
}
