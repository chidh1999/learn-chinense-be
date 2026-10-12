import { ApiError } from '../utils/ApiError.js';
import * as reviewRepo from '../repositories/reviewRepository.js';
import * as itemRepo from '../repositories/itemRepository.js';
import { createInitialReviewState, scheduleReview, type ReviewRating } from './srsService.js';

export async function getDueReviews(filters: {
  type?: string;
  pronunciationLanguage?: string;
  tag?: string;
  limit: number;
}) {
  return reviewRepo.findDueReviews(filters, filters.limit);
}

export async function completeReview(itemId: string, rating: ReviewRating) {
  if (!reviewRepo.isValidObjectId(itemId)) {
    throw new ApiError(400, 'Invalid item id');
  }

  const item = await itemRepo.findItemById(itemId);
  if (!item) throw new ApiError(404, 'Item not found');

  let state = await reviewRepo.findReviewStateByItemId(itemId);
  if (!state) {
    state = await reviewRepo.createReviewState(itemId, createInitialReviewState());
  }

  const now = new Date();
  const result = scheduleReview(
    {
      intervalDays: state.intervalDays,
      easeFactor: state.easeFactor,
      repetitions: state.repetitions,
    },
    rating,
    now
  );

  const updated = await reviewRepo.upsertReviewState(itemId, {
    dueAt: result.dueAt,
    lastReviewedAt: now,
    intervalDays: result.intervalDays,
    easeFactor: result.easeFactor,
    repetitions: result.repetitions,
    reviewCount: state.reviewCount + 1,
    correctCount: state.correctCount + (result.isCorrect ? 1 : 0),
  });

  await reviewRepo.createReviewLog({
    itemId,
    rating,
    reviewedAt: now,
    intervalDays: result.intervalDays,
    easeFactor: result.easeFactor,
    repetitions: result.repetitions,
  });

  return { item, review: updated, rating };
}

export async function getHistory(from?: string, to?: string, page = 1, limit = 50) {
  return reviewRepo.listReviewHistory(
    from ? new Date(from) : undefined,
    to ? new Date(to) : undefined,
    page,
    limit
  );
}

export async function getStats() {
  return reviewRepo.getReviewStats();
}
