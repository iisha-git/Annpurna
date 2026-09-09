import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../api';

function getCurrentMonthKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function Fees() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthKey);
  const [monthlyFee, setMonthlyFee] = useState(3000);
  const [editingFee, setEditingFee] = useState(false);
  const [tempFee, setTempFee] = useState('3000');

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // 'all' | 'pending' | 'paid'
  const [page, setPage] = useState(1);
  const pageSize = 50;

  // Mark as Paid Modal
  const [payingStudent, setPayingStudent] = useState(null);
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [payAmount, setPayAmount] = useState('3000');
  const [payBusy, setPayBusy] = useState(false);

  // Month options (current year)
  const monthOptions = useMemo(() => {
    const year = new Date().getFullYear();
    return Array.from({ length: 12 }, (_, i) => {
      const m = String(i + 1).padStart(2, '0');
      return {
        key: `${year}-${m}`,
        label: `${MONTH_NAMES[i]} ${year}`,
      };
    });
  }, []);

  const fetchFees = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get(`/fees?month=${selectedMonth}&fee=${monthlyFee}`);
      setData(res);
    } catch (err) {
      setError(err.message || 'Failed to load fee records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFees();
  }, [selectedMonth, monthlyFee]);

  const handlePaySubmit = async (e) => {
    e.preventDefault();
    if (!payingStudent) return;
    setPayBusy(true);
    try {
      await api.post('/fees/pay', {
        messNumber: payingStudent.messNumber,
        month: selectedMonth,
        amount: Number(payAmount) || monthlyFee,
        paymentMode,
      });
      setPayingStudent(null);
      await fetchFees();
    } catch (err) {
      alert(`Could not record payment: ${err.message}`);
    } finally {
      setPayBusy(false);
    }
  };

  const handleUnpay = async (student) => {
    if (!window.confirm(`Revert payment status for ${student.name} (#${student.messNumber}) back to PENDING?`)) {
      return;
    }
    try {
      await api.post('/fees/unpay', {
        messNumber: student.messNumber,
        month: selectedMonth,
      });
      await fetchFees();
    } catch (err) {
      alert(`Could not revert payment: ${err.message}`);
    }
  };

  const processedStudents = useMemo(() => {
    const list = data?.students || [];
    const q = search.trim().toLowerCase();

    return list.filter((s) => {
      if (filter === 'pending' && s.status !== 'PENDING') return false;
      if (filter === 'paid' && s.status !== 'PAID') return false;

      if (!q) return true;
      return (
        s.name?.toLowerCase().includes(q) ||
        String(s.messNumber).includes(q) ||
        s.room?.toLowerCase().includes(q) ||
        s.mobile?.includes(q)
      );
    });
  }, [data, search, filter]);

  const totalPages = Math.max(1, Math.ceil(processedStudents.length / pageSize));
  const paginated = processedStudents.slice((page - 1) * pageSize, page * pageSize);

  const formatCurrency = (amt) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amt || 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: '0 0 4px 0' }}>Mess Fees Management</h2>
          <span style={{ fontSize: '13px', color: 'var(--muted)' }}>
            Track and record monthly mess payments for all enrolled students
          </span>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {editingFee ? (
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <input
                type="number"
                value={tempFee}
                onChange={(e) => setTempFee(e.target.value)}
                style={{ width: '90px', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)' }}
              />
              <button
                className="primaryBtn"
                style={{ padding: '6px 12px', fontSize: '12px' }}
                onClick={() => {
                  setMonthlyFee(Number(tempFee) || 3000);
                  setEditingFee(false);
                }}
              >
                Save
              </button>
            </div>
          ) : (
            <button
              className="ghost dark"
              style={{ fontSize: '12px', padding: '7px 12px' }}
              onClick={() => {
                setTempFee(String(monthlyFee));
                setEditingFee(true);
              }}
              title="Change standard monthly fee"
            >
              Fee: ₹{monthlyFee}/mo ✎
            </button>
          )}

          <select
            value={selectedMonth}
            onChange={(e) => {
              setSelectedMonth(e.target.value);
              setPage(1);
            }}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            {monthOptions.map((m) => (
              <option key={m.key} value={m.key}>{m.label}</option>
            ))}
          </select>
          <button className="ghost dark" onClick={fetchFees} title="Refresh fees">
            ↻
          </button>
        </div>
      </div>

      {/* Dynamic Summary Cards */}
      <div className="summary-cards" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        <div className="summary-card">
          <div className="summary-label">Expected Total</div>
          <div className="summary-value">{formatCurrency(data?.expectedAmount)}</div>
          <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '8px' }}>
            Based on {formatCurrency(monthlyFee)} × {data?.totalStudents || 418} students
          </div>
        </div>

        <div className="summary-card" style={{ background: '#e6f4ea', borderColor: '#cce5d3' }}>
          <div className="summary-label" style={{ color: 'var(--success)' }}>Total Collected</div>
          <div className="summary-value" style={{ color: 'var(--success)' }}>
            {formatCurrency(data?.collectedAmount)}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--success)', marginTop: '8px', fontWeight: '600' }}>
            {data?.paidCount || 0} students ({data?.percentCollected || 0}% collected)
          </div>
        </div>

        <div className="summary-card" style={{ background: '#fce8e6', borderColor: '#f5c6cb' }}>
          <div className="summary-label" style={{ color: 'var(--danger)' }}>Total Pending</div>
          <div className="summary-value" style={{ color: 'var(--danger)' }}>
            {formatCurrency(data?.pendingAmount)}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--danger)', marginTop: '8px', fontWeight: '600' }}>
            {data?.pendingCount || 0} students pending
          </div>
        </div>
      </div>

      {/* Roster Payment Table */}
      <div className="ui-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <h3 style={{ margin: 0 }}>Student Payment Records</h3>
            <span style={{ fontSize: '12px', color: 'var(--muted)' }}>({processedStudents.length} matching)</span>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Search by name, mess no..."
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
              <option value="all">All Students ({data?.totalStudents || 0})</option>
              <option value="pending">Pending Only ({data?.pendingCount || 0})</option>
              <option value="paid">Paid Only ({data?.paidCount || 0})</option>
            </select>
          </div>
        </div>

        {error && <p className="error" style={{ marginBottom: '16px' }}>{error}</p>}

        {loading ? (
          <p className="muted" style={{ padding: '32px 0', textAlign: 'center' }}>Loading student fee records…</p>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '80px' }}>Mess No</th>
                    <th>Student Name</th>
                    <th>Room</th>
                    <th>Mobile</th>
                    <th>Amount</th>
                    <th>Payment Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '32px', color: 'var(--muted)' }}>
                        No students found matching your search / filter.
                      </td>
                    </tr>
                  ) : (
                    paginated.map((s) => {
                      const isPaid = s.status === 'PAID';
                      return (
                        <tr key={s.messNumber}>
                          <td style={{ fontWeight: '700', color: 'var(--amber-pressed)' }}>#{s.messNumber}</td>
                          <td style={{ fontWeight: '600' }}>{s.name}</td>
                          <td>{s.room}</td>
                          <td className="muted">{s.mobile}</td>
                          <td style={{ fontWeight: '700' }}>{formatCurrency(s.amount)}</td>
                          <td>
                            <span className={`status-badge ${isPaid ? 'good' : 'low'}`}>
                              {isPaid ? `Paid (${s.paymentMode || 'UPI'})` : 'Pending'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            {isPaid ? (
                              <button
                                className="ghost"
                                style={{ fontSize: '12px', color: 'var(--muted)', padding: '4px 8px' }}
                                onClick={() => handleUnpay(s)}
                                title="Revert back to pending"
                              >
                                Revert ↺
                              </button>
                            ) : (
                              <button
                                className="primaryBtn"
                                style={{ padding: '5px 14px', fontSize: '12px', borderRadius: '6px' }}
                                onClick={() => {
                                  setPayingStudent(s);
                                  setPayAmount(String(s.amount || monthlyFee));
                                }}
                              >
                                Mark as Paid
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
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
      </div>

      {/* ── Modal: Record Payment ── */}
      {payingStudent && (
        <div style={modalOverlayStyle}>
          <div style={modalBoxStyle}>
            <h3 style={{ margin: '0 0 14px 0', color: 'var(--ink)' }}>
              Record Fee Payment: {payingStudent.name}
            </h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: 'var(--muted)' }}>
              Mess Number #{payingStudent.messNumber} • Room {payingStudent.room}
            </p>
            <form onSubmit={handlePaySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={labelStyle}>Amount Paid (₹) *</label>
                <input
                  type="number"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Payment Method *</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {['UPI', 'Cash', 'Bank Transfer'].map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setPaymentMode(mode)}
                      style={{
                        flex: 1,
                        padding: '10px 8px',
                        borderRadius: '8px',
                        border: '1px solid var(--border)',
                        background: paymentMode === mode ? 'var(--dark)' : 'var(--paper)',
                        color: paymentMode === mode ? 'var(--amber)' : 'var(--ink)',
                        fontWeight: '700',
                        fontSize: '13px',
                      }}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  className="ghost dark"
                  onClick={() => setPayingStudent(null)}
                  disabled={payBusy}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primaryBtn"
                  disabled={payBusy}
                  style={{ padding: '10px 22px', borderRadius: '8px' }}
                >
                  {payBusy ? 'Recording…' : 'Confirm Paid'}
                </button>
              </div>
            </form>
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
