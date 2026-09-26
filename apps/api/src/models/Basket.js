import { model, Schema } from 'mongoose';

/**
 * BASKET — items the owner has queued to be used/consumed today.
 * Each entry links to an Inventory item and records the amount to deduct.
 * A TTL index auto-expires records after 24 hours so each day starts fresh.
 */
const basketSchema = new Schema(
  {
    inventoryId: { type: Schema.Types.ObjectId, ref: 'Inventory', required: true },
    item: { type: String, required: true },
    unit: { type: String, required: true, default: 'kg' },
    amount: { type: Number, required: true, min: 0 },
    addedAt: { type: Date, default: () => new Date() },
    /** TTL field — document auto-deletes 24 h after creation */
    expiresAt: { type: Date, default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) },
  },
  { versionKey: false }
);

basketSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Basket = model('Basket', basketSchema);
