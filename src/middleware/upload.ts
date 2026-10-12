import multer from 'multer';
import path from 'path';
import os from 'os';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, os.tmpdir());
  },
  filename: (_req, file, cb) => {
    const safe = path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `upload-${Date.now()}-${safe}`);
  },
});

function fileFilter(
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) {
  const allowed = [
    'audio/webm',
    'audio/ogg',
    'audio/mpeg',
    'audio/mp4',
    'audio/wav',
    'audio/x-wav',
    'audio/wave',
    'video/webm',
  ];
  if (!allowed.includes(file.mimetype)) {
    cb(new ApiError(400, `Unsupported audio type: ${file.mimetype}`));
    return;
  }
  cb(null, true);
}

export const audioUpload = multer({
  storage,
  limits: { fileSize: env.maxAudioBytes },
  fileFilter,
});
