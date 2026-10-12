import mongoose from 'mongoose';
import { ApiError } from '../utils/ApiError.js';
import * as itemRepo from '../repositories/itemRepository.js';
import * as reviewRepo from '../repositories/reviewRepository.js';
import { createInitialReviewState } from './srsService.js';
import { importPayloadSchema } from '../validators/itemValidators.js';
import type { z } from 'zod';

type ImportPayload = z.infer<typeof importPayloadSchema>;

export async function exportData() {
  const items = await itemRepo.findAllItems();
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    items: items.map((item) => ({
      id: String(item._id),
      type: item.type,
      hanzi: item.hanzi,
      pinyin: item.pinyin,
      meaningVi: item.meaningVi,
      pronunciationLanguage: item.pronunciationLanguage,
      examples: item.examples,
      source: item.source,
      tags: item.tags,
      notes: item.notes,
      audioRecordingPath: item.audioRecordingPath,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    })),
  };
}

export async function importData(raw: unknown) {
  const payload: ImportPayload = importPayloadSchema.parse(raw);
  const errors: Array<{ index: number; message: string }> = [];

  payload.items.forEach((item, index) => {
    if (!item.hanzi?.trim()) {
      errors.push({ index, message: 'hanzi is required' });
    }
  });

  if (errors.length > 0) {
    throw new ApiError(400, 'Import validation failed', errors);
  }

  if (payload.mode === 'replace') {
    await reviewRepo.deleteAllReviewData();
    await itemRepo.deleteAllItems();
  }

  let created = 0;
  let skipped = 0;
  const createdIds: string[] = [];

  for (let i = 0; i < payload.items.length; i++) {
    const entry = payload.items[i];
    try {
      if (payload.mode === 'merge' && entry.id && reviewRepo.isValidObjectId(entry.id)) {
        const existing = await itemRepo.findItemById(entry.id);
        if (existing) {
          skipped += 1;
          continue;
        }
      }

      const doc: Record<string, unknown> = {
        type: entry.type,
        hanzi: entry.hanzi,
        pinyin: entry.pinyin ?? '',
        meaningVi: entry.meaningVi ?? '',
        pronunciationLanguage: entry.pronunciationLanguage ?? 'zh-CN',
        examples: entry.examples ?? [],
        source: entry.source ?? '',
        tags: entry.tags ?? [],
        notes: entry.notes ?? '',
        audioRecordingPath: null,
      };

      if (payload.mode === 'merge' && entry.id && reviewRepo.isValidObjectId(entry.id)) {
        doc._id = new mongoose.Types.ObjectId(entry.id);
      }

      const item = await itemRepo.createItem(doc);
      await reviewRepo.createReviewState(String(item._id), createInitialReviewState());
      created += 1;
      createdIds.push(String(item._id));
    } catch (err) {
      errors.push({
        index: i,
        message: err instanceof Error ? err.message : 'Failed to import item',
      });
    }
  }

  if (errors.length > 0 && created === 0) {
    throw new ApiError(400, 'Import failed for all items', errors);
  }

  return {
    created,
    skipped,
    errors,
    createdIds,
  };
}
