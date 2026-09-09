import { model, Schema } from 'mongoose';

/**
 * WORKER — mess staff details (cooks, helpers, cleaners).
 */
const workerSchema = new Schema(
  {
    name: { type: String, required: true },
    role: { type: String, required: true },
    salary: { type: String, required: true },
    mobile: { type: String },
    status: { type: String, enum: ['Working', 'On Leave'], default: 'Working' },
    joinedAt: { type: Date, default: () => new Date() },
  },
  { versionKey: false }
);

export const Worker = model('Worker', workerSchema);
