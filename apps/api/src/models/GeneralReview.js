import { model, Schema } from 'mongoose';

/**
 * GENERAL REVIEW — a student's feedback on the mess.
 */
const generalReviewSchema = new Schema(
  {
    student: { type: String, ref: 'Student', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
    createdAt: { type: Date, default: () => new Date() },
  },
  { versionKey: false }
);

export const GeneralReview = model('GeneralReview', generalReviewSchema);
