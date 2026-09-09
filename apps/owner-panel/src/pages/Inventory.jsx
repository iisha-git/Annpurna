import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../api';

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  // Add Item Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ item: '', qty: '', unit: 'kg', minThreshold: '10' });
  const [addBusy, setAddBusy] = useState(false);
  const [addError, setAddError] = useState('');

  // Update Stock Modal
  const [editingItem, setEditingItem] = useState(null);
  const [updateQty, setUpdateQty] = useState('');
  const [updateBusy, setUpdateBusy] = useState(false);

  // Delete Confirmation
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/inventory');
      setItems(res.items || []);
    } catch (err) {
      setError(err.message || 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setAddBusy(true);
    setAddError('');
    try {
      if (!addForm.item.trim()) throw new Error('Item name is required.');
      await api.post('/inventory', {
        item: addForm.item.trim(),
        qty: Number(addForm.qty) || 0,
        unit: addForm.unit.trim(),
        minThreshold: Number(addForm.minThreshold) || 10,
      });
      setShowAddModal(false);
      setAddForm({ item: '', qty: '', unit: 'kg', minThreshold: '10' });
      await fetchInventory();
    } catch (err) {
      setAddError(err.message || 'Failed to add item');
    } finally {
      setAddBusy(false);
    }
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!editingItem) return;
    setUpdateBusy(true);
    try {
      await api.put(`/inventory/${editingItem._id}`, {
        qty: Number(updateQty) || 0,
      });
      setEditingItem(null);
      await fetchInventory();
    } catch (err) {
      alert(`Could not update stock: ${err.message}`);
    } finally {
      setUpdateBusy(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    setDeleteBusy(true);
    try {
      await api.del(`/inventory/${itemToDelete._id}`);
      setItemToDelete(null);
      await fetchInventory();
    } catch (err) {
      alert(`Could not delete item: ${err.message}`);
    } finally {
      setDeleteBusy(false);
    }
  };

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) => it.item.toLowerCase().includes(q));
  }, [items, search]);

  const lowStockCount = items.filter((it) => it.status === 'Low').length;

  return (
    <div className="ui-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: '0 0 6px 0' }}>Inventory Management</h2>
          <div style={{ fontSize: '13px', color: 'var(--muted)', display: 'flex', gap: '14px' }}>
            <span>Total Items: <strong style={{ color: 'var(--ink)' }}>{items.length}</strong></span>
            <span>Healthy Stock: <strong style={{ color: 'var(--success)' }}>{items.length - lowStockCount}</strong></span>
            <span>Low Stock Alerts: <strong style={{ color: 'var(--danger)' }}>{lowStockCount}</strong></span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Search items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              background: 'var(--paper)',
              outline: 'none',
              minWidth: '180px',
            }}
          />
          <button
            className="primaryBtn"
            onClick={() => setShowAddModal(true)}
            style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '13px' }}
          >
            + Add Item
          </button>
          <button className="ghost dark" onClick={fetchInventory} title="Refresh inventory">
            ↻
          </button>
        </div>
      </div>

      {error && <p className="error" style={{ marginBottom: '16px' }}>{error}</p>}

      {loading ? (
        <p className="muted" style={{ padding: '32px 0', textAlign: 'center' }}>Loading grocery & stock items…</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Quantity in Stock</th>
              <th>Unit</th>
              <th>Min. Threshold</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: 'var(--muted)' }}>
                  No items found matching "{search}".
                </td>
              </tr>
            ) : (
              filteredItems.map((it) => (
                <tr key={it._id}>
                  <td style={{ fontWeight: '600' }}>{it.item}</td>
                  <td style={{ fontWeight: '700', fontSize: '15px' }}>{it.qty}</td>
                  <td className="muted">{it.unit}</td>
                  <td className="muted">{it.minThreshold} {it.unit}</td>
                  <td>
                    <span className={`status-badge ${it.status === 'Good' ? 'good' : 'low'}`}>
                      {it.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '8px' }}>
                      <button
                        className="ghost"
                        style={{ padding: '4px 10px', fontSize: '12px', border: '1px solid var(--border)', borderRadius: '6px' }}
                        onClick={() => {
                          setEditingItem(it);
                          setUpdateQty(String(it.qty));
                        }}
                      >
                        Adjust Stock
                      </button>
                      <button
                        className="ghost"
                        style={{ padding: '4px 8px', fontSize: '12px', color: 'var(--danger)', fontWeight: '600' }}
                        onClick={() => setItemToDelete(it)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}

      {/* ── Modal: Add Item ── */}
      {showAddModal && (
        <div style={modalOverlayStyle}>
          <div style={modalBoxStyle}>
            <h3 style={{ margin: '0 0 16px 0', color: 'var(--ink)' }}>Add Inventory Item</h3>
            {addError && <p className="error" style={{ marginBottom: '12px' }}>{addError}</p>}
            <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={labelStyle}>Item Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Mustard Seeds / Ghee"
                  required
                  value={addForm.item}
                  onChange={(e) => setAddForm({ ...addForm, item: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Quantity in Stock *</label>
                  <input
                    type="number"
                    placeholder="e.g. 50"
                    required
                    value={addForm.qty}
                    onChange={(e) => setAddForm({ ...addForm, qty: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Unit *</label>
                  <select
                    value={addForm.unit}
                    onChange={(e) => setAddForm({ ...addForm, unit: e.target.value })}
                    style={inputStyle}
                  >
                    <option value="kg">kg</option>
                    <option value="L">L</option>
                    <option value="packets">packets</option>
                    <option value="bags">bags</option>
                    <option value="boxes">boxes</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={labelStyle}>Low-Stock Alert Threshold</label>
                <input
                  type="number"
                  placeholder="e.g. 15 (warn when below this)"
                  value={addForm.minThreshold}
                  onChange={(e) => setAddForm({ ...addForm, minThreshold: e.target.value })}
                  style={inputStyle}
                />
                <span style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px', display: 'block' }}>
                  When stock falls below this quantity, an alert is triggered on the dashboard.
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '14px' }}>
                <button
                  type="button"
                  className="ghost dark"
                  onClick={() => setShowAddModal(false)}
                  disabled={addBusy}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primaryBtn"
                  disabled={addBusy}
                  style={{ padding: '10px 20px', borderRadius: '8px' }}
                >
                  {addBusy ? 'Adding…' : 'Save Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Adjust Stock ── */}
      {editingItem && (
        <div style={modalOverlayStyle}>
          <div style={{ ...modalBoxStyle, maxWidth: '380px' }}>
            <h3 style={{ margin: '0 0 12px 0', color: 'var(--ink)' }}>Update Stock: {editingItem.item}</h3>
            <form onSubmit={handleUpdateSubmit}>
              <label style={labelStyle}>New Quantity ({editingItem.unit})</label>
              <input
                type="number"
                required
                value={updateQty}
                onChange={(e) => setUpdateQty(e.target.value)}
                style={{ ...inputStyle, marginBottom: '16px' }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  className="ghost dark"
                  onClick={() => setEditingItem(null)}
                  disabled={updateBusy}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primaryBtn"
                  disabled={updateBusy}
                  style={{ padding: '8px 18px', borderRadius: '8px' }}
                >
                  {updateBusy ? 'Saving…' : 'Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Delete Item Confirmation ── */}
      {itemToDelete && (
        <div style={modalOverlayStyle}>
          <div style={{ ...modalBoxStyle, maxWidth: '400px' }}>
            <h3 style={{ margin: '0 0 10px 0', color: 'var(--danger)' }}>Delete Item</h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: 'var(--ink)', lineHeight: '1.5' }}>
              Are you sure you want to delete <strong>{itemToDelete.item}</strong> from the inventory?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                className="ghost dark"
                onClick={() => setItemToDelete(null)}
                disabled={deleteBusy}
              >
                Cancel
              </button>
              <button
                className="primaryBtn"
                style={{ background: 'var(--danger)', color: 'white' }}
                onClick={handleDeleteConfirm}
                disabled={deleteBusy}
              >
                {deleteBusy ? 'Deleting…' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const modalOverlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(0, 0, 0, 0.45)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  padding: '16px',
};

const modalBoxStyle = {
  background: 'var(--surface)',
  borderRadius: '16px',
  padding: '24px',
  width: '100%',
  maxWidth: '460px',
  boxShadow: '0 12px 36px rgba(0, 0, 0, 0.2)',
  border: '1px solid var(--border)',
};

const labelStyle = {
  display: 'block',
  fontSize: '12px',
  fontWeight: '700',
  color: 'var(--muted)',
  marginBottom: '4px',
};

const inputStyle = {
  width: '100%',
  padding: '9px 12px',
  borderRadius: '8px',
  border: '1px solid var(--border)',
  background: 'var(--paper)',
  outline: 'none',
  fontSize: '14px',
  boxSizing: 'border-box',
};
