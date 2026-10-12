import type { Request, Response } from 'express';
import * as dataService from '../services/dataService.js';

export async function exportAll(_req: Request, res: Response) {
  const data = await dataService.exportData();
  res.setHeader('Content-Disposition', 'attachment; filename="chinese-learning-export.json"');
  res.json({ success: true, data });
}

export async function importAll(req: Request, res: Response) {
  const result = await dataService.importData(req.body);
  res.status(201).json({ success: true, data: result });
}
