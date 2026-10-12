import type { FilterQuery } from 'mongoose';
import mongoose from 'mongoose';
import { ReviewState } from '../models/ReviewState.js';
import { ReviewLog } from '../models/ReviewLog.js';
import { Item } from '../models/Item.js';

export async function createReviewState(itemId: string, data: Record<string, unknown>) {
  return ReviewState.create({ itemId, ...data });
}

export async function findReviewStateByItemId(itemId: string) {
  return ReviewState.findOne({ itemId });
}

export async function upsertReviewState(itemId: string, data: Record<string, unknown>) {
  return ReviewState.findOneAndUpdate(
    { itemId },
    { $set: data },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
}

export async function deleteReviewStateByItemId(itemId: string) {
  return ReviewState.deleteOne({ itemId });
}

export async function deleteReviewLogsByItemId(itemId: string) {
  return ReviewLog.deleteMany({ itemId });
}

export async function createReviewLog(data: Record<string, unknown>) {
  return ReviewLog.create(data);
}

export async function countDueReviews(now = new Date()) {
  return ReviewState.countDocuments({ dueAt: { $lte: now } });
}

export async function findDueReviews(
  filters: { type?: string; pronunciationLanguage?: string; tag?: string },
  limit: number,
  now = new Date()
) {
  const itemFilter: FilterQuery<typeof Item> = {};
  if (filters.type) itemFilter.type = filters.type;
  if (filters.pronunciationLanguage) itemFilter.pronunciationLanguage = filters.pronunciationLanguage;
  if (filters.tag) itemFilter.tags = filters.tag;

  const matchItem =
    Object.keys(itemFilter).length > 0
      ? await Item.find(itemFilter).select('_id').lean()
      : null;

  const stateFilter: FilterQuery<typeof ReviewState> = { dueAt: { $lte: now } };
  if (matchItem) {
    stateFilter.itemId = { $in: matchItem.map((i) => i._id) };
  }

  const states = await ReviewState.find(stateFilter).sort({ dueAt: 1 }).limit(limit).lean();
  const itemIds = states.map((s) => s.itemId);
  const items = await Item.find({ _id: { $in: itemIds } }).lean();
  const itemMap = new Map(items.map((i) => [String(i._id), i]));

  return states
    .map((state) => {
      const item = itemMap.get(String(state.itemId));
      if (!item) return null;
      return { item, review: state };
    })
    .filter(Boolean);
}

export async function listReviewHistory(from?: Date, to?: Date, page = 1, limit = 50) {
  const filter: FilterQuery<typeof ReviewLog> = {};
  if (from || to) {
    filter.reviewedAt = {};
    if (from) (filter.reviewedAt as Record<string, Date>).$gte = from;
    if (to) (filter.reviewedAt as Record<string, Date>).$lte = to;
  }

  const skip = (page - 1) * limit;
  const [logs, total] = await Promise.all([
    ReviewLog.find(filter).sort({ reviewedAt: -1 }).skip(skip).limit(limit).lean(),
    ReviewLog.countDocuments(filter),
  ]);

  return { logs, total };
}

export async function getReviewStats() {
  const now = new Date();
  const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  const [
    totalItems,
    dueToday,
    reviewedToday,
    totalReviews,
    recentItems,
    dailyReviews,
  ] = await Promise.all([
    Item.countDocuments(),
    ReviewState.countDocuments({ dueAt: { $lte: now } }),
    ReviewLog.countDocuments({ reviewedAt: { $gte: startOfToday } }),
    ReviewLog.countDocuments(),
    Item.countDocuments({
      createdAt: { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
    }),
    ReviewLog.aggregate([
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$reviewedAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: -1 } },
      { $limit: 30 },
    ]),
  ]);

  return {
    totalItems,
    dueToday,
    reviewedToday,
    totalReviews,
    recentItems,
    dailyReviews: dailyReviews
      .map((d) => ({ date: d._id as string, count: d.count as number }))
      .reverse(),
  };
}

export async function deleteAllReviewData() {
  await Promise.all([ReviewState.deleteMany({}), ReviewLog.deleteMany({})]);
}

export function isValidObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id);
}
