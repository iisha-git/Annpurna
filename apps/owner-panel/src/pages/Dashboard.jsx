import React, { useState } from 'react';

export default function Dashboard({ onNavigate }) {
  const [crowdLevel, setCrowdLevel] = useState('MODERATE');

  return (
    <div>
      <div className="dashboard-grid">
        <div className="col-left">
          {/* Alerts Preview */}
          <div className="ui-card">
            <h2 style={{ color: 'var(--danger)' }}>Alerts</h2>
            <ul className="alerts-stack" style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '12px', color: 'var(--ink)' }}>
              <li style={{ animationDelay: '0ms' }}><strong>Dal stock</strong> is running extremely low (8kg remaining)</li>
              <li style={{ animationDelay: '550ms' }}><strong>23 students</strong> have pending fees this month</li>
              <li style={{ animationDelay: '1100ms' }}><strong>2 workers</strong> are on leave today</li>
              <li style={{ animationDelay: '1650ms' }}><strong>14 new reviews</strong> received since yesterday</li>
            </ul>
          </div>

          {/* Inventory Preview */}
          <div className="ui-card">
            <h2>Stock Status</h2>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Quantity</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Rice</td>
                  <td style={{ fontWeight: '600' }}>82 kg</td>
                  <td><span className="status-badge good">Good</span></td>
                </tr>
                <tr>
                  <td>Dal</td>
                  <td style={{ fontWeight: '600' }}>8 kg</td>
                  <td><span className="status-badge low">Low</span></td>
                </tr>
                <tr>
                  <td>Cooking Oil</td>
                  <td style={{ fontWeight: '600' }}>12 L</td>
                  <td><span className="status-badge good">Good</span></td>
                </tr>
                <tr>
                  <td>Vegetables</td>
                  <td style={{ fontWeight: '600' }}>18 kg</td>
                  <td><span className="status-badge low">Low</span></td>
                </tr>
              </tbody>
            </table>
            <button 
              className="ghost dark" 
              style={{ marginTop: '16px' }}
              onClick={() => onNavigate('inventory')}>
              View Inventory
            </button>
          </div>

          {/* Reviews Preview */}
          <div className="ui-card">
            <h2>Recent Reviews</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                <div style={{ color: 'var(--amber)', fontSize: '14px', marginBottom: '4px' }}>⭐⭐⭐⭐⭐</div>
                <div style={{ fontSize: '14px', color: 'var(--ink)' }}>“Food quality was really good today.”</div>
              </div>
              <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                <div style={{ color: 'var(--amber)', fontSize: '14px', marginBottom: '4px' }}>⭐⭐⭐</div>
                <div style={{ fontSize: '14px', color: 'var(--ink)' }}>“Lunch was a little late.”</div>
              </div>
              <div>
                <div style={{ color: 'var(--amber)', fontSize: '14px', marginBottom: '4px' }}>⭐⭐⭐⭐</div>
                <div style={{ fontSize: '14px', color: 'var(--ink)' }}>“Overall good, but breakfast could have more variety.”</div>
              </div>
            </div>
            <button 
              className="ghost dark" 
              style={{ marginTop: '16px' }}
              onClick={() => onNavigate('reviews')}>
              View all reviews
            </button>
          </div>
        </div>

        <div className="col-right">
          {/* Huge Crowd Status */}
          <div className="ui-card" style={{ background: 'var(--dark)', color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', borderColor: 'var(--dark)' }}>
            <h2 style={{ fontSize: '18px', opacity: 0.9, color: 'var(--amber)' }}>Live Crowd Status</h2>
            <div style={{ fontSize: '42px', fontWeight: '900', letterSpacing: '2px', margin: '8px 0', textTransform: 'uppercase', color: crowdLevel === 'HIGH' ? '#ff6b6b' : crowdLevel === 'LOW' ? '#51cf66' : '#fcc419' }}>
              {crowdLevel}
            </div>
            <div style={{ fontSize: '14px', opacity: 0.8 }}>Based on 186 student responses</div>
            <div style={{ fontSize: '12px', opacity: 0.5, marginTop: '4px' }}>Updated 12 min ago</div>
            
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
                <div style={{ height: '100%', width: '85%', background: 'var(--success)' }}></div>
              </div>
              <div style={{ width: '40px', textAlign: 'right', fontWeight: '700', color: 'var(--success)' }}>421</div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
              <div style={{ width: '80px', fontWeight: '600', fontSize: '14px', color: 'var(--muted)' }}>Absent</div>
              <div style={{ flex: 1, height: '28px', background: 'var(--paper)', borderRadius: '6px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: '15%', background: 'var(--danger)' }}></div>
              </div>
              <div style={{ width: '40px', textAlign: 'right', fontWeight: '700', color: 'var(--danger)' }}>65</div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '80px', fontWeight: '600', fontSize: '14px', color: 'var(--muted)' }}>On Leave</div>
              <div style={{ flex: 1, height: '28px', background: 'var(--paper)', borderRadius: '6px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: '50%', background: 'var(--amber)' }}></div>
              </div>
              <div style={{ width: '40px', textAlign: 'right', fontWeight: '700', color: 'var(--amber)' }}>42</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
