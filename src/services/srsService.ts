import type { REVIEW_RATINGS } from '../models/ReviewLog.js';

export type ReviewRating = (typeof REVIEW_RATINGS)[number];

export interface SrsState {
  intervalDays: number;
  easeFactor: number;
  repetitions: number;
}

export interface SrsResult extends SrsState {
  dueAt: Date;
  isCorrect: boolean;
}

const MIN_EASE = 1.3;

/**
 * Simplified SM-2 style spaced repetition.
 * again  -> reset reps, interval 0 (due again soon: 10 minutes via fractional day)
 * hard   -> interval * 1.2, ease -0.15
 * good   -> first: 1d, second: 3d, else interval * ease
 * easy   -> first: 2d, second: 4d, else interval * ease * 1.3, ease +0.15
 */
export function scheduleReview(current: SrsState, rating: ReviewRating, now = new Date()): SrsResult {
  let { intervalDays, easeFactor, repetitions } = current;
  let isCorrect = true;

  if (rating === 'again') {
    repetitions = 0;
    intervalDays = 0;
    easeFactor = Math.max(MIN_EASE, easeFactor - 0.2);
    isCorrect = false;
    const dueAt = new Date(now.getTime() + 10 * 60 * 1000);
    return { intervalDays, easeFactor, repetitions, dueAt, isCorrect };
  }

  if (rating === 'hard') {
    easeFactor = Math.max(MIN_EASE, easeFactor - 0.15);
    if (repetitions === 0) {
      intervalDays = 1;
    } else {
      intervalDays = Math.max(1, Math.round(intervalDays * 1.2));
    }
    repetitions += 1;
  } else if (rating === 'good') {
    if (repetitions === 0) {
      intervalDays = 1;
    } else if (repetitions === 1) {
      intervalDays = 3;
    } else {
      intervalDays = Math.max(1, Math.round(intervalDays * easeFactor));
    }
    repetitions += 1;
  } else {
    // easy
    easeFactor = easeFactor + 0.15;
    if (repetitions === 0) {
      intervalDays = 2;
    } else if (repetitions === 1) {
      intervalDays = 4;
    } else {
      intervalDays = Math.max(1, Math.round(intervalDays * easeFactor * 1.3));
    }
    repetitions += 1;
  }

  const dueAt = new Date(now);
  dueAt.setUTCHours(0, 0, 0, 0);
  dueAt.setUTCDate(dueAt.getUTCDate() + intervalDays);

  return { intervalDays, easeFactor, repetitions, dueAt, isCorrect };
}

export function createInitialReviewState(now = new Date()) {
  return {
    dueAt: now,
    lastReviewedAt: null as Date | null,
    intervalDays: 0,
    easeFactor: 2.5,
    repetitions: 0,
    reviewCount: 0,
    correctCount: 0,
  };
}
