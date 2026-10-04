import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { api } from '../api';
import { Avatar, Icon } from '../ui';
import { openWhatsAppInvite } from '../lib/whatsappInvite';

const FILTERS = [
  ['all', 'All Students'],
  ['present', 'Present Today'],
  ['onLeave', 'On Leave (Absent)'],
  ['paid', 'Fees Paid'],
  ['pending', 'Fees Pending'],
  ['claimed', 'App Registered'],
  ['unclaimed', 'Unclaimed'],
];

const PAGE_SIZE = 30;

export default function StudentDetails() {
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({ present: 0, onLeave: 0, onLeaveMessNumbers: [] });
  const [feeData, setFeeData] = useState({ paidCount: 0, pendingCount: 0, rosterMap: new Map() });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);

  // Add student modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    messNumber: '',
    name: '',
    room: '',
    branch: '',
    year: 'BE',
    mobile: '',
  });

  const fetchData = useCallback(async () => {
    try {
      const [stuRes, attRes, feeRes] = await Promise.all([
        api.get('/students'),
        api.get('/students/attendance-summary').catch(() => ({})),
        api.get('/fees').catch(() => ({})),
      ]);

      const stuList = stuRes?.students || [];
      const onLeaveSet = new Set((attRes?.onLeaveMessNumbers || []).map(String));

      const feeRosterMap = new Map();
      if (Array.isArray(feeRes?.roster)) {
        feeRes.roster.forEach((r) => {
          feeRosterMap.set(String(r.messNumber), r);
        });
      }

      const enriched = stuList.map((s) => {
        const idStr = String(s.messNumber || s.id);
        const feeInfo = feeRosterMap.get(idStr);
        const isLeave = onLeaveSet.has(idStr);
        return {
          id: idStr,
          messNumber: idStr,
          name: s.name,
          room: s.room || '—',
          branch: s.branch || '—',
          year: s.year || '',
          mobile: s.mobile || '—',
          claimed: Boolean(s.claimed),
          active: s.active !== false,
          status: isLeave ? 'Absent' : 'Present',
          fee: feeInfo?.status === 'PAID' ? 'Paid' : 'Pending',
        };
      });

      setStudents(enriched);
      setAttendance({
        present: attRes?.present ?? Math.max(0, enriched.length - onLeaveSet.size),
        onLeave: attRes?.onLeave ?? onLeaveSet.size,
        onLeaveMessNumbers: attRes?.onLeaveMessNumbers || [],
      });
      setFeeData({
        paidCount: feeRes?.paidCount ?? 0,
        pendingCount: feeRes?.pendingCount ?? enriched.length,
        rosterMap: feeRosterMap,
      });
    } catch (e) {
      setError(e.message || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter & Search
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return students.filter((s) => {
      if (
        term &&
        !`${s.name} ${s.messNumber} ${s.room} ${s.branch} ${s.mobile}`.toLowerCase().includes(term)
      ) {
        return false;
      }
      if (filter === 'present' && s.status !== 'Present') return false;
      if (filter === 'onLeave' && s.status !== 'Absent') return false;
      if (filter === 'paid' && s.fee !== 'Paid') return false;
      if (filter === 'pending' && s.fee !== 'Pending') return false;
      if (filter === 'claimed' && !s.claimed) return false;
      if (filter === 'unclaimed' && s.claimed) return false;
      return true;
    });
  }, [students, q, filter]);

  // Reset page when filter or search changes
  useEffect(() => {
    setPage(1);
  }, [q, filter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pagedRows = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  // Toggle Fee
  async function toggleFee(student) {
    const nextPaid = student.fee !== 'Paid';
    try {
      if (nextPaid) {
        await api.post('/fees/pay', { messNumber: student.messNumber, amount: 3000 });
        setToast(`Marked #${student.messNumber} (${student.name}) as Paid`);
      } else {
        await api.post('/fees/unpay', { messNumber: student.messNumber });
        setToast(`Marked #${student.messNumber} (${student.name}) as Pending`);
      }
      setStudents((prev) =>
        prev.map((s) => (s.id === student.id ? { ...s, fee: nextPaid ? 'Paid' : 'Pending' } : s))
      );
    } catch (err) {
      setError(err.message);
    }
  }

  // Invite student via WhatsApp
  function sendInvite(student) {
    try {
      openWhatsAppInvite(student);
      setToast(`Opening WhatsApp invitation for ${student.name}…`);
      api.post(`/students/${encodeURIComponent(student.messNumber)}/invite`).catch(() => {});
    } catch (err) {
      setError(err.message);
    }
  }

  // Add student
  async function handleAddStudent(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await api.post('/students', {
        messNumber: form.messNumber.trim(),
        name: form.name.trim(),
        room: form.room.trim(),
        branch: form.branch.trim(),
        year: form.year.trim(),
        mobile: form.mobile.trim(),
      });
      setShowAddModal(false);
      setForm({ messNumber: '', name: '', room: '', branch: '', year: 'BE', mobile: '' });
      setToast(`Student ${form.name} added successfully!`);
      await fetchData();
    } catch (err) {
      setError(err.message);
    }
    setSaving(false);
  }

  return (
    <div className="stack">
      {/* ── KPI strip ─────────────────────────────────────────────── */}
      <div className="stats cols-3">
        <div className="card card-pad stat">
          <span className="stat-ico tone-violet sm"><Icon name="users" size={17} /></span>
          <div>
            <div className="stat-label">Total Students</div>
            <div className="stat-value">{students.length}</div>
            <span className="stat-delta flat">Enrolled in roster</span>
          </div>
        </div>
        <div className="card card-pad stat">
          <span className="stat-ico tone-green sm"><Icon name="checkCircle" size={17} /></span>
          <div>
            <div className="stat-label">Present Today</div>
            <div className="stat-value">{attendance.present}</div>
            <span className="stat-delta up">{attendance.onLeave} on approved leave</span>
          </div>
        </div>
        <div className="card card-pad stat">
          <span className="stat-ico tone-amber sm"><Icon name="rupee" size={17} /></span>
          <div>
            <div className="stat-label">Fee Status</div>
            <div className="stat-value">{feeData.paidCount} Paid</div>
            <span className="stat-delta flat">{feeData.pendingCount} pending dues</span>
          </div>
        </div>
      </div>

      {/* ── Toast / Alerts ────────────────────────────────────────── */}
      {(error || toast) && (
        <div
          className="form-error"
          style={{
            background: toast && !error ? 'var(--success-bg, #ecfdf5)' : undefined,
            color: toast && !error ? 'var(--success, #059669)' : undefined,
            cursor: 'pointer',
          }}
          onClick={() => { setError(''); setToast(''); }}
        >
          <Icon name={error ? 'alert' : 'check'} size={15} />
          {error || toast} — click to dismiss
        </div>
      )}

      {/* ── Main table card ───────────────────────────────────────── */}
      <section className="card">
        <div className="toolbar" style={{ padding: '16px 22px 0', marginBottom: 12 }}>
          <div className="toolbar-l">
            <span className="search-wrap">
              <Icon name="search" size={15} />
              <input
                className="field"
                placeholder="Search name, mess #, room, branch…"
                value={q}
                style={{ width: 280 }}
                onChange={(e) => setQ(e.target.value)}
              />
            </span>
          </div>
          <div className="toolbar-r" style={{ gap: 10, display: 'flex' }}>
            <select
              className="field"
              style={{ width: 180 }}
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              {FILTERS.map(([v, label]) => (
                <option key={v} value={v}>
                  {label}
                </option>
              ))}
            </select>
            <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
              <Icon name="plus" size={15} /> Add student
            </button>
          </div>
        </div>

        <div className="table-wrap" style={{ padding: '4px 22px 14px' }}>
          {loading ? (
            <div className="empty-state">
              <p>Loading real student roster…</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: 80 }}>Mess #</th>
                  <th>Student</th>
                  <th>Room</th>
                  <th>Mobile</th>
                  <th>Today's Attendance</th>
                  <th>Fee Status</th>
                  <th style={{ textAlign: 'right' }}>App / Actions</th>
                </tr>
              </thead>
              <tbody>
                {pagedRows.map((s) => (
                  <tr key={s.id}>
                    {/* Mess Number */}
                    <td>
                      <b style={{ color: 'var(--ink)' }}>#{s.messNumber}</b>
                    </td>

                    {/* Student Name & Branch */}
                    <td>
                      <span className="cell-main">
                        <Avatar name={s.name} size={32} plain />
                        <span>
                          <b>{s.name}</b>
                          <div className="cell-sub">
                            {s.year ? `${s.year} ` : ''}{s.branch !== '—' ? `${s.branch}` : ''}
                          </div>
                        </span>
                      </span>
                    </td>

                    {/* Room */}
                    <td>
                      <span className="badge" style={{ background: '#f4ede4', color: 'var(--ink)' }}>
                        {s.room}
                      </span>
                    </td>

                    {/* Mobile */}
                    <td className="cell-sub" style={{ fontSize: 13 }}>
                      {s.mobile}
                    </td>

                    {/* Today's Attendance */}
                    <td>
                      <span
                        className={`badge ${s.status === 'Present' ? 'good' : 'low'}`}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      >
                        <span
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            background: s.status === 'Present' ? '#10b981' : '#ef4444',
                          }}
                        />
                        {s.status === 'Present' ? 'Present' : 'On Leave'}
                      </span>
                    </td>

                    {/* Fee Status (Clickable to toggle) */}
                    <td>
                      <button
                        className={`badge ${s.fee === 'Paid' ? 'good' : 'low'}`}
                        style={{
                          border: 'none',
                          cursor: 'pointer',
                          padding: '4px 9px',
                          fontWeight: 700,
                        }}
                        title="Click to toggle fee payment"
                        onClick={() => toggleFee(s)}
                      >
                        {s.fee === 'Paid' ? '✓ Paid' : 'Pending'}
                      </button>
                    </td>

                    {/* App Registration & WhatsApp Invite */}
                    <td style={{ textAlign: 'right' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        {s.claimed ? (
                          <span
                            className="badge good"
                            style={{ fontSize: 11, background: '#ecfdf5', color: '#059669' }}
                          >
                            <Icon name="checkCircle" size={11} /> App Active
                          </span>
                        ) : (
                          <button
                            className="btn btn-sm btn-ghost"
                            style={{ fontSize: 12, padding: '5px 9px' }}
                            title="Send WhatsApp invitation"
                            onClick={() => sendInvite(s)}
                          >
                            <Icon name="send" size={12} /> Invite
                          </button>
                        )}
                      </span>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && !loading && (
                  <tr>
                    <td colSpan={7}>
                      <div className="empty-state">
                        <span className="empty-ico"><Icon name="search" size={20} /></span>
                        <b>No students found</b>
                        <p>{q ? 'Try changing your search keywords.' : 'No students match this filter.'}</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* ── Pagination footer ─────────────────────────────────────── */}
        {!loading && filtered.length > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 22px 18px',
              borderTop: '1px solid var(--border)',
              fontSize: 13,
              color: 'var(--muted)',
            }}
          >
            <div>
              Showing <b>{(page - 1) * PAGE_SIZE + 1}</b>–
              <b>{Math.min(page * PAGE_SIZE, filtered.length)}</b> of <b>{filtered.length}</b> students
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                className="btn btn-sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <span style={{ fontWeight: 700, padding: '0 4px', color: 'var(--ink)' }}>
                Page {page} of {totalPages}
              </span>
              <button
                className="btn btn-sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ── Add Student Modal ─────────────────────────────────────── */}
      {showAddModal && (
        <div
          className="modal-backdrop"
          onClick={(e) => { if (e.target === e.currentTarget) setShowAddModal(false); }}
        >
          <div className="modal" role="dialog" aria-modal="true" style={{ maxWidth: 500 }}>
            <div className="modal-head">
              <div>
                <h3>Add New Student</h3>
                <p>Register a student to the mess roster</p>
              </div>
              <button
                className="icon-btn"
                style={{ width: 32, height: 32 }}
                onClick={() => setShowAddModal(false)}
              >
                <Icon name="x" size={15} />
              </button>
            </div>
            <form onSubmit={handleAddStudent} style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-grid form-grid--wide-first">
                <label className="field-group">
                  <span>Mess Number *</span>
                  <input
                    className="field"
                    placeholder="e.g. 419"
                    required
                    value={form.messNumber}
                    onChange={(e) => setForm((f) => ({ ...f, messNumber: e.target.value }))}
                  />
                </label>
                <label className="field-group">
                  <span>Full Name *</span>
                  <input
                    className="field"
                    placeholder="e.g. Rahul Sharma"
                    required
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  />
                </label>
              </div>

              <div className="form-grid form-grid--3">
                <label className="field-group">
                  <span>Room</span>
                  <input
                    className="field"
                    placeholder="e.g. 118"
                    value={form.room}
                    onChange={(e) => setForm((f) => ({ ...f, room: e.target.value }))}
                  />
                </label>
                <label className="field-group">
                  <span>Branch</span>
                  <input
                    className="field"
                    placeholder="e.g. COMP"
                    value={form.branch}
                    onChange={(e) => setForm((f) => ({ ...f, branch: e.target.value }))}
                  />
                </label>
                <label className="field-group">
                  <span>Year</span>
                  <select
                    className="field"
                    value={form.year}
                    onChange={(e) => setForm((f) => ({ ...f, year: e.target.value }))}
                  >
                    <option>FE</option>
                    <option>SE</option>
                    <option>TE</option>
                    <option>BE</option>
                  </select>
                </label>
              </div>

              <label className="field-group">
                <span>Mobile (10 digits)</span>
                <input
                  className="field"
                  placeholder="e.g. 9823412345"
                  value={form.mobile}
                  onChange={(e) => setForm((f) => ({ ...f, mobile: e.target.value }))}
                />
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" className="btn" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Adding…' : 'Add to roster'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}