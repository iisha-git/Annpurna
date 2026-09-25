import { Router } from 'express';

import { requireAuth, requireOwner } from '../middleware/auth.js';
import { Leave } from '../models/Leave.js';

const router = Router();

const TYPES = ['normal', 'holiday', 'prep'];
const NORMAL_MONTHLY_CAP = 4; // Regular leave · 4 days per calendar month

function isoDate(dt) {
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** True only for real calendar dates, not just YYYY-MM-DD shaped strings. */
function isValidDate(value) {
  if (!DATE_RE.test(value)) return false;
  const y = Number(value.slice(0, 4));
  const m = Number(value.slice(5, 7));
  const day = Number(value.slice(8, 10));
  const dt = new Date(Date.UTC(y, m - 1, day));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === day;
}

function pickType(value) {
  return TYPES.includes(value) ? value : 'normal';
}

/** Count how many regular-leave days a student already has in a given month. */
async function normalCountInMonth(messNumber, month) {
  return Leave.countDocuments({
    messNumber,
    date: { $regex: new RegExp(`^${month}-`) },
    type: 'normal',
  });
}

/** GET /api/leaves — every leave, id = "{messNumber}_{YYYY-MM-DD}" (owner only). */
router.get('/', requireOwner, async (_req, res, next) => {
  try {
    const docs = await Leave.find().lean();
    res.json({
      leaves: docs.map((l) => ({
        id: `${l.messNumber}_${l.date}`,
        messNumber: l.messNumber,
        date: l.date,
        type: l.type || 'normal',
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

/**
 * PUT /api/leaves/toggle — add or revoke a single leave (owner only).
 * Adding regular leave is capped at NORMAL_MONTHLY_CAP per calendar month.
 */
router.put('/toggle', requireOwner, async (req, res, next) => {
  try {
    const messNumber = String(req.body.messNumber ?? '').trim();
    const date = String(req.body.date ?? '').trim();
    const type = pickType(req.body.type);
    if (!messNumber || !isValidDate(date)) {
      return res.status(400).json({ error: 'messNumber and date (YYYY-MM-DD) are required.' });
    }

    const existing = await Leave.findOne({ messNumber, date });
    if (existing) {
      await Leave.deleteOne({ messNumber, date });
      return res.json({ on: false, type });
    }

    if (type === 'normal') {
      const used = await normalCountInMonth(messNumber, date.slice(0, 7));
      if (used >= NORMAL_MONTHLY_CAP) {
        return res.status(400).json({
          code: 'LEAVE_LIMIT',
          error: `Regular leave is capped at ${NORMAL_MONTHLY_CAP} days per month (this month already has ${used}).`,
        });
      }
    }
    await Leave.create({ messNumber, date, type });
    res.json({ on: true, type });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/leaves/range — apply a leave of a given type across a date range.
 * body: { messNumber, from, to, type }
 * Each day becomes `{messNumber}_{date}` = type. Regular leave respects the
 * monthly cap — extra days beyond it are reported in `skipped`, holiday and
 * prep leave apply for however many days the student needs.
 */
router.put('/range', requireOwner, async (req, res, next) => {
  try {
    const messNumber = String(req.body.messNumber ?? '').trim();
    const from = String(req.body.from ?? '').trim();
    const to = String(req.body.to ?? '').trim();
    const type = pickType(req.body.type);

    if (!messNumber || !isValidDate(from) || !isValidDate(to)) {
      return res.status(400).json({ error: 'messNumber, from and to (YYYY-MM-DD) are required.' });
    }
    let d = new Date(`${from}T00:00:00`);
    const end = new Date(`${to}T00:00:00`);
    if (d > end) {
      return res.status(400).json({ error: 'from must be on or before to.' });
    }

    /* Snapshot every day in the range and the leave type already on file. */
    const dates = [];
    for (; d <= end; d.setDate(d.getDate() + 1)) dates.push(isoDate(d));

    const existing = new Map(
      (await Leave.find({ messNumber, date: { $in: dates } }).lean()).map((l) => [l.date, l.type])
    );

    const applied = [];
    const skipped = [];
    /* Regular-leave quota is tracked per calendar month. `monthUsed` is how
       many regular days are already on file; `monthAdded` is how many NEW
       regular days this request turns on. Days already marked regular are
       re-upserted for free and never consume the cap twice. */
    const monthUsed = {};
    const monthAdded = {};

    for (const date of dates) {
      if (type === 'normal' && existing.get(date) !== 'normal') {
        const month = date.slice(0, 7);
        if (monthUsed[month] === undefined) {
          monthUsed[month] = await normalCountInMonth(messNumber, month);
        }
        if (monthAdded[month] === undefined) monthAdded[month] = 0;
        if (monthUsed[month] + monthAdded[month] >= NORMAL_MONTHLY_CAP) {
          skipped.push({ id: `${messNumber}_${date}`, reason: 'limit' });
          continue;
        }
        monthAdded[month] += 1;
      }
      await Leave.updateOne(
        { messNumber, date },
        { $set: { type, markedAt: new Date() } },
        { upsert: true }
      );
      applied.push({ id: `${messNumber}_${date}`, type });
    }

    res.json({ applied, skipped });
  } catch (err) {
    next(err);
  }
});

export default router;