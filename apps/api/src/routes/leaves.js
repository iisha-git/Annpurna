import { Router } from 'express';

import { requireAuth, requireOwner } from '../middleware/auth.js';
import { Leave } from '../models/Leave.js';

const router = Router();

/** GET /api/leaves — every leave, id = "{messNumber}_{YYYY-MM-DD}" (owner only). */
router.get('/', requireOwner, async (_req, res, next) => {
  try {
    const docs = await Leave.find().lean();
    res.json({
      leaves: docs.map((l) => ({
        id: `${l.messNumber}_${l.date}`,
        messNumber: l.messNumber,
        date: l.date,
      })),
    });
  } catch (err) {
    next(err);
  }
});

/** GET /api/leaves/mine — the signed-in student's approved leave dates. */
router.get('/mine', requireAuth, async (req, res, next) => {
  try {
    if (req.user.role !== 'student') return res.status(403).json({ error: 'Students only.' });
    const docs = await Leave.find({ messNumber: req.user.messNumber }).lean();
    res.json({ dates: docs.map((l) => l.date) });
  } catch (err) {
    next(err);
  }
});

/** PUT /api/leaves/toggle — add or revoke a leave (owner only). */
router.put('/toggle', requireOwner, async (req, res, next) => {
  try {
    const messNumber = String(req.body.messNumber ?? '').trim();
    const date = String(req.body.date ?? '').trim();
    if (!messNumber || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'messNumber and date (YYYY-MM-DD) are required.' });
    }

    const existing = await Leave.findOne({ messNumber, date });
    if (existing) {
      await Leave.deleteOne({ messNumber, date });
      return res.json({ on: false });
    }
    await Leave.create({ messNumber, date });
    res.json({ on: true });
  } catch (err) {
    next(err);
  }
});

export default router;