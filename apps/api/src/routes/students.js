import { Router } from 'express';

import { requireAuth, requireOwner } from '../middleware/auth.js';
import { Student } from '../models/Student.js';

const router = Router();

const rosterView = (s) => ({
  id: s._id,
  messNumber: s._id,
  name: s.name,
  year: s.year || null,
  branch: s.branch || null,
  room: s.room || null,
  mobile: s.mobile || null,
  claimed: !!s.claimed,
});

/** First number wins, digits only, must be 10 long — same rule as the panel. */
function normalizeMobile(raw) {
  const first = String(raw ?? '').split(/[/\s,]+/)[0];
  const digits = first.replace(/\D/g, '');
  return { digits, ok: digits.length === 10 };
}

/** GET /api/students — full roster (owner only). */
router.get('/', requireOwner, async (_req, res, next) => {
  try {
    const docs = await Student.find().lean();
    res.json({ students: docs.map(rosterView) });
  } catch (err) {
    next(err);
  }
});

/** GET /api/students/me — the signed-in student's profile. */
router.get('/me', requireAuth, (req, res) => {
  if (req.user.role !== 'student') return res.status(403).json({ error: 'Students only.' });
  res.json({ student: req.user });
});

/**
 * POST /api/students/import — bulk roster upsert (owner only).
 * body: { students: [{ messNumber, name, year?, branch?, room?, mobile }] }
 * Merge semantics: claim fields (passwordHash/claimed/claimedAt) are never
 * touched. Rows with a missing/abnormal mobile are skipped and reported.
 */
router.post('/import', requireOwner, async (req, res, next) => {
  try {
    const list = Array.isArray(req.body?.students) ? req.body.students : [];
    const good = [];
    const skipped = [];

    for (const item of list) {
      const messNo = String(item?.messNumber ?? item?.id ?? '').trim();
      if (!/^\d+$/.test(messNo)) continue; // header row / junk
      const name = String(item?.name ?? '').replace(/\s+/g, ' ').trim();
      const { digits, ok } = normalizeMobile(item?.mobile);
      if (!ok || !name) {
        skipped.push({ messNumber: messNo, name: name || '(no name)' });
        continue;
      }
      good.push({
        messNumber: messNo,
        name,
        mobile: digits,
        year: item?.year || null,
        branch: item?.branch || null,
        room: item?.room || null,
      });
    }

    if (good.length) {
      await Student.bulkWrite(
        good.map((g) => ({
          updateOne: {
            filter: { _id: g.messNumber },
            update: {
              $set: { name: g.name, mobile: g.mobile, year: g.year, branch: g.branch, room: g.room },
            },
            upsert: true,
            setDefaultsOnInsert: true,
          },
        }))
      );
    }

    res.json({ imported: good.length, skipped });
  } catch (err) {
    next(err);
  }
});

/** DELETE /api/students/:messNumber — remove a roster entry (owner only). */
router.delete('/:messNumber', requireOwner, async (req, res, next) => {
  try {
    await Student.findByIdAndDelete(req.params.messNumber);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;