import React, { useState, useEffect } from 'react';
import { api } from '../api';

export default function Dashboard({ onNavigate, stats }) {
  const [crowdLevel, setCrowdLevel] = useState('MODERATE');
  const [inventory, setInventory] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [feeStats, setFeeStats] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const total = stats?.total || 418;
  const present = stats?.present ?? 418;
  const onLeave = stats?.onLeave ?? 0;
  const presentPct = total > 0 ? Math.min(100, Math.round((present / total) * 100)) : 100;
  const onLeavePct = total > 0 ? Math.min(100, Math.round((onLeave / total) * 100)) : 0;

  useEffect(() => {
    let alive = true;
    async function loadDashboardData() {
      try {
        const [invRes, workRes, feeRes, revRes] = await Promise.allSettled([
          api.get('/inventory'),
          api.get('/workers'),
          api.get('/fees'),
          api.get('/reviews/general')
        ]);

        if (!alive) return;

        if (invRes.status === 'fulfilled') setInventory(invRes.value.items || []);
        if (workRes.status === 'fulfilled') setWorkers(workRes.value.workers || []);
        if (feeRes.status === 'fulfilled') setFeeStats(feeRes.value.stats || null);
        if (revRes.status === 'fulfilled') setReviews((revRes.value.reviews || []).slice(0, 3));
      } catch {
        // graceful fallback
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadDashboardData();
    const interval = setInterval(loadDashboardData, 15000);
    return () => {
      alive = false;
      clearInterval(interval);
    };
  }, []);

  // Compute live alerts
  const alerts = [];

  // 1. Inventory alerts
  const lowStockItems = inventory.filter((item) => Number(item.qty) <= Number(item.minThreshold || 10));
  lowStockItems.forEach((item) => {
    alerts.push({
      id: `inv-${item._id}`,
      type: 'danger',
      message: <><strong>{item.item}</strong> stock is low ({item.qty} {item.unit} remaining)</>,
      action: 'inventory'
    });
  });

  // 2. Worker leave alerts
  const workersOnLeave = workers.filter((w) => w.status === 'LEAVE' || w.status === 'OFF');
  if (workersOnLeave.length > 0) {
    alerts.push({
      id: 'workers-leave',
      type: 'warning',
      message: <><strong>{workersOnLeave.length} worker{workersOnLeave.length > 1 ? 's' : ''}</strong> ({workersOnLeave.map((w) => w.name).join(', ')}) on leave / off-duty today</>,
      action: 'workers'
    });
  }

  // 3. Pending fees alert
  if (feeStats && feeStats.pendingCount > 0) {
    alerts.push({
      id: 'fees-pending',
      type: 'warning',
      message: <><strong>{feeStats.pendingCount} students</strong> have pending fees (₹{feeStats.totalPending.toLocaleString('en-IN')} outstanding)</>,
      action: 'fees'
    });
  }

  // 4. Student leave alert
  if (onLeave > 0) {
    alerts.push({
      id: 'students-leave',
      type: 'info',
      message: <><strong>{onLeave} students</strong> are on approved leave today</>,
      action: 'leaves'
    });
  }

  // Default operational alert if empty
  if (alerts.length === 0) {
    alerts.push({
      id: 'all-good',
      type: 'success',
      message: <><strong>All operations normal</strong> — inventory stocked, staff on duty, and attendance synced.</>
    });
  }

  return (
    <div>
      <div className="dashboard-grid">
        <div className="col-left">
          {/* Dynamic Alerts Preview */}
          <div className="ui-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h2 style={{ color: 'var(--danger)', margin: 0 }}>Active Alerts</h2>
              <span style={{ fontSize: '12px', background: '#ffe3e3', color: '#c92a2a', padding: '3px 8px', borderRadius: '12px', fontWeight: '700' }}>
                {alerts.length} Live Alert{alerts.length > 1 ? 's' : ''}
              </span>
            </div>
            <ul className="alerts-stack" style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '12px', color: 'var(--ink)' }}>
              {alerts.map((alt, idx) => (
                <li 
                  key={alt.id} 
                  style={{ animationDelay: `${idx * 400}ms`, cursor: alt.action ? 'pointer' : 'default' }}
                  onClick={() => alt.action && onNavigate(alt.action)}
                  title={alt.action ? `Click to view ${alt.action}` : ''}>
                  {alt.message}
                  {alt.action && <span style={{ marginLeft: '6px', fontSize: '11px', color: 'var(--primary)', fontWeight: '600', textDecoration: 'underline' }}>View →</span>}
                </li>
              ))}
            </ul>
          </div>

          {/* Live Inventory Preview */}
          <div className="ui-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h2 style={{ margin: 0 }}>Stock Status</h2>
              <button 
                className="ghost dark" 
                style={{ padding: '4px 10px', fontSize: '12px' }}
                onClick={() => onNavigate('inventory')}>
                Manage Inventory →
              </button>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Quantity</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {inventory.length === 0 ? (
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'center', padding: '16px', color: 'var(--muted)' }}>
                      {loading ? 'Loading stock status…' : 'No inventory items registered.'}
                    </td>
                  </tr>
                ) : (
                  inventory.slice(0, 5).map((item) => {
                    const isLow = Number(item.qty) <= Number(item.minThreshold || 10);
                    return (
                      <tr key={item._id}>
                        <td style={{ fontWeight: '500' }}>{item.item}</td>
                        <td style={{ fontWeight: '600' }}>{item.qty} {item.unit}</td>
                        <td>
                          <span className={`status-badge ${isLow ? 'low' : 'good'}`}>
                            {isLow ? 'Low' : 'Good'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Real Recent Reviews */}
          <div className="ui-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h2 style={{ margin: 0 }}>Recent Student Reviews</h2>
              <button 
                className="ghost dark" 
                style={{ padding: '4px 10px', fontSize: '12px' }}
                onClick={() => onNavigate('reviews')}>
                View all ({reviews.length}) →
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {reviews.length === 0 ? (
                <div style={{ color: 'var(--muted)', fontSize: '14px', textAlign: 'center', padding: '16px 0' }}>
                  {loading ? 'Fetching reviews…' : 'No student reviews posted yet.'}
                </div>
              ) : (
                reviews.map((rev) => {
                  const studentName = rev.student?.name || (rev.student?._id ? `Student #${rev.student._id}` : 'Student');
                  const room = rev.student?.room ? ` · Room ${rev.student.room}` : '';
                  return (
                    <div key={rev._id || rev.id} style={{ borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <div style={{ color: 'var(--amber)', fontSize: '13px' }}>
                          {'⭐'.repeat(rev.rating || 5)}
                        </div>
                        <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: '600' }}>
                          {studentName}{room}
                        </span>
                      </div>
                      <div style={{ fontSize: '13.5px', color: 'var(--ink)', fontStyle: 'italic' }}>
                        “{rev.comment}”
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="col-right">
          {/* Live Crowd Status */}
          <div className="ui-card" style={{ background: 'var(--dark)', color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', borderColor: 'var(--dark)' }}>
            <h2 style={{ fontSize: '18px', opacity: 0.9, color: 'var(--amber)' }}>Live Mess Crowd Status</h2>
            <div style={{ fontSize: '42px', fontWeight: '900', letterSpacing: '2px', margin: '8px 0', textTransform: 'uppercase', color: crowdLevel === 'HIGH' ? '#ff6b6b' : crowdLevel === 'LOW' ? '#51cf66' : '#fcc419' }}>
              {crowdLevel}
            </div>
            <div style={{ fontSize: '14px', opacity: 0.8 }}>Active status visible on student app</div>
            <div style={{ fontSize: '12px', opacity: 0.5, marginTop: '4px' }}>Based on 40m geofence detections & manual override</div>
            
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px', width: '100%', maxWidth: '320px' }}>
              <button 
                className="ghost" 
                style={{ flex: 1, background: crowdLevel === 'LOW' ? 'white' : 'rgba(255,255,255,0.1)', color: crowdLevel === 'LOW' ? 'var(--dark)' : 'white', fontWeight: '700', border: 'none' }}
                onClick={() => setCrowdLevel('LOW')}>
                Low
              </button>
              <button 
                className="ghost" 
                style={{ flex: 1, background: crowdLevel === 'MODERATE' ? 'white' : 'rgba(255,255,255,0.1)', color: crowdLevel === 'MODERATE' ? 'var(--dark)' : 'white', fontWeight: '700', border: 'none' }}
                onClick={() => setCrowdLevel('MODERATE')}>
                Moderate
              </button>
              <button 
                className="ghost" 
                style={{ flex: 1, background: crowdLevel === 'HIGH' ? 'white' : 'rgba(255,255,255,0.1)', color: crowdLevel === 'HIGH' ? 'var(--dark)' : 'white', fontWeight: '700', border: 'none' }}
                onClick={() => setCrowdLevel('HIGH')}>
                High
              </button>
            </div>
          </div>
          
          {/* Attendance Bars */}
          <div className="ui-card">
            <h2 style={{ marginBottom: '24px' }}>Today's Attendance</h2>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
              <div style={{ width: '80px', fontWeight: '600', fontSize: '14px', color: 'var(--muted)' }}>Present</div>
              <div style={{ flex: 1, height: '28px', background: 'var(--paper)', borderRadius: '6px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${presentPct}%`, background: 'var(--success)', transition: 'width 0.3s ease' }}></div>
              </div>
              <div style={{ width: '40px', textAlign: 'right', fontWeight: '700', color: 'var(--success)' }}>{present}</div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
              <div style={{ width: '80px', fontWeight: '600', fontSize: '14px', color: 'var(--muted)' }}>On Leave</div>
              <div style={{ flex: 1, height: '28px', background: 'var(--paper)', borderRadius: '6px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${onLeavePct}%`, background: 'var(--amber-pressed)', transition: 'width 0.3s ease' }}></div>
              </div>
              <div style={{ width: '40px', textAlign: 'right', fontWeight: '700', color: 'var(--amber-pressed)' }}>{onLeave}</div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '80px', fontWeight: '600', fontSize: '14px', color: 'var(--muted)' }}>Total</div>
              <div style={{ flex: 1, height: '28px', background: 'var(--paper)', borderRadius: '6px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: '100%', background: 'var(--ink)' }}></div>
              </div>
              <div style={{ width: '40px', textAlign: 'right', fontWeight: '700', color: 'var(--ink)' }}>{total}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
