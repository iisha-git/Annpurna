import { Router } from 'express';

import { requireAuth, requireOwner } from '../middleware/auth.js';
import { Leave } from '../models/Leave.js';
import { Student } from '../models/Student.js';
import { APP_DOWNLOAD_URL, WHATSAPP_TEMPLATE_NAME } from '../config.js';
import { sendWhatsApp } from '../lib/whatsapp.js';

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
  active: s.active !== false,
});

/** First exactly-10-digit number wins, digits only — same rule as the panel.
 *  The office sheets often list alternates like "83299076512/9763457429"
 *  where the first is malformed but a later one is clean. */
function normalizeMobile(raw) {
  const candidates = String(raw ?? '')
    .split(/[/\s,]+/)
    .map((n) => n.replace(/\D/g, ''))
    .filter((n) => n.length === 10);
  const digits = candidates[0] || '';
  return { digits, ok: digits.length === 10 };
}

/** GET /api/students/attendance-summary — today's attendance stats (owner only). */
router.get('/attendance-summary', requireOwner, async (req, res, next) => {
  try {
    const today = req.query.date || new Date().toISOString().slice(0, 10);
    const totalStudents = await Student.countDocuments({ active: { $ne: false } });
    const leavesToday = await Leave.find({ date: today }).lean();
    const onLeaveMessNumbers = leavesToday.map((l) => l.messNumber);
    const onLeaveCount = onLeaveMessNumbers.length;
    const presentCount = Math.max(0, totalStudents - onLeaveCount);

    res.json({
      date: today,
      total: totalStudents,
      present: presentCount,
      onLeave: onLeaveCount,
      absent: onLeaveCount,
      onLeaveMessNumbers,
    });
  } catch (err) {
    next(err);
  }
});

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

/**
 * POST /api/students — quick-add a single student (owner only).
 * body: { messNumber, name, year?, branch?, room?, mobile }
 * Re-adding an existing number updates demographics only and reactivates a
 * removed entry; claim fields are never touched.
 */
router.post('/', requireOwner, async (req, res, next) => {
  try {
    const messNo = String(req.body?.messNumber ?? '').trim();
    if (!/^\d+$/.test(messNo)) {
      return res.status(400).json({ error: 'Enter a numeric mess number.' });
    }
    const name = String(req.body?.name ?? '').replace(/\s+/g, ' ').trim();
    if (!name) return res.status(400).json({ error: 'Enter the student name.' });
    const { digits, ok } = normalizeMobile(req.body?.mobile);
    if (!ok) return res.status(400).json({ error: 'Enter a valid 10-digit mobile number.' });

    const student = await Student.findOneAndUpdate(
      { _id: messNo },
      {
        $set: {
          name,
          mobile: digits,
          year: req.body?.year || null,
          branch: req.body?.branch || null,
          room: req.body?.room || null,
          active: true,
        },
        $unset: { removedAt: 1 },
      },
      { upsert: true, setDefaultsOnInsert: true, new: true }
    );

    res.json({ student: rosterView(student) });
  } catch (err) {
    next(err);
  }
});

/** DELETE /api/students/:messNumber — remove a roster entry (soft). */
router.delete('/:messNumber', requireOwner, async (req, res, next) => {
  try {
    await Student.updateOne(
      { _id: req.params.messNumber },
      { $set: { active: false, removedAt: new Date() } }
    );
    res.json({ ok: true, active: false });
  } catch (err) {
    next(err);
  }
});

/** POST /api/students/:messNumber/restore — bring a soft-removed entry back. */
router.post('/:messNumber/restore', requireOwner, async (req, res, next) => {
  try {
    const student = await Student.findOneAndUpdate(
      { _id: req.params.messNumber },
      { $set: { active: true }, $unset: { removedAt: 1 } },
      { new: true }
    );
    if (!student) return res.status(404).json({ error: 'Not in the roster.' });
    res.json({ student: rosterView(student) });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/students/:messNumber/invite — WhatsApp the student app download +
 * signup instructions to that row's mobile number (owner only).
 */
router.post('/:messNumber/invite', requireOwner, async (req, res, next) => {
  try {
    const student = await Student.findById(String(req.params.messNumber));
    if (!student || student.active === false) {
      return res.status(404).json({ error: 'Not in the roster.' });
    }

    const { digits } = normalizeMobile(student.mobile);
    if (!digits) {
      return res.status(400).json({ error: 'No valid 10-digit mobile on file.' });
    }

    const result = await sendWhatsApp(digits, { name: student.name, messNumber: student._id });
    if (!result.ok) {
      return res.json({
        sent: false,
        manual: true,
        message: result.message,
        downloadUrl: APP_DOWNLOAD_URL,
      });
    }

    res.json({ sent: true, to: result.to, messageId: result.messageId, template: WHATSAPP_TEMPLATE_NAME });
  } catch (err) {
    next(err);
  }
});

export default router;