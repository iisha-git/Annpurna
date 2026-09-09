import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../api';

export default function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [crowdLevel, setCrowdLevel] = useState('MODERATE');

  // Delete State
  const [reviewToDelete, setReviewToDelete] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/reviews/general');
      setReviews(res.reviews || []);
    } catch (err) {
      setError(err.message || 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleDeleteConfirm = async () => {
    if (!reviewToDelete) return;
    setDeleteBusy(true);
    try {
      await api.del(`/reviews/${reviewToDelete._id || reviewToDelete.id}`);
      setReviewToDelete(null);
      await fetchReviews();
    } catch (err) {
      alert(`Could not delete review: ${err.message}`);
    } finally {
      setDeleteBusy(false);
    }
  };

  // Compute rating metrics
  const { avgRating, counts } = useMemo(() => {
    if (!reviews.length) return { avgRating: '—', counts: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } };
    const sum = reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
    const avg = (sum / reviews.length).toFixed(1);
    const c = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => {
      const star = Math.min(5, Math.max(1, Math.round(r.rating || 5)));
      c[star] = (c[star] || 0) + 1;
    });
    return { avgRating: avg, counts: c };
  }, [reviews]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Row: Overall Rating & Crowd Control */}
      <div className="dashboard-grid">
        <div className="ui-card">
          <h2>Overall Rating</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div style={{ fontSize: '48px', fontWeight: '800', color: 'var(--amber)' }}>{avgRating}</div>
            <div style={{ flex: 1 }}>
              {[5, 4, 3].map((star) => {
                const count = counts[star] || 0;
                const pct = reviews.length ? Math.round((count / reviews.length) * 100) : 0;
                return (
                  <div key={star} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <div style={{ width: '45px', fontSize: '12px', color: 'var(--muted)' }}>{star} Star</div>
                    <div style={{ flex: 1, height: '8px', background: 'var(--paper)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: 'var(--amber)', borderRadius: '4px' }}></div>
                    </div>
                    <div style={{ width: '30px', fontSize: '11px', color: 'var(--muted)', textAlign: 'right' }}>{count}</div>
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{ marginTop: '16px', fontSize: '13px', color: 'var(--muted)' }}>
            Based on {reviews.length} student reviews
          </div>
        </div>

        <div className="ui-card" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <h2>Current Crowd Status</h2>
          <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--amber-pressed)', marginBottom: '16px' }}>{crowdLevel}</div>
          <div style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '16px' }}>Manual Override Control</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: crowdLevel === 'LOW' ? 'var(--dark)' : 'var(--paper)', color: crowdLevel === 'LOW' ? 'var(--amber)' : 'var(--ink)' }}
              onClick={() => setCrowdLevel('LOW')}>
              Low
            </button>
            <button 
              style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: crowdLevel === 'MODERATE' ? 'var(--dark)' : 'var(--paper)', color: crowdLevel === 'MODERATE' ? 'var(--amber)' : 'var(--ink)' }}
              onClick={() => setCrowdLevel('MODERATE')}>
              Moderate
            </button>
            <button 
              style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: crowdLevel === 'HIGH' ? 'var(--dark)' : 'var(--paper)', color: crowdLevel === 'HIGH' ? 'var(--amber)' : 'var(--ink)' }}
              onClick={() => setCrowdLevel('HIGH')}>
              High
            </button>
          </div>
        </div>
      </div>

      {/* Review List */}
      <div className="ui-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2 style={{ margin: '0 0 4px 0' }}>Verified Student Feedback</h2>
            <span style={{ fontSize: '13px', color: 'var(--muted)' }}>All reviews display verified student identity (never anonymous)</span>
          </div>
          <button className="ghost dark" onClick={fetchReviews} title="Refresh reviews">
            ↻ Refresh
          </button>
        </div>

        {error && <p className="error" style={{ marginBottom: '16px' }}>{error}</p>}

        {loading ? (
          <p className="muted" style={{ padding: '32px 0', textAlign: 'center' }}>Loading reviews…</p>
        ) : reviews.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)' }}>
            <p style={{ margin: 0, fontSize: '15px' }}>No student reviews yet.</p>
            <span style={{ fontSize: '13px' }}>Reviews submitted by students in the app will appear here with their name and mess number.</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {reviews.map((r) => {
              const studentName = r.student?.name || `Student #${r.student?._id || r.student}`;
              const messNo = r.student?._id || r.student?.messNumber;
              const room = r.student?.room;
              const dtStr = r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Recently';

              return (
                <div
                  key={r._id || r.id}
                  style={{
                    background: 'var(--paper)',
                    borderRadius: '12px',
                    padding: '16px 20px',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <strong style={{ fontSize: '15px', color: 'var(--ink)' }}>{studentName}</strong>
                        {messNo && (
                          <span style={{ fontSize: '12px', background: 'var(--amber-soft)', color: 'var(--amber-pressed)', padding: '2px 8px', borderRadius: '6px', fontWeight: '700' }}>
                            Mess #{messNo}
                          </span>
                        )}
                        {room && <span style={{ fontSize: '12px', color: 'var(--muted)' }}>• Room {room}</span>}
                      </div>
                      <div style={{ color: 'var(--amber)', fontSize: '15px', marginTop: '4px' }}>
                        {'★'.repeat(r.rating || 5)}{'☆'.repeat(5 - (r.rating || 5))}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--muted)' }}>{dtStr}</span>
                      <button
                        className="ghost"
                        style={{ padding: '4px 8px', fontSize: '12px', color: 'var(--danger)', fontWeight: '600' }}
                        onClick={() => setReviewToDelete(r)}
                        title="Delete review"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <div style={{ fontSize: '14px', color: 'var(--ink)', lineHeight: '1.5', marginTop: '6px' }}>
                    "{r.comment}"
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Modal: Delete Review Confirmation ── */}
      {reviewToDelete && (
        <div style={modalOverlayStyle}>
          <div style={{ ...modalBoxStyle, maxWidth: '400px' }}>
            <h3 style={{ margin: '0 0 10px 0', color: 'var(--danger)' }}>Delete Review</h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: 'var(--ink)', lineHeight: '1.5' }}>
              Are you sure you want to delete this review by <strong>{reviewToDelete.student?.name || 'student'}</strong>?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                className="ghost dark"
                onClick={() => setReviewToDelete(null)}
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
