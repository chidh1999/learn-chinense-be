import type { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { objectIdSchema } from '../validators/itemValidators.js';
import * as itemRepo from '../repositories/itemRepository.js';
import * as reviewRepo from '../repositories/reviewRepository.js';
import {
  assertAllowedMime,
  buildAudioFilename,
  deleteAudioFile,
  ensureAudioDir,
  resolveSafeAudioPath,
  toStoredPath,
} from '../services/audioService.js';
import { ApiError } from '../utils/ApiError.js';
import { env } from '../config/env.js';

export async function upload(req: Request, res: Response) {
  const id = objectIdSchema.parse(req.params.id);
  if (!reviewRepo.isValidObjectId(id)) {
    throw new ApiError(400, 'Invalid item id');
  }

  const item = await itemRepo.findItemById(id);
  if (!item) throw new ApiError(404, 'Item not found');

  if (!req.file) {
    throw new ApiError(400, 'Audio file is required');
  }

  assertAllowedMime(req.file.mimetype);
  await ensureAudioDir();

  if (item.audioRecordingPath) {
    await deleteAudioFile(item.audioRecordingPath);
  }

  const filename = buildAudioFilename(id, req.file.mimetype);
  const dest = resolveSafeAudioPath(filename);
  await fs.promises.rename(req.file.path, dest);

  const updated = await itemRepo.updateItemById(id, {
    audioRecordingPath: toStoredPath(filename),
    audioMimeType: req.file.mimetype,
    audioOriginalName: req.file.originalname,
  });

  res.status(201).json({
    success: true,
    data: {
      audioRecordingPath: updated?.audioRecordingPath,
      audioMimeType: updated?.audioMimeType,
    },
  });
}

export async function play(req: Request, res: Response) {
  const id = objectIdSchema.parse(req.params.id);
  const item = await itemRepo.findItemById(id);
  if (!item) throw new ApiError(404, 'Item not found');
  if (!item.audioRecordingPath) {
    throw new ApiError(404, 'No audio recording for this item');
  }

  const fullPath = resolveSafeAudioPath(item.audioRecordingPath);
  try {
    await fs.promises.access(fullPath);
  } catch {
    throw new ApiError(404, 'Audio file missing on disk');
  }

  const mime = item.audioMimeType || 'audio/webm';
  res.setHeader('Content-Type', mime);
  res.setHeader('Content-Disposition', `inline; filename="${path.basename(fullPath)}"`);
  fs.createReadStream(fullPath).pipe(res);
}

export async function remove(req: Request, res: Response) {
  const id = objectIdSchema.parse(req.params.id);
  const item = await itemRepo.findItemById(id);
  if (!item) throw new ApiError(404, 'Item not found');

  await deleteAudioFile(item.audioRecordingPath);
  await itemRepo.updateItemById(id, {
    audioRecordingPath: null,
    audioMimeType: null,
    audioOriginalName: null,
  });

  res.json({ success: true, data: { deleted: true } });
}

export function audioUploadLimits() {
  return { fileSize: env.maxAudioBytes };
}
