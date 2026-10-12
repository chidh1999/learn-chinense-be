import mongoose, { Schema, type InferSchemaType } from 'mongoose';

export const REVIEW_RATINGS = ['again', 'hard', 'good', 'easy'] as const;

const reviewLogSchema = new Schema(
  {
    itemId: {
      type: Schema.Types.ObjectId,
      ref: 'Item',
      required: true,
      index: true,
    },
    rating: {
      type: String,
      enum: REVIEW_RATINGS,
      required: true,
    },
    reviewedAt: {
      type: Date,
      required: true,
      index: true,
    },
    intervalDays: {
      type: Number,
      required: true,
    },
    easeFactor: {
      type: Number,
      required: true,
    },
    repetitions: {
      type: Number,
      required: true,
    },
  },
  { timestamps: false }
);

reviewLogSchema.index({ reviewedAt: 1, itemId: 1 });

export type ReviewLogDocument = InferSchemaType<typeof reviewLogSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const ReviewLog = mongoose.model('ReviewLog', reviewLogSchema);
