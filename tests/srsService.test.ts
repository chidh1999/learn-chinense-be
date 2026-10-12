import { describe, expect, it } from 'vitest';
import { scheduleReview, createInitialReviewState } from '../src/services/srsService.js';

describe('scheduleReview', () => {
  const base = createInitialReviewState(new Date('2026-01-01T00:00:00.000Z'));

  it('resets on again and schedules soon', () => {
    const progressed = scheduleReview(
      { intervalDays: 5, easeFactor: 2.5, repetitions: 3 },
      'again',
      new Date('2026-01-01T12:00:00.000Z')
    );
    expect(progressed.repetitions).toBe(0);
    expect(progressed.intervalDays).toBe(0);
    expect(progressed.isCorrect).toBe(false);
    expect(progressed.dueAt.getTime()).toBe(new Date('2026-01-01T12:10:00.000Z').getTime());
  });

  it('schedules first good review for 1 day', () => {
    const result = scheduleReview(
      { intervalDays: base.intervalDays, easeFactor: base.easeFactor, repetitions: base.repetitions },
      'good',
      new Date('2026-01-01T00:00:00.000Z')
    );
    expect(result.intervalDays).toBe(1);
    expect(result.repetitions).toBe(1);
    expect(result.isCorrect).toBe(true);
    expect(result.dueAt.toISOString().startsWith('2026-01-02')).toBe(true);
  });

  it('increases ease on easy', () => {
    const result = scheduleReview(
      { intervalDays: 0, easeFactor: 2.5, repetitions: 0 },
      'easy',
      new Date('2026-01-01T00:00:00.000Z')
    );
    expect(result.easeFactor).toBeGreaterThan(2.5);
    expect(result.intervalDays).toBe(2);
  });

  it('applies hard multiplier after first review', () => {
    const result = scheduleReview(
      { intervalDays: 10, easeFactor: 2.5, repetitions: 2 },
      'hard',
      new Date('2026-01-01T00:00:00.000Z')
    );
    expect(result.intervalDays).toBe(12);
    expect(result.easeFactor).toBeLessThan(2.5);
  });
});
