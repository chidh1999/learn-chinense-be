import type { Request, Response } from 'express';
import * as reviewService from '../services/reviewService.js';

export async function stats(_req: Request, res: Response) {
  const data = await reviewService.getStats();
  res.json({ success: true, data });
}
