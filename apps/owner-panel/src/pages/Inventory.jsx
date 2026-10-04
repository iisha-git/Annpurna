import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { api } from '../api';
import { Icon } from '../ui';

/* ── helpers ─────────────────────────────────────────────────────────────── */

function timeAgo(dateStr) {
  if (!dateStr) return '—';
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 2) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

/**
 * Parse pasted / imported CSV text.
 * Expected columns (tab or comma separated): Item, Qty, Unit, MinThreshold
 */
function parseCSV(text) {
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const cells = line.includes('\t') ? line.split('\t') : line.split(/[,;]+/);
      const item = (cells[0] || '').trim();
      if (!item || item.toLowerCase() === 'item') return null; // skip header
      const qty = parseFloat(cells[1]);
      if (isNaN(qty)) return null;
      return {
        item,
        qty,
        unit: (cells[2] || 'kg').trim(),
        minThreshold: cells[3] ? Number(cells[3]) : 10,
      };
    })
    .filter(Boolean);
}

/* ── small reusable Modal ────────────────────────────────────────────────── */
function Modal({ title, sub, children, actions, onClose, wide }) {
  useEffect(() => {
    const h = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal" role="dialog" aria-modal="true" style={wide ? { maxWidth: 660 } : {}}>
        <div className="modal-head">
          <div>
            <h3>{title}</h3>
            {sub && <p>{sub}</p>}
          </div>
          <button className="icon-btn" style={{ width: 32, height: 32 }} onClick={onClose} title="Close">
            <Icon name="x" size={15} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {actions && <div className="modal-foot">{actions}</div>}
      </div>
    </div>
  );
}

/* ── main page ───────────────────────────────────────────────────────────── */

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [basket, setBasket] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');

  // modal state: null | 'add' | 'import' | 'edit'
  const [modal, setModal] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');

  // add/edit form
  const [form, setForm] = useState({ item: '', qty: '', unit: 'kg', minThreshold: '10', category: 'Pulses & Dals' });

  // inline quantity editing
  const [editingQtyId, setEditingQtyId] = useState(null);
  const [editingQtyVal, setEditingQtyVal] = useState('');

  // basket input per row
  const [basketInputs, setBasketInputs] = useState({}); // id → string amount

  // import
  const [importText, setImportText] = useState('');
  const [importMsg, setImportMsg] = useState('');
  const importRows = useMemo(() => parseCSV(importText), [importText]);

  /* ── data fetching ──────────────────────────────────────────────────── */
  const fetchAll = useCallback(async () => {
    try {
      const [inv, bas] = await Promise.all([
        api.get('/inventory'),
        api.get('/inventory/basket'),
      ]);
      setItems(inv.items || []);
      setBasket(bas.basket || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  /* ── derived ────────────────────────────────────────────────────────── */
  const low = items.filter((i) => i.status === 'Low').length;
  const rows = useMemo(
    () =>
      items.filter(
        (i) =>
          i.item.toLowerCase().includes(q.trim().toLowerCase()) ||
          (i.category && i.category.toLowerCase().includes(q.trim().toLowerCase()))
      ),
    [items, q],
  );
  const totalBasketItems = basket.length;

  /* ── inline qty save ────────────────────────────────────────────────── */
  async function saveQty(item) {
    const val = parseFloat(editingQtyVal);
    if (isNaN(val) || val < 0) { setEditingQtyId(null); return; }
    try {
      const res = await api.put(`/inventory/${item.id}`, { qty: val });
      setItems((prev) => prev.map((i) => (i.id === item.id ? res.item : i)));
    } catch (e) {
      setError(e.message);
    }
    setEditingQtyId(null);
  }

  /* ── add item ───────────────────────────────────────────────────────── */
  async function handleAdd(e) {
    e.preventDefault();
    setBusy(true);
    try {
      if (editTarget) {
        const res = await api.put(`/inventory/${editTarget.id}`, {
          item: form.item,
          qty: Number(form.qty),
          unit: form.unit,
          category: form.category,
          minThreshold: Number(form.minThreshold),
        });
        setItems((prev) => prev.map((i) => (i.id === editTarget.id ? res.item : i)));
      } else {
        const res = await api.post('/inventory', {
          item: form.item,
          qty: Number(form.qty),
          unit: form.unit,
          category: form.category,
          minThreshold: Number(form.minThreshold),
        });
        setItems((prev) => [...prev, res.item].sort((a, b) => a.item.localeCompare(b.item)));
      }
      setModal(null);
      setEditTarget(null);
      setForm({ item: '', qty: '', unit: 'kg', minThreshold: '10', category: 'Pulses & Dals' });
    } catch (e) {
      setError(e.message);
    }
    setBusy(false);
  }

  /* ── delete ─────────────────────────────────────────────────────────── */
  async function handleDelete(id) {
    if (!window.confirm('Remove this item from inventory?')) return;
    try {
      await api.del(`/inventory/${id}`);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (e) {
      setError(e.message);
    }
  }

  /* ── import ─────────────────────────────────────────────────────────── */
  async function handleImport() {
    if (!importRows.length) { setImportMsg('Nothing to import — check the format.'); return; }
    setBusy(true);
    setImportMsg('');
    try {
      const res = await api.post('/inventory/import', { items: importRows });
      setImportMsg(`✓ ${res.imported} added, ${res.updated} updated${res.errors?.length ? ` — ${res.errors.length} skipped` : ''}.`);
      await fetchAll();
      setImportText('');
    } catch (e) {
      setImportMsg(e.message);
    }
    setBusy(false);
  }

  /* ── basket: add ────────────────────────────────────────────────────── */
  async function addToBasket(item) {
    const amt = parseFloat(basketInputs[item.id] || '');
    if (isNaN(amt) || amt <= 0) {
      setError(`Enter a valid amount for ${item.item}`);
      return;
    }
    setBusy(true);
    try {
      const res = await api.post('/inventory/basket', { inventoryId: item.id, amount: amt });
      // Update local inventory qty immediately
      setItems((prev) => prev.map((i) => (i.id === item.id ? res.updatedInventory : i)));
      setBasket((prev) => [res.basketItem, ...prev]);
      setBasketInputs((prev) => { const n = { ...prev }; delete n[item.id]; return n; });
      setStatus(`${item.item}: ${amt} ${item.unit} added to cart`);
    } catch (e) {
      setError(e.message);
    }
    setBusy(false);
  }

  /* ── basket: remove ─────────────────────────────────────────────────── */
  async function removeFromBasket(basketId) {
    try {
      const res = await api.del(`/inventory/basket/${basketId}`);
      setBasket((prev) => prev.filter((b) => b.id !== basketId));
      if (res.updatedInventory) {
        setItems((prev) =>
          prev.map((i) => (i.id === String(res.updatedInventory.id) ? res.updatedInventory : i)),
        );
      }
    } catch (e) {
      setError(e.message);
    }
  }

  /* ── render ─────────────────────────────────────────────────────────── */
  return (
    <div className="stack">
      {/* ── KPI strip ─────────────────────────────────────────────────── */}
      <div className="stats cols-3">
        <div className="card card-pad stat">
          <span className="stat-ico tone-amber sm"><Icon name="package" size={17} /></span>
          <div>
            <div className="stat-label">Items Tracked</div>
            <div className="stat-value">{items.length}</div>
            <span className="stat-delta flat">Dry goods + fresh</span>
          </div>
        </div>
        <div className="card card-pad stat">
          <span className="stat-ico tone-red sm"><Icon name="alert" size={17} /></span>
          <div>
            <div className="stat-label">Low Stock</div>
            <div className="stat-value">{low}</div>
            <span className={`stat-delta ${low > 0 ? 'down' : 'up'}`}>{low > 0 ? 'Restock needed' : 'All good'}</span>
          </div>
        </div>
        <div className="card card-pad stat">
          <span className="stat-ico tone-violet sm"><Icon name="shoppingCart" size={17} /></span>
          <div>
            <div className="stat-label">Today's Cart</div>
            <div className="stat-value">{totalBasketItems}</div>
            <span className="stat-delta flat">item{totalBasketItems !== 1 ? 's' : ''} queued</span>
          </div>
        </div>
      </div>

      {/* ── Toast messages ─────────────────────────────────────────────── */}
      {(error || status) && (
        <div
          className={`form-error`}
          style={{
            background: status && !error ? 'var(--success-bg, #ecfdf5)' : undefined,
            color: status && !error ? 'var(--success, #059669)' : undefined,
            cursor: 'pointer',
          }}
          onClick={() => { setError(''); setStatus(''); }}
        >
          <Icon name={error ? 'alert' : 'check'} size={15} />
          {error || status} — click to dismiss
        </div>
      )}

      {/* ── Inventory table ────────────────────────────────────────────── */}
      <section className="card">
        <div className="toolbar" style={{ padding: '14px 22px 0', marginBottom: 6 }}>
          <div className="toolbar-l">
            <span className="search-wrap">
              <Icon name="search" size={15} />
              <input
                className="field"
                placeholder="Search items…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </span>
          </div>
          <div className="toolbar-r" style={{ gap: 8, display: 'flex' }}>
            <button
              className="btn"
              onClick={() => { setImportText(''); setImportMsg(''); setModal('import'); }}
            >
              <Icon name="upload" size={15} /> Import list
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                setEditTarget(null);
                setForm({ item: '', qty: '', unit: 'kg', minThreshold: '10' });
                setModal('add');
              }}
            >
              <Icon name="plus" size={15} /> Add item
            </button>
          </div>
        </div>

        <div className="table-wrap" style={{ padding: '6px 22px 22px' }}>
          {loading ? (
            <div className="empty-state"><p>Loading inventory…</p></div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Stock (kg / unit)</th>
                  <th>Status</th>
                  <th>Last Updated</th>
                  <th style={{ minWidth: 200 }}>Add to Cart</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((item) => (
                  <tr key={item.id}>
                    {/* Item name */}
                    <td>
                      <span className="cell-main">
                        <Icon
                          name={item.unit === 'L' ? 'package' : 'wheat'}
                          size={16}
                          style={{ color: item.status === 'Low' ? 'var(--danger)' : 'var(--warn)' }}
                        />
                        <span style={{ display: 'inline-flex', flexDirection: 'column' }}>
                          <b>{item.item}</b>
                          {item.category && (
                            <small className="cell-sub" style={{ fontSize: 11, fontWeight: 700, opacity: 0.85 }}>
                              {item.category}
                            </small>
                          )}
                        </span>
                      </span>
                    </td>

                    {/* Quantity — click to edit inline */}
                    <td>
                      {editingQtyId === item.id ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <input
                            className="field"
                            type="number"
                            min="0"
                            step="0.1"
                            style={{ width: 85, height: 36, padding: '6px 10px', fontSize: 13, borderRadius: 9 }}
                            value={editingQtyVal}
                            autoFocus
                            onChange={(e) => setEditingQtyVal(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveQty(item);
                              if (e.key === 'Escape') setEditingQtyId(null);
                            }}
                          />
                          <span className="cell-sub">{item.unit}</span>
                          <button className="btn btn-sm btn-success" style={{ height: 36, padding: '0 10px', borderRadius: 9 }} onClick={() => saveQty(item)}>✓</button>
                          <button className="btn btn-sm" style={{ height: 36, padding: '0 10px', borderRadius: 9 }} onClick={() => setEditingQtyId(null)}>✕</button>
                        </span>
                      ) : (
                        <span
                          className="cell-amt"
                          style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                          title="Click to update stock"
                          onClick={() => { setEditingQtyId(item.id); setEditingQtyVal(String(item.qty)); }}
                        >
                          <b style={{ color: item.status === 'Low' ? 'var(--danger)' : 'var(--ink)' }}>
                            {item.qty}
                          </b>
                          <span className="cell-sub">{item.unit}</span>
                          <Icon name="edit" size={12} style={{ color: 'var(--muted)', marginLeft: 2 }} />
                        </span>
                      )}
                    </td>

                    {/* Status badge */}
                    <td>
                      <span className={`badge ${item.status === 'Good' ? 'good' : 'low'}`}>
                        {item.status}
                      </span>
                    </td>

                    {/* Last updated */}
                    <td className="cell-sub">{timeAgo(item.updatedAt)}</td>

                    {/* Add to Cart input */}
                    <td style={{ minWidth: 200 }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                          <input
                            className="field"
                            type="number"
                            min="0"
                            step="0.1"
                            placeholder="0"
                            style={{
                              width: 95,
                              height: 36,
                              padding: '6px 34px 6px 12px',
                              fontSize: 13,
                              borderRadius: 9,
                            }}
                            value={basketInputs[item.id] || ''}
                            onChange={(e) =>
                              setBasketInputs((prev) => ({ ...prev, [item.id]: e.target.value }))
                            }
                            onKeyDown={(e) => { if (e.key === 'Enter') addToBasket(item); }}
                          />
                          <span
                            style={{
                              position: 'absolute',
                              right: 10,
                              fontSize: 12,
                              fontWeight: 700,
                              color: 'var(--muted)',
                              pointerEvents: 'none',
                            }}
                          >
                            {item.unit}
                          </span>
                        </div>
                        <button
                          className="btn btn-sm btn-primary"
                          title="Add to today's cart"
                          style={{
                            height: 36,
                            padding: '0 14px',
                            borderRadius: 9,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            fontSize: 12.5,
                            fontWeight: 700,
                            whiteSpace: 'nowrap',
                          }}
                          disabled={busy || !basketInputs[item.id]}
                          onClick={() => addToBasket(item)}
                        >
                          <Icon name="shoppingCart" size={14} />
                          <span>Add</span>
                        </button>
                      </div>
                    </td>

                    {/* Actions */}
                    <td style={{ textAlign: 'right' }}>
                      <span style={{ display: 'inline-flex', gap: 6 }}>
                        <button
                          className="btn btn-sm"
                          title="Edit item"
                          onClick={() => {
                            setEditTarget(item);
                            setForm({
                              item: item.item,
                              qty: String(item.qty),
                              unit: item.unit,
                              category: item.category || 'Pulses & Dals',
                              minThreshold: String(item.minThreshold ?? 10),
                            });
                            setModal('add');
                          }}
                        >
                          <Icon name="edit" size={13} /> Edit
                        </button>
                        <button
                          className="btn btn-sm"
                          style={{ color: 'var(--danger)' }}
                          title="Delete item"
                          onClick={() => handleDelete(item.id)}
                        >
                          <Icon name="trash" size={13} />
                        </button>
                      </span>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && !loading && (
                  <tr>
                    <td colSpan={6}>
                      <div className="empty-state">
                        <span className="empty-ico"><Icon name="search" size={20} /></span>
                        <b>{q ? 'No items match' : 'Inventory is empty'}</b>
                        <p>{q ? 'Try a different search.' : 'Add your first item or import a list.'}</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* ── Today's basket ─────────────────────────────────────────────── */}
      {basket.length > 0 && (
        <section className="card">
          <div className="card-head">
            <span className="hd">
              <span className="hd-chip tone-violet"><Icon name="shoppingCart" size={17} /></span>
              <div>
                <h3>Today's Cart</h3>
                <p>Items queued for use today — deducted from stock</p>
              </div>
            </span>
            <span className="badge">{basket.length} item{basket.length !== 1 ? 's' : ''}</span>
          </div>
          <ul className="compact-list" style={{ padding: '0 22px 16px' }}>
            {basket.map((b) => (
              <li className="compact-row" key={b.id}>
                <span className="ava plain" style={{ width: 34, height: 34, fontSize: 15 }}>
                  <Icon name="wheat" size={15} />
                </span>
                <span className="who">
                  <b>{b.item}</b>
                  <small>{timeAgo(b.addedAt)}</small>
                </span>
                <b className="price" style={{ color: 'var(--brand)' }}>
                  {b.amount} {b.unit}
                </b>
                <button
                  className="icon-btn"
                  style={{ width: 30, height: 30, color: 'var(--danger)' }}
                  title="Remove from cart (qty returned)"
                  onClick={() => removeFromBasket(b.id)}
                >
                  <Icon name="x" size={13} />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── Add / Edit modal ───────────────────────────────────────────── */}
      {modal === 'add' && (
        <Modal
          title={editTarget ? 'Edit Item' : 'Add Inventory Item'}
          sub={editTarget ? `Editing: ${editTarget.item}` : 'Fill in the details below'}
          onClose={() => { setModal(null); setEditTarget(null); }}
          actions={
            <>
              <button className="btn" onClick={() => { setModal(null); setEditTarget(null); }}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAdd} disabled={busy || !form.item}>
                {busy ? 'Saving…' : editTarget ? 'Save changes' : 'Add item'}
              </button>
            </>
          }
        >
          <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <label className="field-group">
              <span>Item name</span>
              <input
                className="field"
                placeholder="e.g. Basmati Rice"
                value={form.item}
                autoFocus
                required
                onChange={(e) => setForm((f) => ({ ...f, item: e.target.value }))}
              />
            </label>
            <div className="form-grid">
              <label className="field-group">
                <span>Quantity</span>
                <input
                  className="field"
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="0"
                  value={form.qty}
                  required
                  onChange={(e) => setForm((f) => ({ ...f, qty: e.target.value }))}
                />
              </label>
              <label className="field-group">
                <span>Unit</span>
                <select
                  className="field"
                  value={form.unit}
                  onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                >
                  <option>kg</option>
                  <option>g</option>
                  <option>L</option>
                  <option>mL</option>
                  <option>pcs</option>
                  <option>dozen</option>
                  <option>bag</option>
                </select>
              </label>
            </div>
            <div className="form-grid">
              <label className="field-group">
                <span>Category</span>
                <select
                  className="field"
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                >
                  <option>Pulses & Dals</option>
                  <option>Grains & Flours</option>
                  <option>Spices & Masalas</option>
                  <option>Whole Spices</option>
                  <option>Oils & Ghee</option>
                  <option>Dry Fruits & Nuts</option>
                  <option>Dairy & Fresh</option>
                  <option>Packaged & Ready Foods</option>
                  <option>Baking & Cooking Aids</option>
                  <option>Condiments & Sauces</option>
                  <option>Essentials</option>
                  <option>Beverages</option>
                </select>
              </label>
              <label className="field-group">
                <span>Low-stock threshold ({form.unit})</span>
                <input
                  className="field"
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="10"
                  value={form.minThreshold}
                  onChange={(e) => setForm((f) => ({ ...f, minThreshold: e.target.value }))}
                />
              </label>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Import modal ───────────────────────────────────────────────── */}
      {modal === 'import' && (
        <Modal
          title="Import Inventory List"
          sub="Paste CSV or tab-separated data — existing items will be updated"
          onClose={() => setModal(null)}
          wide
          actions={
            <>
              <button className="btn" onClick={() => setModal(null)}>Cancel</button>
              <button
                className="btn btn-primary"
                onClick={handleImport}
                disabled={busy || importRows.length === 0}
              >
                {busy ? 'Importing…' : `Import ${importRows.length} item${importRows.length !== 1 ? 's' : ''}`}
              </button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div
              style={{
                background: 'var(--surface-2, #f8f8fa)',
                borderRadius: 8,
                padding: '10px 14px',
                fontSize: 12,
                color: 'var(--muted)',
                fontFamily: 'monospace',
              }}
            >
              <b>Format (one item per line):</b><br />
              Item Name, Qty, Unit, MinThreshold<br />
              <br />
              <span style={{ opacity: 0.7 }}>
                Basmati Rice, 80, kg, 15<br />
                Toor Dal, 25, kg, 10<br />
                Refined Oil, 15, L, 5
              </span>
            </div>

            <textarea
              className="field"
              rows={10}
              placeholder={"Basmati Rice, 80, kg, 15\nToor Dal, 25, kg, 10\nRefined Oil, 15, L, 5"}
              value={importText}
              autoFocus
              onChange={(e) => { setImportText(e.target.value); setImportMsg(''); }}
              style={{ fontFamily: 'monospace', fontSize: 13, resize: 'vertical' }}
            />

            {importRows.length > 0 && (
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                Preview: <b>{importRows.length}</b> item{importRows.length !== 1 ? 's' : ''} detected
                {' · '}{importRows.slice(0, 3).map((r) => r.item).join(', ')}
                {importRows.length > 3 ? '…' : ''}
              </div>
            )}

            {importMsg && (
              <div
                className="form-error"
                style={
                  importMsg.startsWith('✓')
                    ? { background: 'var(--success-bg,#ecfdf5)', color: 'var(--success,#059669)' }
                    : {}
                }
              >
                <Icon name={importMsg.startsWith('✓') ? 'check' : 'alert'} size={14} />
                {importMsg}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}