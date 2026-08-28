import { model, Schema } from 'mongoose';

/** One meal slot of a day — a list of dish names. */
const mealSchema = new Schema(
  {
    BREAKFAST: { type: [String], default: [] },
    LUNCH: { type: [String], default: [] },
    SNACKS: { type: [String], default: [] },
    DINNER: { type: [String], default: [] },
  },
  { _id: false }
);

/**
 * MENU — a singleton document (always _id "current") holding the whole
 * week, keyed MON..SUN → BREAKFAST/LUNCH/SNACKS/DINNER → string[].
 * Owner PUTs a full replacement; students GET it read-only.
 */
const menuSchema = new Schema(
  {
    _id: { type: String, default: 'current' },
    MON: { type: mealSchema, default: () => ({}) },
    TUE: { type: mealSchema, default: () => ({}) },
    WED: { type: mealSchema, default: () => ({}) },
    THU: { type: mealSchema, default: () => ({}) },
    FRI: { type: mealSchema, default: () => ({}) },
    SAT: { type: mealSchema, default: () => ({}) },
    SUN: { type: mealSchema, default: () => ({}) },
  },
  { versionKey: false }
);

export const Menu = model('Menu', menuSchema);