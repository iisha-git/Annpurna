import { Router } from 'express';

import { DAYS, DEFAULT_WEEK, MEALS } from '../config/menuDefaults.js';
import { requireAuth, requireOwner } from '../middleware/auth.js';
import { Menu } from '../models/Menu.js';

const router = Router();

/** Normalise anything into a full 7-day x 4-meal week, filling gaps from defaults. */
function sanitizeWeek(body) {
  const week = {};
  for (const day of DAYS) {
    week[day] = {};
    for (const meal of MEALS) {
      const raw = body?.[day]?.[meal];
      week[day][meal] = Array.isArray(raw)
        ? raw.map((x) => String(x).trim()).filter(Boolean)
        : (DEFAULT_WEEK[day]?.[meal] ?? []);
    }
  }
  return week;
}

/** GET /api/menu — the current weekly menu (any signed-in user). */
router.get('/', requireAuth, async (_req, res, next) => {
  try {
    const doc = await Menu.findById('current').lean();
    res.json({ week: sanitizeWeek(doc ?? {}) });
  } catch (err) {
    next(err);
  }
});

/** PUT /api/menu — full week replacement (owner only). */
router.put('/', requireOwner, async (req, res, next) => {
  try {
    const raw = req.body?.week ?? req.body ?? {};
    const week = sanitizeWeek(raw);
    await Menu.updateOne({ _id: 'current' }, { $set: week }, { upsert: true });
    res.json({ week });
  } catch (err) {
    next(err);
  }
});

export default router;