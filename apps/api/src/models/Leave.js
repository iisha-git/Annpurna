import { model, Schema } from 'mongoose';

/**
 * LEAVE — one doc per (messNumber, date) pair, unique together.
 *
 * Firestore keyed these as `${messNumber}_${YYYY-MM-DD}`. Here we keep the
 * fields separate and mirror the old compound id on the wire so the owner
 * panel can keep using `{messNumber}_{date}` as a Set key.
 */
const leaveSchema = new Schema(
  {
    messNumber: { type: String, required: true },
    date: { type: String, required: true }, // ISO "YYYY-MM-DD"
    markedAt: { type: Date, default: () => new Date() },
  },
  { versionKey: false }
);

leaveSchema.index({ messNumber: 1, date: 1 }, { unique: true });

export const Leave = model('Leave', leaveSchema);