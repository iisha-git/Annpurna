import { model, Schema } from 'mongoose';

/**
 * CROWD REPORT — a student's real-time vote on the crowd level.
 * 
 * We use a TTL index (expires: 1800) to automatically delete these documents
 * 30 minutes after they are created, keeping the status live and fresh.
 */
const crowdReportSchema = new Schema(
  {
    student: { type: String, ref: 'Student', required: true },
    level: { type: String, enum: ['LOW', 'MODERATE', 'HIGH'], required: true },
    createdAt: { type: Date, default: () => new Date(), expires: 1800 },
  },
  { versionKey: false }
);

export const CrowdReport = model('CrowdReport', crowdReportSchema);
