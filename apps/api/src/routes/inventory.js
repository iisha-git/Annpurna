import { Router } from 'express';
import { requireOwner } from '../middleware/auth.js';
import { Inventory } from '../models/Inventory.js';
import { Basket } from '../models/Basket.js';

const router = Router();

const formatItem = (item) => {
  const qty = item.qty !== undefined ? item.qty : (item.quantity !== undefined ? item.quantity : 0);
  const name = item.item || item.item_name || '';
  return {
    id: item._id,
    _id: item._id,
    item: name,
    item_name: name,
    qty,
    quantity: qty,
    unit: item.unit || 'kg',
    category: item.category || 'Groceries',
    minThreshold: item.minThreshold,
    status: qty <= (item.minThreshold ?? 10) ? 'Low' : 'Good',
    updatedAt: item.updatedAt,
  };
};

/** GET /api/inventory — list all inventory items (owner only) */
router.get('/', requireOwner, async (_req, res, next) => {
  try {
    const items = await Inventory.find().sort({ item: 1 }).lean();
    res.json({ items: items.map(formatItem) });
  } catch (err) {
    next(err);
  }
});

/** POST /api/inventory — add a single inventory item (owner only) */
router.post('/', requireOwner, async (req, res, next) => {
  try {
    const { item, item_name, qty, quantity, unit, category, minThreshold } = req.body;
    const name = (item || item_name || '').trim();
    if (!name) return res.status(400).json({ error: 'Item name is required.' });

    const finalQty = qty !== undefined ? Number(qty) : (quantity !== undefined ? Number(quantity) : 0);
    const newItem = await Inventory.create({
      item: name,
      item_name: name,
      qty: finalQty,
      quantity: finalQty,
      unit: (unit || 'kg').trim(),
      category: (category || 'Groceries').trim(),
      minThreshold: minThreshold !== undefined ? Number(minThreshold) : 10,
      updatedAt: new Date(),
    });

    res.json({ item: formatItem(newItem) });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/inventory/import — bulk import / upsert inventory items from CSV.
 * Body: { items: [{ item, qty, unit, minThreshold, category }] }
 * If an item with the same name already exists, its qty is SET (not added).
 */
router.post('/import', requireOwner, async (req, res, next) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0)
      return res.status(400).json({ error: 'No items provided.' });

    let imported = 0;
    let updated = 0;
    const errors = [];

    for (const row of items) {
      const name = (row.item || row.item_name || '').trim();
      if (!name) { errors.push(`Empty item name skipped`); continue; }
      const qty = Number(row.qty !== undefined ? row.qty : row.quantity);
      if (isNaN(qty) || qty < 0) { errors.push(`"${name}" has invalid qty`); continue; }

      const existing = await Inventory.findOne({
        $or: [
          { item: { $regex: new RegExp(`^${name}$`, 'i') } },
          { item_name: { $regex: new RegExp(`^${name}$`, 'i') } },
        ],
      });
      if (existing) {
        await Inventory.findByIdAndUpdate(existing._id, {
          $set: {
            qty,
            quantity: qty,
            unit: (row.unit || existing.unit || 'kg').trim(),
            category: (row.category || existing.category || 'Groceries').trim(),
            updatedAt: new Date(),
          },
        });
        updated++;
      } else {
        await Inventory.create({
          item: name,
          item_name: name,
          qty,
          quantity: qty,
          unit: (row.unit || 'kg').trim(),
          category: (row.category || 'Groceries').trim(),
          minThreshold: row.minThreshold !== undefined ? Number(row.minThreshold) : 10,
          updatedAt: new Date(),
        });
        imported++;
      }
    }

    res.json({ imported, updated, errors });
  } catch (err) {
    next(err);
  }
});

/** PUT /api/inventory/:id — update stock or details (owner only) */
router.put('/:id', requireOwner, async (req, res, next) => {
  try {
    const updates = { updatedAt: new Date() };
    if (req.body.item) { updates.item = req.body.item.trim(); updates.item_name = updates.item; }
    if (req.body.item_name) { updates.item_name = req.body.item_name.trim(); updates.item = updates.item_name; }
    if (req.body.qty !== undefined) { updates.qty = Number(req.body.qty); updates.quantity = updates.qty; }
    if (req.body.quantity !== undefined) { updates.quantity = Number(req.body.quantity); updates.qty = updates.quantity; }
    if (req.body.unit) updates.unit = req.body.unit.trim();
    if (req.body.category) updates.category = req.body.category.trim();
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

/* ── BASKET ──────────────────────────────────────────────────────────────── */

/** GET /api/inventory/basket — get today's basket items */
router.get('/basket', requireOwner, async (_req, res, next) => {
  try {
    const items = await Basket.find().sort({ addedAt: -1 }).lean();
    res.json({
      basket: items.map((b) => ({
        id: b._id,
        inventoryId: b.inventoryId,
        item: b.item,
        unit: b.unit,
        amount: b.amount,
        addedAt: b.addedAt,
      })),
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/inventory/basket — add an item to today's basket.
 * Deducts `amount` from inventory.qty immediately.
 * Body: { inventoryId, amount }
 */
router.post('/basket', requireOwner, async (req, res, next) => {
  try {
    const { inventoryId, amount } = req.body;
    if (!inventoryId) return res.status(400).json({ error: 'inventoryId is required.' });
    const qty = Number(amount);
    if (isNaN(qty) || qty <= 0) return res.status(400).json({ error: 'amount must be a positive number.' });

    const invItem = await Inventory.findById(inventoryId);
    if (!invItem) return res.status(404).json({ error: 'Inventory item not found.' });
    if (invItem.qty < qty)
      return res.status(400).json({ error: `Only ${invItem.qty} ${invItem.unit} available.` });

    // Deduct from inventory
    invItem.qty = +(invItem.qty - qty).toFixed(3);
    invItem.updatedAt = new Date();
    await invItem.save();

    // Add to basket
    const entry = await Basket.create({
      inventoryId: invItem._id,
      item: invItem.item,
      unit: invItem.unit,
      amount: qty,
    });

    res.json({
      basketItem: {
        id: entry._id,
        inventoryId: entry.inventoryId,
        item: entry.item,
        unit: entry.unit,
        amount: entry.amount,
        addedAt: entry.addedAt,
      },
      updatedInventory: formatItem(invItem),
    });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/inventory/basket/:id — remove a basket entry and RETURN qty to inventory.
 */
router.delete('/basket/:id', requireOwner, async (req, res, next) => {
  try {
    const entry = await Basket.findByIdAndDelete(req.params.id);
    if (!entry) return res.status(404).json({ error: 'Basket entry not found.' });

    // Return the qty to inventory
    const invItem = await Inventory.findById(entry.inventoryId);
    if (invItem) {
      invItem.qty = +(invItem.qty + entry.amount).toFixed(3);
      invItem.updatedAt = new Date();
      await invItem.save();
      return res.json({ success: true, updatedInventory: formatItem(invItem) });
    }

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
