import { model, Schema } from 'mongoose';

/**
 * INVENTORY — groceries, vegetables, and kitchen supplies.
 */
const inventorySchema = new Schema(
  {
    item: { type: String, required: true },
    item_name: { type: String },
    qty: { type: Number, required: true, default: 0 },
    quantity: { type: Number, default: 0 },
    unit: { type: String, required: true, default: 'kg' },
    category: { type: String, default: 'Groceries' },
    minThreshold: { type: Number, default: 10 },
    updatedAt: { type: Date, default: () => new Date() },
  },
  { versionKey: false }
);

// Keep item / item_name and qty / quantity in sync
inventorySchema.pre('save', function (next) {
  if (this.item && !this.item_name) this.item_name = this.item;
  if (this.item_name && !this.item) this.item = this.item_name;
  if (this.qty !== undefined && (this.quantity === undefined || this.quantity === 0)) this.quantity = this.qty;
  if (this.quantity !== undefined && (this.qty === undefined || this.qty === 0)) this.qty = this.quantity;
  next();
});

export const Inventory = model('Inventory', inventorySchema);
