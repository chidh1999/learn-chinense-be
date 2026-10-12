import type { FilterQuery } from 'mongoose';
import { Item, type ItemDocument } from '../models/Item.js';

export interface ItemListFilter {
  q?: string;
  type?: string;
  pronunciationLanguage?: string;
  tag?: string;
}

export interface Pagination {
  page: number;
  limit: number;
}

export async function createItem(data: Record<string, unknown>) {
  return Item.create(data);
}

export async function findItemById(id: string) {
  return Item.findById(id);
}

export async function updateItemById(id: string, data: Record<string, unknown>) {
  return Item.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true });
}

export async function deleteItemById(id: string) {
  return Item.findByIdAndDelete(id);
}

export async function countItems(filter: FilterQuery<ItemDocument> = {}) {
  return Item.countDocuments(filter);
}

export async function listItems(
  filter: ItemListFilter,
  pagination: Pagination,
  sortBy: string,
  sortOrder: 'asc' | 'desc'
) {
  const query: FilterQuery<ItemDocument> = {};

  if (filter.type) query.type = filter.type;
  if (filter.pronunciationLanguage) query.pronunciationLanguage = filter.pronunciationLanguage;
  if (filter.tag) query.tags = filter.tag;

  if (filter.q) {
    const regex = new RegExp(escapeRegex(filter.q), 'i');
    query.$or = [
      { hanzi: regex },
      { pinyin: regex },
      { meaningVi: regex },
      { source: regex },
    ];
  }

  const skip = (pagination.page - 1) * pagination.limit;
  const sort: Record<string, 1 | -1> = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

  const [items, total] = await Promise.all([
    Item.find(query).sort(sort).skip(skip).limit(pagination.limit).lean(),
    Item.countDocuments(query),
  ]);

  return { items, total };
}

export async function findAllItems() {
  return Item.find({}).sort({ createdAt: -1 }).lean();
}

export async function deleteAllItems(): Promise<{ acknowledged: boolean; deletedCount: number }> {
  return Item.deleteMany({});
}

export async function insertManyItems(docs: Partial<ItemDocument>[]) {
  return Item.insertMany(docs, { ordered: false });
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
