import React, { useEffect, useState } from 'react';
import { api } from '../api';

export default function WorkerDetails() {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Add Worker Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', role: 'Kitchen Helper', salary: '₹14,000/month', mobile: '' });
  const [addBusy, setAddBusy] = useState(false);
  const [addError, setAddError] = useState('');

  // Delete State
  const [workerToDelete, setWorkerToDelete] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const fetchWorkers = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/workers');
      setWorkers(res.workers || []);
    } catch (err) {
      setError(err.message || 'Failed to load workers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkers();
  }, []);

  const handleToggleStatus = async (worker) => {
    const nextStatus = worker.status === 'Working' ? 'On Leave' : 'Working';
    try {
      await api.put(`/workers/${worker._id}`, { status: nextStatus });
      setWorkers((prev) =>
        prev.map((w) => (w._id === worker._id ? { ...w, status: nextStatus } : w))
      );
    } catch (err) {
      alert(`Could not update worker status: ${err.message}`);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setAddBusy(true);
    setAddError('');
    try {
      if (!addForm.name.trim()) throw new Error('Worker name is required.');
      await api.post('/workers', {
        name: addForm.name.trim(),
        role: addForm.role.trim(),
        salary: addForm.salary.trim(),
        mobile: addForm.mobile.trim(),
        status: 'Working',
      });
      setShowAddModal(false);
      setAddForm({ name: '', role: 'Kitchen Helper', salary: '₹14,000/month', mobile: '' });
      await fetchWorkers();
    } catch (err) {
      setAddError(err.message || 'Failed to add worker');
    } finally {
      setAddBusy(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!workerToDelete) return;
    setDeleteBusy(true);
    try {
      await api.del(`/workers/${workerToDelete._id}`);
      setWorkerToDelete(null);
      await fetchWorkers();
    } catch (err) {
      alert(`Could not remove worker: ${err.message}`);
    } finally {
      setDeleteBusy(false);
    }
  };

  const workingCount = workers.filter((w) => w.status === 'Working').length;
  const onLeaveCount = workers.length - workingCount;

  return (
    <div className="ui-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: '0 0 6px 0' }}>Worker Management</h2>
          <div style={{ fontSize: '13px', color: 'var(--muted)', display: 'flex', gap: '14px' }}>
            <span>Total Staff: <strong style={{ color: 'var(--ink)' }}>{workers.length}</strong></span>
            <span>Working Today: <strong style={{ color: 'var(--success)' }}>{workingCount}</strong></span>
            <span>On Leave: <strong style={{ color: 'var(--amber-pressed)' }}>{onLeaveCount}</strong></span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className="primaryBtn"
            onClick={() => setShowAddModal(true)}
            style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '13px' }}
          >
            + Add Worker
          </button>
          <button className="ghost dark" onClick={fetchWorkers} title="Refresh workers">
            ↻
          </button>
        </div>
      </div>

      {error && <p className="error" style={{ marginBottom: '16px' }}>{error}</p>}

      {loading ? (
        <p className="muted" style={{ padding: '32px 0', textAlign: 'center' }}>Loading mess staff…</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Salary</th>
              <th>Mobile</th>
              <th>Today's Status</th>
              <th style={{ textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {workers.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: 'var(--muted)' }}>
                  No workers added yet. Click "+ Add Worker" to add staff.
                </td>
              </tr>
            ) : (
              workers.map((w) => (
                <tr key={w._id}>
                  <td style={{ fontWeight: '600' }}>{w.name}</td>
                  <td className="muted">{w.role}</td>
                  <td style={{ fontWeight: '600' }}>{w.salary}</td>
                  <td className="muted">{w.mobile || '—'}</td>
                  <td>
                    <button
                      onClick={() => handleToggleStatus(w)}
                      className={`status-badge ${w.status === 'Working' ? 'good' : 'pending'}`}
                      style={{ border: 'none', cursor: 'pointer' }}
                      title="Click to toggle status"
                    >
                      {w.status} ⇄
                    </button>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="ghost"
                      style={{ padding: '4px 8px', fontSize: '12px', color: 'var(--danger)', fontWeight: '600' }}
                      onClick={() => setWorkerToDelete(w)}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}

      {/* ── Modal: Add Worker ── */}
      {showAddModal && (
        <div style={modalOverlayStyle}>
          <div style={modalBoxStyle}>
            <h3 style={{ margin: '0 0 16px 0', color: 'var(--ink)' }}>Add Staff Member</h3>
            {addError && <p className="error" style={{ marginBottom: '12px' }}>{addError}</p>}
            <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={labelStyle}>Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Kumar"
                  required
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Role *</label>
                  <select
                    value={addForm.role}
                    onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}
                    style={inputStyle}
                  >
                    <option value="Head Cook">Head Cook</option>
                    <option value="Assistant Cook">Assistant Cook</option>
                    <option value="Kitchen Helper">Kitchen Helper</option>
                    <option value="Cleaner">Cleaner</option>
                    <option value="Store Keeper">Store Keeper</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Monthly Salary *</label>
                  <input
                    type="text"
                    placeholder="e.g. ₹15,000/month"
                    required
                    value={addForm.salary}
                    onChange={(e) => setAddForm({ ...addForm, salary: e.target.value })}
                    style={inputStyle}
                  />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Contact Mobile Number</label>
                <input
                  type="tel"
                  placeholder="e.g. 9823411234"
                  value={addForm.mobile}
                  onChange={(e) => setAddForm({ ...addForm, mobile: e.target.value })}
                  style={inputStyle}
                />
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
                  {addBusy ? 'Adding…' : 'Save Worker'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Delete Worker Confirmation ── */}
      {workerToDelete && (
        <div style={modalOverlayStyle}>
          <div style={{ ...modalBoxStyle, maxWidth: '400px' }}>
            <h3 style={{ margin: '0 0 10px 0', color: 'var(--danger)' }}>Remove Worker</h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: 'var(--ink)', lineHeight: '1.5' }}>
              Are you sure you want to remove <strong>{workerToDelete.name}</strong> ({workerToDelete.role}) from the staff records?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                className="ghost dark"
                onClick={() => setWorkerToDelete(null)}
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
                {deleteBusy ? 'Removing…' : 'Yes, Remove'}
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
