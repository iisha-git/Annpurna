import { Router } from 'express';
import { requireOwner } from '../middleware/auth.js';
import { FeeRecord } from '../models/FeeRecord.js';
import { Student } from '../models/Student.js';

const router = Router();

const DEFAULT_FEE_AMOUNT = 3000;

function getCurrentMonthKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** GET /api/fees — monthly fee overview & roster payment statuses (owner only) */
router.get('/', requireOwner, async (req, res, next) => {
  try {
    const month = req.query.month || getCurrentMonthKey();
    const monthlyFee = Number(req.query.fee) || DEFAULT_FEE_AMOUNT;

    const students = await Student.find({ active: { $ne: false } }).lean();
    const paidRecords = await FeeRecord.find({ month, status: 'PAID' }).lean();
    const paidMap = new Map(paidRecords.map((r) => [r.messNumber, r]));

    const roster = students
      .map((s) => {
        const payment = paidMap.get(s._id);
        const isPaid = !!payment;
        return {
          messNumber: s._id,
          name: s.name,
          room: s.room || '—',
          branch: s.branch || '—',
          year: s.year || '—',
          mobile: s.mobile || '—',
          status: isPaid ? 'PAID' : 'PENDING',
          amount: isPaid ? payment.amount : monthlyFee,
          paymentMode: payment?.paymentMode || null,
          paidAt: payment?.paidAt || null,
        };
      })
      .sort((a, b) => Number(a.messNumber) - Number(b.messNumber));

    const totalStudents = roster.length;
    const paidCount = paidRecords.length;
    const pendingCount = Math.max(0, totalStudents - paidCount);
    const expectedAmount = totalStudents * monthlyFee;
    const collectedAmount = paidRecords.reduce((acc, r) => acc + (r.amount || monthlyFee), 0);
    const pendingAmount = Math.max(0, expectedAmount - collectedAmount);

    res.json({
      month,
      monthlyFee,
      totalStudents,
      paidCount,
      pendingCount,
      expectedAmount,
      collectedAmount,
      pendingAmount,
      percentCollected: totalStudents > 0 ? Math.round((paidCount / totalStudents) * 100) : 0,
      stats: {
        total: totalStudents,
        paidCount,
        pendingCount,
        totalCollected: collectedAmount,
        totalPending: pendingAmount,
      },
      students: roster,
    });
  } catch (err) {
    next(err);
  }
});

/** POST /api/fees/pay — mark a student's fee as paid (owner only) */
router.post('/pay', requireOwner, async (req, res, next) => {
  try {
    const { messNumber, month, amount, paymentMode, note } = req.body;
    if (!messNumber) return res.status(400).json({ error: 'messNumber is required.' });

    const monthKey = month || getCurrentMonthKey();
    const feeAmount = Number(amount) || DEFAULT_FEE_AMOUNT;

    const record = await FeeRecord.findOneAndUpdate(
      { messNumber, month: monthKey },
      {
        $set: {
          messNumber,
          month: monthKey,
          amount: feeAmount,
          status: 'PAID',
          paymentMode: paymentMode || 'UPI',
          paidAt: new Date(),
          note: note || '',
        },
      },
      { upsert: true, new: true }
    );

    res.json({ success: true, record });
  } catch (err) {
    next(err);
  }
});

/** POST /api/fees/unpay — revert payment status to PENDING (owner only) */
router.post('/unpay', requireOwner, async (req, res, next) => {
  try {
    const { messNumber, month } = req.body;
    if (!messNumber) return res.status(400).json({ error: 'messNumber is required.' });

    const monthKey = month || getCurrentMonthKey();
    await FeeRecord.findOneAndUpdate(
      { messNumber, month: monthKey },
      {
        $set: {
          status: 'PENDING',
          paidAt: null,
        },
      },
      { upsert: true, new: true }
    );

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
