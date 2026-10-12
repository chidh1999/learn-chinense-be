import mongoose, { Schema, type InferSchemaType } from 'mongoose';

export const ITEM_TYPES = ['word', 'phrase', 'sentence'] as const;
export const PRONUNCIATION_LANGUAGES = ['zh-CN', 'yue-HK'] as const;

const itemSchema = new Schema(
  {
    type: {
      type: String,
      enum: ITEM_TYPES,
      required: true,
      index: true,
    },
    hanzi: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    pinyin: {
      type: String,
      default: '',
      trim: true,
      index: true,
    },
    meaningVi: {
      type: String,
      default: '',
      trim: true,
      index: true,
    },
    pronunciationLanguage: {
      type: String,
      enum: PRONUNCIATION_LANGUAGES,
      default: 'zh-CN',
      index: true,
    },
    examples: {
      type: [String],
      default: [],
    },
    source: {
      type: String,
      default: '',
      trim: true,
      index: true,
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
    audioRecordingPath: {
      type: String,
      default: null,
    },
    audioMimeType: {
      type: String,
      default: null,
    },
    audioOriginalName: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

itemSchema.index({ hanzi: 'text', pinyin: 'text', meaningVi: 'text', source: 'text' });

export type ItemDocument = InferSchemaType<typeof itemSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const Item = mongoose.model('Item', itemSchema);
