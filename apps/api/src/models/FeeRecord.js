import { model, Schema } from 'mongoose';

/**
 * FEE RECORD — monthly mess fee payment status per student.
 */
const feeRecordSchema = new Schema(
  {
    messNumber: { type: String, required: true },
    month: { type: String, required: true }, // e.g. "2026-09"
    amount: { type: Number, required: true, default: 3000 },
    status: { type: String, enum: ['PAID', 'PENDING'], default: 'PENDING' },
    paymentMode: { type: String, enum: ['UPI', 'Cash', 'Bank Transfer', 'Other'], default: 'UPI' },
    paidAt: { type: Date },
    note: { type: String },
  },
  { versionKey: false }
);

feeRecordSchema.index({ messNumber: 1, month: 1 }, { unique: true });

export const FeeRecord = model('FeeRecord', feeRecordSchema);
