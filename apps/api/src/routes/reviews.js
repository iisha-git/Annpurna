import { Router } from 'express';

import { requireAuth, requireOwner } from '../middleware/auth.js';
import { CrowdReport } from '../models/CrowdReport.js';
import { GeneralReview } from '../models/GeneralReview.js';
import { MessPresence } from '../models/MessPresence.js';

const router = Router();

const MIN_RESPONSES = 3;
const SEVERITY = ['LOW', 'MODERATE', 'HIGH'];

/** POST /api/reviews/crowd — Submit a real-time crowd level. Limited to 1 per 30 mins. */
router.post('/crowd', requireAuth, async (req, res, next) => {
  try {
    if (req.user.role !== 'student') return res.status(403).json({ error: 'Students only.' });
    const { level } = req.body;
    if (!SEVERITY.includes(level)) {
      return res.status(400).json({ error: 'Invalid level.' });
    }
    
    // Check if submitted in last 30 minutes
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);
    const existing = await CrowdReport.findOne({
      student: req.user.messNumber,
      createdAt: { $gte: thirtyMinsAgo }
    });
    
    if (existing) {
      return res.status(429).json({ error: 'You have already submitted a report recently.' });
    }

    await CrowdReport.create({ student: req.user.messNumber, level });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

/** GET /api/reviews/crowd-status — The calculator. Averages fresh reports and provides live headcount. */
router.get('/crowd-status', async (_req, res, next) => {
  try {
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);
    const [recentReports, headcount] = await Promise.all([
      CrowdReport.find({ createdAt: { $gte: thirtyMinsAgo } }).lean(),
      MessPresence.countDocuments().catch(() => 0),
    ]);

    if (recentReports.length < MIN_RESPONSES) {
      return res.json({ 
        status: {
          level: null,
          origin: 'AUTOMATIC',
          responseCount: recentReports.length,
          headcount,
          updatedAt: new Date()
        } 
      });
    }

    const counts = { LOW: 0, MODERATE: 0, HIGH: 0 };
    for (const r of recentReports) counts[r.level] += 1;

    const maxCount = Math.max(...Object.values(counts));
    // Tie-break: pick the most severe level among those tied for max.
    const winner = [...SEVERITY].reverse().find((lvl) => counts[lvl] === maxCount);

    res.json({ 
      status: {
        level: winner,
        origin: 'AUTOMATIC',
        responseCount: recentReports.length,
        headcount,
        updatedAt: new Date()
      } 
    });
  } catch (err) {
    next(err);
  }
});

/** POST /api/reviews/general — Submit a text review with a 1-5 star rating. */
router.post('/general', requireAuth, async (req, res, next) => {
  try {
    if (req.user.role !== 'student') return res.status(403).json({ error: 'Students only.' });
    
    const { rating, comment } = req.body;
    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be a number between 1 and 5.' });
    }
    if (!comment || typeof comment !== 'string' || comment.trim() === '') {
      return res.status(400).json({ error: 'Comment is required.' });
    }

    await GeneralReview.create({ student: req.user.messNumber, rating, comment });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

/** GET /api/reviews/general — Fetch the 50 most recent general reviews with student info. */
router.get('/general', async (_req, res, next) => {
  try {
    const reviews = await GeneralReview.find()
      .populate('student', 'name room branch mobile')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const mapped = reviews.map((r) => ({
      id: r._id,
      _id: r._id,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
      student: r.student && typeof r.student === 'object' ? r.student : { _id: r.student, name: `Student #${r.student}` },
    }));

    res.json({ reviews: mapped });
  } catch (err) {
    next(err);
  }
});

/** DELETE /api/reviews/:id — delete review (owner only) */
router.delete('/:id', requireOwner, async (req, res, next) => {
  try {
    const result = await GeneralReview.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ error: 'Review not found.' });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;

