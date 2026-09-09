import { Router } from 'express';
import { requireOwner } from '../middleware/auth.js';
import { Worker } from '../models/Worker.js';

const router = Router();

/** GET /api/workers — list all workers (owner only) */
router.get('/', requireOwner, async (_req, res, next) => {
  try {
    const workers = await Worker.find().sort({ joinedAt: -1 }).lean();
    res.json({ workers });
  } catch (err) {
    next(err);
  }
});

/** POST /api/workers — add a worker (owner only) */
router.post('/', requireOwner, async (req, res, next) => {
  try {
    const { name, role, salary, mobile, status } = req.body;
    if (!name || !role || !salary) {
      return res.status(400).json({ error: 'Name, role, and salary are required.' });
    }

    const worker = await Worker.create({
      name: name.trim(),
      role: role.trim(),
      salary: salary.trim(),
      mobile: mobile ? String(mobile).trim() : '',
      status: status || 'Working',
    });

    res.json({ worker });
  } catch (err) {
    next(err);
  }
});

/** PUT /api/workers/:id — update worker details or status (owner only) */
router.put('/:id', requireOwner, async (req, res, next) => {
  try {
    const updates = {};
    if (req.body.name) updates.name = req.body.name.trim();
    if (req.body.role) updates.role = req.body.role.trim();
    if (req.body.salary) updates.salary = req.body.salary.trim();
    if (req.body.mobile !== undefined) updates.mobile = String(req.body.mobile).trim();
    if (req.body.status) updates.status = req.body.status;

    const worker = await Worker.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true });
    if (!worker) return res.status(404).json({ error: 'Worker not found.' });

    res.json({ worker });
  } catch (err) {
    next(err);
  }
});

/** DELETE /api/workers/:id — remove worker (owner only) */
router.delete('/:id', requireOwner, async (req, res, next) => {
  try {
    const result = await Worker.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ error: 'Worker not found.' });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
