import { Router } from 'express';

import { requireAuth } from '../middleware/auth.js';
import { MessPresence } from '../models/MessPresence.js';

const router = Router();

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
