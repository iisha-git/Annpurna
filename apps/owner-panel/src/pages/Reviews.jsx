import React, { useState } from 'react';

const mockReviews = [
  { stars: 5, text: 'Food quality was really good today, loved the paneer.', date: 'Today, 1:30 PM' },
  { stars: 3, text: 'Lunch was a little late.', date: 'Today, 1:15 PM' },
  { stars: 4, text: 'Overall good, but breakfast could have more variety.', date: 'Yesterday' },
  { stars: 5, text: 'Hygiene is well maintained.', date: 'Yesterday' },
  { stars: 2, text: 'The dal was too watery today.', date: '2 Days Ago' },
  { stars: 4, text: 'Good food.', date: '3 Days Ago' },
];

export default function Reviews() {
  const [crowdLevel, setCrowdLevel] = useState('MODERATE');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Top Row: Overall Rating & Crowd Control */}
      <div className="dashboard-grid">
        <div className="ui-card">
          <h2>Overall Rating</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div style={{ fontSize: '48px', fontWeight: '800', color: 'var(--amber)' }}>4.2</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <div style={{ width: '40px', fontSize: '12px', color: 'var(--muted)' }}>5 Star</div>
                <div style={{ flex: 1, height: '8px', background: 'var(--paper)', borderRadius: '4px' }}>
                  <div style={{ width: '60%', height: '100%', background: 'var(--amber)', borderRadius: '4px' }}></div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <div style={{ width: '40px', fontSize: '12px', color: 'var(--muted)' }}>4 Star</div>
                <div style={{ flex: 1, height: '8px', background: 'var(--paper)', borderRadius: '4px' }}>
                  <div style={{ width: '25%', height: '100%', background: 'var(--amber)', borderRadius: '4px' }}></div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <div style={{ width: '40px', fontSize: '12px', color: 'var(--muted)' }}>3 Star</div>
                <div style={{ flex: 1, height: '8px', background: 'var(--paper)', borderRadius: '4px' }}>
                  <div style={{ width: '10%', height: '100%', background: 'var(--amber)', borderRadius: '4px' }}></div>
                </div>
              </div>
            </div>
          </div>
          <div style={{ marginTop: '16px', fontSize: '13px', color: 'var(--muted)' }}>Based on 432 reviews this month</div>
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
        <h2 style={{ marginBottom: '24px' }}>Recent Student Feedback</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {mockReviews.map((r, i) => (
            <div key={i} style={{ borderBottom: i === mockReviews.length - 1 ? 'none' : '1px solid var(--border)', paddingBottom: i === mockReviews.length - 1 ? '0' : '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ color: 'var(--amber)', fontSize: '18px' }}>
                  {'★'.repeat(r.stars)}{'☆'.repeat(5 - r.stars)}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{r.date}</div>
              </div>
              <div style={{ fontSize: '15px', color: 'var(--ink)', lineHeight: '1.5' }}>"{r.text}"</div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
