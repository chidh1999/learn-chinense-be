import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const reviewStateSchema = new Schema(
  {
    itemId: {
      type: Schema.Types.ObjectId,
      ref: 'Item',
      required: true,
      unique: true,
      index: true,
    },
    dueAt: {
      type: Date,
      required: true,
      index: true,
    },
    lastReviewedAt: {
      type: Date,
      default: null,
    },
    intervalDays: {
      type: Number,
      default: 0,
    },
    easeFactor: {
      type: Number,
      default: 2.5,
    },
    repetitions: {
      type: Number,
      default: 0,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
    correctCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export type ReviewStateDocument = InferSchemaType<typeof reviewStateSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const ReviewState = mongoose.model('ReviewState', reviewStateSchema);
