import React, { useState } from 'react';

import { Avatar, Icon, Stars } from '../ui';

const DIST = [
  ['5 Star', 60],
  ['4 Star', 25],
  ['3 Star', 10],
  ['2 Star', 4],
  ['1 Star', 1],
];

const mockReviews = [
  { stars: 5, text: 'Food quality was really good today, loved the paneer.', date: 'Today, 1:30 PM', name: 'Aarav R.' },
  { stars: 3, text: 'Lunch was a little late.', date: 'Today, 1:15 PM', name: 'Riya P.' },
  { stars: 4, text: 'Overall good, but breakfast could have more variety.', date: 'Yesterday', name: 'Kabir S.' },
  { stars: 5, text: 'Hygiene is well maintained.', date: 'Yesterday', name: 'Ananya D.' },
  { stars: 2, text: 'The dal was too watery today.', date: '2 days ago', name: 'Karan M.' },
  { stars: 4, text: 'Good food.', date: '3 days ago', name: 'Sneha R.' },
];

export default function Reviews() {
  const [crowdLevel, setCrowdLevel] = useState('MODERATE');

  return (
    <div className="stack">
      <div className="grid-2">
        <section className="card card-pad">
          <h3 style={{ fontSize: 15.5, fontWeight: 800, marginBottom: 18 }}>Overall rating</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 46, fontWeight: 600, lineHeight: 1, color: 'var(--ink)' }}>
                4.2
              </div>
              <Stars value={4} size={12} />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {DIST.map(([label, pct]) => (
                <div key={label} style={{ display: 'grid', gridTemplateColumns: '52px 1fr 34px', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--muted)' }}>{label}</span>
                  <span style={{ height: 8, borderRadius: 999, background: 'var(--surface-soft)', overflow: 'hidden', display: 'block' }}>
                    <i style={{ display: 'block', height: '100%', width: `${pct}%`, borderRadius: 999, background: 'linear-gradient(90deg, var(--brand-hi), var(--brand))' }} />
                  </span>
                  <span style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--muted)', textAlign: 'right' }}>{pct}%</span>
                </div>
              ))}
            </div>
          </div>
          <p style={{ margin: '18px 0 0', fontSize: 13, fontWeight: 700, color: 'var(--muted)' }}>
            Based on 432 reviews this month
          </p>
        </section>

        <section className="card card-pad">
          <h3 style={{ fontSize: 15.5, fontWeight: 800, marginBottom: 4 }}>Current crowd status</h3>
          <p style={{ margin: '0 0 14px', fontSize: 12.5, fontWeight: 700, color: 'var(--muted)' }}>Manual override — students use this to plan trips</p>

          <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: 2, color: 'var(--warn)', marginBottom: 14, textTransform: 'uppercase' }}>
            {crowdLevel}
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            {['LOW', 'MODERATE', 'HIGH'].map((lvl) => (
              <button
                key={lvl}
                className={`btn btn-sm ${crowdLevel === lvl ? 'btn-primary' : 'btn-ghost'}`}
                style={{ flex: 1, display: 'grid', placeItems: 'center' }}
                onClick={() => setCrowdLevel(lvl)}>
                {lvl === 'LOW' ? 'Low' : lvl === 'MODERATE' ? 'Moderate' : 'High'}
              </button>
            ))}
          </div>
          <p style={{ margin: '14px 0 0', fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>
            Overrides are shown to students instantly on Home.
          </p>
        </section>
      </div>

      <section className="card">
        <div className="card-head">
          <div>
            <h3>Recent student feedback</h3>
            <p className="sub">Newest first · {mockReviews.length} this week</p>
          </div>
          <button className="btn btn-ghost btn-sm"><Icon name="refresh" size={13} /> Refresh</button>
        </div>
        <div className="card-body">
          {mockReviews.map((r) => (
            <div className="review-item" key={r.text}>
              <Avatar name={r.name} size={36} plain />
              <div style={{ flex: 1, minWidth: 0 }}>
                <header>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <b style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink)' }}>{r.name}</b>
                    <Stars value={r.stars} size={12} />
                  </div>
                  <span className="review-time">{r.date}</span>
                </header>
                <p className="review-txt">“{r.text}”</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}