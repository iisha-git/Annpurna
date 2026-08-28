import { model, Schema } from 'mongoose';

/**
 * OWNER — the single mess-owner account. Seeded via `npm run seed`
 * (email + password from .env). Full write power over everything.
 */
const ownerSchema = new Schema(
  {
    name: { type: String, default: 'Mess Owner' },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true, select: false },
  },
  { versionKey: false }
);

export const Owner = model('Owner', ownerSchema);