import { ApiError } from '../utils/ApiError.js';
import * as itemRepo from '../repositories/itemRepository.js';
import * as reviewRepo from '../repositories/reviewRepository.js';
import { createInitialReviewState } from './srsService.js';
import { deleteAudioFile } from './audioService.js';
import type { z } from 'zod';
import type { createItemSchema, updateItemSchema, listItemsQuerySchema } from '../validators/itemValidators.js';

type CreateItemInput = z.infer<typeof createItemSchema>;
type UpdateItemInput = z.infer<typeof updateItemSchema>;
type ListQuery = z.infer<typeof listItemsQuerySchema>;

export async function createItem(input: CreateItemInput) {
  const item = await itemRepo.createItem(input);
  await reviewRepo.createReviewState(String(item._id), createInitialReviewState());
  return item;
}

export async function getItem(id: string) {
  if (!reviewRepo.isValidObjectId(id)) {
    throw new ApiError(400, 'Invalid item id');
  }
  const item = await itemRepo.findItemById(id);
  if (!item) throw new ApiError(404, 'Item not found');
  const review = await reviewRepo.findReviewStateByItemId(id);
  return { item, review };
}

export async function updateItem(id: string, input: UpdateItemInput) {
  if (!reviewRepo.isValidObjectId(id)) {
    throw new ApiError(400, 'Invalid item id');
  }
  const item = await itemRepo.updateItemById(id, input);
  if (!item) throw new ApiError(404, 'Item not found');
  return item;
}

export async function deleteItem(id: string) {
  if (!reviewRepo.isValidObjectId(id)) {
    throw new ApiError(400, 'Invalid item id');
  }
  const item = await itemRepo.findItemById(id);
  if (!item) throw new ApiError(404, 'Item not found');

  await deleteAudioFile(item.audioRecordingPath);
  await Promise.all([
    itemRepo.deleteItemById(id),
    reviewRepo.deleteReviewStateByItemId(id),
    reviewRepo.deleteReviewLogsByItemId(id),
  ]);
  return { deleted: true };
}

export async function listItems(query: ListQuery) {
  const { page, limit, sortBy, sortOrder, q, type, pronunciationLanguage, tag } = query;

  if (sortBy === 'dueAt') {
    const due = await reviewRepo.findDueReviews(
      { type, pronunciationLanguage, tag },
      1000
    );
    const allStates = due;
    // For dueAt sort, fetch via aggregation-like approach: get all matching items with review
    const result = await itemRepo.listItems(
      { q, type, pronunciationLanguage, tag },
      { page: 1, limit: 10000 },
      'createdAt',
      'desc'
    );

    const reviews = await Promise.all(
      result.items.map(async (item) => {
        const review = await reviewRepo.findReviewStateByItemId(String(item._id));
        return { item, review };
      })
    );

    reviews.sort((a, b) => {
      const aDue = a.review?.dueAt ? new Date(a.review.dueAt).getTime() : Number.MAX_SAFE_INTEGER;
      const bDue = b.review?.dueAt ? new Date(b.review.dueAt).getTime() : Number.MAX_SAFE_INTEGER;
      return sortOrder === 'asc' ? aDue - bDue : bDue - aDue;
    });

    const start = (page - 1) * limit;
    const slice = reviews.slice(start, start + limit);
    void allStates;

    return {
      items: slice.map((r) => ({ ...r.item, review: r.review })),
      pagination: {
        page,
        limit,
        total: reviews.length,
        totalPages: Math.ceil(reviews.length / limit) || 1,
      },
    };
  }

  const { items, total } = await itemRepo.listItems(
    { q, type, pronunciationLanguage, tag },
    { page, limit },
    sortBy,
    sortOrder
  );

  const withReview = await Promise.all(
    items.map(async (item) => {
      const review = await reviewRepo.findReviewStateByItemId(String(item._id));
      return { ...item, review };
    })
  );

  return {
    items: withReview,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}
