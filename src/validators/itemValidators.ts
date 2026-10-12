import { z } from 'zod';
import { ITEM_TYPES, PRONUNCIATION_LANGUAGES } from '../models/Item.js';
import { REVIEW_RATINGS } from '../models/ReviewLog.js';

const objectIdRegex = /^[a-fA-F0-9]{24}$/;

export const objectIdSchema = z.string().regex(objectIdRegex, 'Invalid ObjectId');

export const createItemSchema = z.object({
  type: z.enum(ITEM_TYPES),
  hanzi: z.string().trim().min(1, 'hanzi is required').max(500),
  pinyin: z.string().trim().max(1000).optional().default(''),
  meaningVi: z.string().trim().max(2000).optional().default(''),
  pronunciationLanguage: z.enum(PRONUNCIATION_LANGUAGES).optional().default('zh-CN'),
  examples: z.array(z.string().trim().max(1000)).optional().default([]),
  source: z.string().trim().max(500).optional().default(''),
  tags: z.array(z.string().trim().min(1).max(50)).optional().default([]),
  notes: z.string().trim().max(5000).optional().default(''),
});

export const updateItemSchema = createItemSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided' }
);

export const listItemsQuerySchema = z.object({
  q: z.string().optional(),
  type: z.enum(ITEM_TYPES).optional(),
  pronunciationLanguage: z.enum(PRONUNCIATION_LANGUAGES).optional(),
  tag: z.string().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'dueAt']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export const dueReviewsQuerySchema = z.object({
  type: z.enum(ITEM_TYPES).optional(),
  pronunciationLanguage: z.enum(PRONUNCIATION_LANGUAGES).optional(),
  tag: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
});

export const completeReviewSchema = z.object({
  rating: z.enum(REVIEW_RATINGS),
});

export const historyQuerySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
});

export const importItemSchema = createItemSchema.extend({
  id: objectIdSchema.optional(),
  audioRecordingPath: z.string().nullable().optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export const importPayloadSchema = z.object({
  version: z.number().int().optional().default(1),
  items: z.array(importItemSchema).min(1, 'items must not be empty'),
  mode: z.enum(['merge', 'replace']).optional().default('merge'),
});
