import mongoose from 'mongoose';

const messConfigSchema = new mongoose.Schema(
  {
    _id: { type: String, default: 'primary' },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    radiusMeters: { type: Number, default: 10 },
    updatedBy: { type: String, default: 'System' },
    updatedAt: { type: Date, default: Date.now },
  },
  { collection: 'mess_config' }
);

export const MessConfig = mongoose.model('MessConfig', messConfigSchema);
