import { model, Schema } from 'mongoose';

/**
 * STUDENT — one doc per mess number (the mess-number string is the _id).
 *
 * Owner pre-imports the roster (name/year/branch/room/mobile). The student
 * "claims" their doc at signup by matching name + mobile, which adds the
 * passwordHash + claimed flag. Merged re-imports never touch claim fields.
 */
const studentSchema = new Schema(
  {
    _id: { type: String, required: true }, // mess number, e.g. "118"
    name: { type: String, required: true, index: true },
    year: String,
    branch: String,
    room: String,
    mobile: String,
    passwordHash: { type: String, select: false },
    claimed: { type: Boolean, default: false },
    claimedAt: Date,
  },
  { versionKey: false }
);

export const Student = model('Student', studentSchema);