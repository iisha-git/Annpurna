import { model, Schema } from 'mongoose';

/**
 * MESS PRESENCE — tracks students currently inside the mess hall (geofenced).
 *
 * Uses a TTL index (expires: 3600 = 60 mins) to auto-evict students if their device
 * dies or loses connection before firing an exit event.
 */
const messPresenceSchema = new Schema(
  {
    student: { type: String, ref: 'Student', required: true, unique: true },
    enteredAt: { type: Date, default: () => new Date() },
    lastSeenAt: { type: Date, default: () => new Date(), expires: 3600 },
  },
  { versionKey: false }
);

export const MessPresence = model('MessPresence', messPresenceSchema);
