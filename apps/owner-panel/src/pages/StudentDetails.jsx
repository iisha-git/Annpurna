import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../api';

function getTodayIso() {
  const dt = new Date();
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}

export default function StudentDetails() {
  const [students, setStudents] = useState([]);
  const [leavesSet, setLeavesSet] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const pageSize = 50;

  // Add Student Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    messNumber: '',
    name: '',
    room: '',
    branch: '',
    year: '',
    mobile: '',
  });
  const [addBusy, setAddBusy] = useState(false);
  const [addError, setAddError] = useState('');

  // Delete Confirmation State
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const todayIso = useMemo(getTodayIso, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const [studentsRes, leavesRes] = await Promise.all([
        api.get('/students'),
        api.get('/leaves'),
      ]);

      const list = (studentsRes?.students || []).map((s) => ({
        ...s,
        numericId: Number(s.messNumber) || 999999,
      }));
      list.sort((a, b) => a.numericId - b.numericId);
      setStudents(list);

      const set = new Set((leavesRes?.leaves || []).map((l) => `${l.messNumber}_${l.date}`));
      setLeavesSet(set);
    } catch (err) {
      setError(err.message || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setAddBusy(true);
    setAddError('');
    try {
      if (!/^\d+$/.test(addForm.messNumber.trim())) {
        throw new Error('Please enter a valid numeric mess number.');
      }
      if (!addForm.name.trim()) {
        throw new Error('Student name is required.');
      }
      const cleanMob = addForm.mobile.replace(/\D/g, '');
      if (cleanMob.length !== 10) {
        throw new Error('Mobile number must be exactly 10 digits.');
      }

      await api.post('/students', {
        messNumber: addForm.messNumber.trim(),
        name: addForm.name.trim(),
        room: addForm.room.trim() || null,
        branch: addForm.branch.trim() || null,
        year: addForm.year.trim() || null,
        mobile: cleanMob,
      });

      setShowAddModal(false);
      setAddForm({ messNumber: '', name: '', room: '', branch: '', year: '', mobile: '' });
      await fetchData();
    } catch (err) {
      setAddError(err.message || 'Failed to add student');
    } finally {
      setAddBusy(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!studentToDelete) return;
    setDeleteBusy(true);
    try {
      await api.del(`/students/${studentToDelete.messNumber}`);
      setStudentToDelete(null);
      await fetchData();
    } catch (err) {
      alert(`Could not remove student: ${err.message}`);
    } finally {
      setDeleteBusy(false);
    }
  };

  const processedStudents = useMemo(() => {
    const q = search.trim().toLowerCase();
    return students
      .map((s) => {
        const onLeave = leavesSet.has(`${s.messNumber}_${todayIso}`);
        return {
          ...s,
          onLeave,
          statusText: onLeave ? 'On Leave' : 'Present',
        };
      })
      .filter((s) => {
        if (filter === 'present' && s.onLeave) return false;
        if (filter === 'onleave' && !s.onLeave) return false;

        if (!q) return true;
        return (
          s.name?.toLowerCase().includes(q) ||
          String(s.messNumber).includes(q) ||
          s.room?.toLowerCase().includes(q) ||
          s.branch?.toLowerCase().includes(q) ||
          s.mobile?.includes(q)
        );
      });
  }, [students, leavesSet, todayIso, search, filter]);

  const totalPresent = useMemo(() => {
    return students.filter((s) => !leavesSet.has(`${s.messNumber}_${todayIso}`)).length;
  }, [students, leavesSet, todayIso]);

  const totalOnLeave = students.length - totalPresent;

  const totalPages = Math.max(1, Math.ceil(processedStudents.length / pageSize));
  const paginated = processedStudents.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="ui-card" style={{ position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: '0 0 6px 0' }}>Student Details & Attendance</h2>
          <div style={{ fontSize: '13px', color: 'var(--muted)', display: 'flex', gap: '14px' }}>
            <span>Total Enrolled: <strong style={{ color: 'var(--ink)' }}>{students.length}</strong></span>
            <span>Present Today: <strong style={{ color: 'var(--success)' }}>{totalPresent}</strong></span>
            <span>On Leave Today: <strong style={{ color: 'var(--amber-pressed)' }}>{totalOnLeave}</strong></span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Search name, mess no, room..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              background: 'var(--paper)',
              outline: 'none',
              minWidth: '200px',
            }}
          />
          <select
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setPage(1);
            }}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              background: 'var(--paper)',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="all">All Students ({students.length})</option>
            <option value="present">Present ({totalPresent})</option>
            <option value="onleave">On Leave ({totalOnLeave})</option>
          </select>
          <button
            className="primaryBtn"
            onClick={() => setShowAddModal(true)}
            style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '13px' }}
          >
            + Add Student
          </button>
          <button className="ghost dark" onClick={fetchData} title="Refresh roster">
            ↻
          </button>
        </div>
      </div>

      {error && <p className="error" style={{ marginBottom: '16px' }}>{error}</p>}

      {loading ? (
        <p className="muted" style={{ padding: '32px 0', textAlign: 'center' }}>Loading student roster…</p>
      ) : (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '80px' }}>Mess No</th>
                  <th>Name</th>
                  <th>Room</th>
                  <th>Branch / Year</th>
                  <th>Mobile</th>
                  <th>Today's Status</th>
                  <th style={{ textAlign: 'right', width: '90px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '32px', color: 'var(--muted)' }}>
                      No students found matching "{search}".
                    </td>
                  </tr>
                ) : (
                  paginated.map((s) => (
                    <tr key={s.messNumber}>
                      <td style={{ fontWeight: '700', color: 'var(--amber-pressed)' }}>#{s.messNumber}</td>
                      <td style={{ fontWeight: '600' }}>{s.name}</td>
                      <td>{s.room || '—'}</td>
                      <td className="muted">{[s.branch, s.year].filter(Boolean).join(' • ') || '—'}</td>
                      <td className="muted">{s.mobile || '—'}</td>
                      <td>
                        <span className={`status-badge ${s.onLeave ? 'pending' : 'present'}`}>
                          {s.onLeave ? 'On Leave' : 'Present'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="ghost"
                          style={{
                            padding: '4px 8px',
                            color: 'var(--danger)',
                            fontSize: '12px',
                            fontWeight: '600',
                          }}
                          onClick={() => setStudentToDelete(s)}
                          title="Remove student from mess"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', fontSize: '13px', color: 'var(--muted)' }}>
              <div>
                Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, processedStudents.length)} of {processedStudents.length} students
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="ghost dark"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  style={{ padding: '6px 14px', fontSize: '13px' }}
                >
                  Previous
                </button>
                <span style={{ alignSelf: 'center', fontWeight: '600', color: 'var(--ink)' }}>
                  {page} / {totalPages}
                </span>
                <button
                  className="ghost dark"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  style={{ padding: '6px 14px', fontSize: '13px' }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Modal: Add Student ── */}
      {showAddModal && (
        <div style={modalOverlayStyle}>
          <div style={modalBoxStyle}>
            <h3 style={{ margin: '0 0 16px 0', color: 'var(--ink)' }}>Add New Student to Mess</h3>
            {addError && <p className="error" style={{ marginBottom: '12px' }}>{addError}</p>}
            <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={labelStyle}>Mess Number *</label>
                <input
                  type="number"
                  placeholder="e.g. 419"
                  required
                  value={addForm.messNumber}
                  onChange={(e) => setAddForm({ ...addForm, messNumber: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Student Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  required
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Room No</label>
                  <input
                    type="text"
                    placeholder="e.g. B-104"
                    value={addForm.room}
                    onChange={(e) => setAddForm({ ...addForm, room: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Branch</label>
                  <input
                    type="text"
                    placeholder="e.g. COMP / ME"
                    value={addForm.branch}
                    onChange={(e) => setAddForm({ ...addForm, branch: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Year</label>
                  <input
                    type="text"
                    placeholder="e.g. TE"
                    value={addForm.year}
                    onChange={(e) => setAddForm({ ...addForm, year: e.target.value })}
                    style={inputStyle}
                  />
                </div>
              </div>
              <div>
                <label style={labelStyle}>10-Digit Mobile Number *</label>
                <input
                  type="tel"
                  placeholder="e.g. 9876543210"
                  required
                  maxLength={10}
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
                  {addBusy ? 'Adding…' : 'Add Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Delete Confirmation ── */}
      {studentToDelete && (
        <div style={modalOverlayStyle}>
          <div style={{ ...modalBoxStyle, maxWidth: '400px' }}>
            <h3 style={{ margin: '0 0 10px 0', color: 'var(--danger)' }}>Remove Student</h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: 'var(--ink)', lineHeight: '1.5' }}>
              Are you sure you want to remove <strong>{studentToDelete.name}</strong> (Mess No. #{studentToDelete.messNumber}) from the mess roster?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                className="ghost dark"
                onClick={() => setStudentToDelete(null)}
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
  maxWidth: '480px',
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
