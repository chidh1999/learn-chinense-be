import type { Request, Response } from 'express';
import * as reviewService from '../services/reviewService.js';
import {
  completeReviewSchema,
  dueReviewsQuerySchema,
  historyQuerySchema,
  objectIdSchema,
} from '../validators/itemValidators.js';

export async function due(req: Request, res: Response) {
  const query = dueReviewsQuerySchema.parse(req.query);
  const data = await reviewService.getDueReviews(query);
  res.json({ success: true, data });
}

export async function complete(req: Request, res: Response) {
  const itemId = objectIdSchema.parse(req.params.itemId);
  const body = completeReviewSchema.parse(req.body);
  const data = await reviewService.completeReview(itemId, body.rating);
  res.json({ success: true, data });
}

export async function history(req: Request, res: Response) {
  const query = historyQuerySchema.parse(req.query);
  const result = await reviewService.getHistory(query.from, query.to, query.page, query.limit);
  res.json({
    success: true,
    data: {
      logs: result.logs,
      pagination: {
        page: query.page,
        limit: query.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / query.limit) || 1,
      },
    },
  });
}
