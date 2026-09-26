import { Router } from 'express';

import { requireAuth } from '../middleware/auth.js';
import { MessPresence } from '../models/MessPresence.js';
import { MessConfig } from '../models/MessConfig.js';

const router = Router();

const DEFAULT_GEOFENCE = {
  latitude: 19.6166052,
  longitude: 74.1841384,
  radiusMeters: 10,
};

/** GET /api/presence/geofence-config — Fetch active mess location for all students. */
router.get('/geofence-config', async (_req, res, next) => {
  try {
    const config = await MessConfig.findById('primary').lean();
    if (!config) {
      return res.json({
        latitude: DEFAULT_GEOFENCE.latitude,
        longitude: DEFAULT_GEOFENCE.longitude,
        radiusMeters: DEFAULT_GEOFENCE.radiusMeters,
        updatedBy: 'Default',
        updatedAt: null,
      });
    }
    res.json({
      latitude: config.latitude,
      longitude: config.longitude,
      radiusMeters: config.radiusMeters || DEFAULT_GEOFENCE.radiusMeters,
      updatedBy: config.updatedBy,
      updatedAt: config.updatedAt,
    });
  } catch (err) {
    next(err);
  }
});

/** PUT /api/presence/geofence-config — Admin update mess location (Isha Singh or Owner only). */
router.put('/geofence-config', requireAuth, async (req, res, next) => {
  try {
    const user = req.user;
    const isOwner = user?.role === 'owner';
    const isIsha =
      String(user?.messNumber || '').trim() === '164' ||
      String(user?.mobile || '').replace(/\D/g, '').includes('7020822465') ||
      /isha/i.test(user?.name || '');

    if (!isOwner && !isIsha) {
      return res.status(403).json({
        error: 'Only Isha Singh or Mess Owner can update the official mess location.',
      });
    }

    const { latitude, longitude, radiusMeters } = req.body || {};
    if (latitude == null || longitude == null) {
      return res.status(400).json({ error: 'Latitude and longitude are required.' });
    }

    const updated = await MessConfig.findOneAndUpdate(
      { _id: 'primary' },
      {
        latitude: Number(latitude),
        longitude: Number(longitude),
        radiusMeters: Number(radiusMeters) || 10,
        updatedBy: user.name || (isOwner ? 'Owner' : 'SINGH ISHA'),
        updatedAt: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({
      success: true,
      message: 'Official mess geofence location saved to cloud database.',
      config: {
        latitude: updated.latitude,
        longitude: updated.longitude,
        radiusMeters: updated.radiusMeters,
        updatedBy: updated.updatedBy,
        updatedAt: updated.updatedAt,
      },
    });
  } catch (err) {
    next(err);
  }
});

/** POST /api/presence/enter — Register a student arriving inside the mess hall. */
router.post('/enter', requireAuth, async (req, res, next) => {
  try {
    const student = req.user.messNumber;
    if (!student) {
      return res.status(400).json({ error: 'Only registered students can check into mess presence.' });
    }

    await MessPresence.findOneAndUpdate(
      { student },
      { student, lastSeenAt: new Date() },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const count = await MessPresence.countDocuments();
    res.json({ success: true, isInside: true, count });
  } catch (err) {
    next(err);
  }
});

/** POST /api/presence/leave — Register a student leaving the mess hall. */
router.post('/leave', requireAuth, async (req, res, next) => {
  try {
    const student = req.user.messNumber;
    if (student) {
      await MessPresence.deleteOne({ student });
    }

    const count = await MessPresence.countDocuments();
    res.json({ success: true, isInside: false, count });
  } catch (err) {
    next(err);
  }
});

/** POST /api/presence/heartbeat — Keep student presence active while eating. */
router.post('/heartbeat', requireAuth, async (req, res, next) => {
  try {
    const student = req.user.messNumber;
    if (student) {
      await MessPresence.updateOne({ student }, { lastSeenAt: new Date() });
    }

    const count = await MessPresence.countDocuments();
    res.json({ success: true, count });
  } catch (err) {
    next(err);
  }
});

/** GET /api/presence/count — Get real-time count of students inside mess. */
router.get('/count', async (_req, res, next) => {
  try {
    const count = await MessPresence.countDocuments();
    res.json({ count });
  } catch (err) {
    next(err);
  }
});

export default router;
