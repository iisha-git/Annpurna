import { Router } from 'express';
import { requireOwner } from '../middleware/auth.js';
import { Inventory } from '../models/Inventory.js';

const router = Router();

const formatItem = (item) => ({
  id: item._id,
  _id: item._id,
  item: item.item,
  qty: item.qty,
  unit: item.unit,
  minThreshold: item.minThreshold,
  status: item.qty <= (item.minThreshold ?? 10) ? 'Low' : 'Good',
  updatedAt: item.updatedAt,
});

/** GET /api/inventory — list all inventory items (owner only) */
router.get('/', requireOwner, async (_req, res, next) => {
  try {
    const items = await Inventory.find().sort({ item: 1 }).lean();
    res.json({ items: items.map(formatItem) });
  } catch (err) {
    next(err);
  }
});

/** POST /api/inventory — add an inventory item (owner only) */
router.post('/', requireOwner, async (req, res, next) => {
  try {
    const { item, qty, unit, minThreshold } = req.body;
    if (!item) return res.status(400).json({ error: 'Item name is required.' });

    const newItem = await Inventory.create({
      item: item.trim(),
      qty: Number(qty) || 0,
      unit: (unit || 'kg').trim(),
      minThreshold: minThreshold !== undefined ? Number(minThreshold) : 10,
      updatedAt: new Date(),
    });

    res.json({ item: formatItem(newItem) });
  } catch (err) {
    next(err);
  }
});

/** PUT /api/inventory/:id — update stock or details (owner only) */
router.put('/:id', requireOwner, async (req, res, next) => {
  try {
    const updates = { updatedAt: new Date() };
    if (req.body.item) updates.item = req.body.item.trim();
    if (req.body.qty !== undefined) updates.qty = Number(req.body.qty);
    if (req.body.unit) updates.unit = req.body.unit.trim();
    if (req.body.minThreshold !== undefined) updates.minThreshold = Number(req.body.minThreshold);

    const item = await Inventory.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true });
    if (!item) return res.status(404).json({ error: 'Item not found.' });

    res.json({ item: formatItem(item) });
  } catch (err) {
    next(err);
  }
});

/** DELETE /api/inventory/:id — delete inventory item (owner only) */
router.delete('/:id', requireOwner, async (req, res, next) => {
  try {
    const result = await Inventory.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ error: 'Item not found.' });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
