import { model, Schema } from 'mongoose';

/**
 * INVENTORY — groceries, vegetables, and kitchen supplies.
 */
const inventorySchema = new Schema(
  {
    item: { type: String, required: true },
    qty: { type: Number, required: true, default: 0 },
    unit: { type: String, required: true, default: 'kg' },
    minThreshold: { type: Number, default: 10 },
    updatedAt: { type: Date, default: () => new Date() },
  },
  { versionKey: false }
);

export const Inventory = model('Inventory', inventorySchema);
