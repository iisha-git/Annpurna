import React, { useState } from 'react';

import { Avatar, Icon, Stars } from '../ui';

const CROWD = {
  LOW: { color: '#4caf50', glow: 'rgba(76,175,80,0.45)', meter: '22%', label: 'No queue — walk right in' },
  MODERATE: { color: '#f59e0b', glow: 'rgba(245,158,11,0.45)', meter: '54%', label: 'A short wait is expected' },
  HIGH: { color: '#e0472e', glow: 'rgba(224,71,46,0.45)', meter: '86%', label: 'Peak hour — suggest waiting 15 min' },
};

const LOW_STOCK = [
  { name: 'Toor Dal', qty: '8 kg', pct: 16, unit: 'of ~50 kg ideal', icon: 'wheat' },
  { name: 'Vegetables', qty: '18 kg', pct: 36, unit: 'of ~50 kg ideal', icon: 'package' },
  { name: 'Milk', qty: '20 L', pct: 40, unit: 'of ~50 L ideal', icon: 'package' },
];

const DUE_STUDENTS = [
  { name: 'Kabir Singh', id: '24ME091', amount: '₹3,000', due: 'Due 5 Aug' },
  { name: 'Karan Malhotra', id: '24IT076', amount: '₹6,000', due: 'Due 5 Jul' },
  { name: 'Neha Gupta', id: '24CS188', amount: '₹3,000', due: 'Due 5 Aug' },
];

const REVIEWS = [
  { name: 'Aarav R.', initials: 'AR', stars: 5, text: 'Food quality was really good today.', time: 'Today · 1:30 pm' },
  { name: 'Riya P.', initials: 'RP', stars: 3, text: 'Lunch was a little late.', time: 'Today · 1:15 pm' },
  { name: 'Kabir S.', initials: 'KS', stars: 4, text: 'Overall good, but breakfast could have more variety.', time: 'Yesterday' },
];

export default function Dashboard({ onNavigate }) {
  const [crowdLevel, setCrowdLevel] = useState('MODERATE');
  const crowd = CROWD[crowdLevel];

  return (
    <div className="stack">
      {/* ── Slim KPI strip (quick scan) ── */}
      <div className="kpis">
        <div className="card card-pad kpi">
          <span className="kpi-ico tone-violet"><Icon name="users" size={19} /></span>
          <div>
            <div className="kpi-num">486</div>
            <div className="kpi-label">Students</div>
            <div className="kpi-note">+12 this term</div>
          </div>
        </div>
        <div className="card card-pad kpi">
          <span className="kpi-ico tone-green"><Icon name="checkCircle" size={19} /></span>
          <div>
            <div className="kpi-num">421</div>
            <div className="kpi-label">Present today</div>
            <div className="kpi-note">86.6% of roster</div>
          </div>
        </div>
        <div className="card card-pad kpi">
          <span className="kpi-ico tone-amber"><Icon name="userX" size={19} /></span>
          <div>
            <div className="kpi-num">42</div>
            <div className="kpi-label">On approved leave</div>
            <div className="kpi-note">2 staff off today</div>
          </div>
        </div>
        <div className="card card-pad kpi">
          <span className="kpi-ico tone-red"><Icon name="rupee" size={19} /></span>
          <div>
            <div className="kpi-num">₹18,500</div>
            <div className="kpi-label">Pending fees</div>
            <div className="kpi-note">23 students</div>
          </div>
        </div>
      </div>

      {/* ── Live hero: crowd + attendance ── */}
      <section className="card card-dark hero-dash">
        <div className="hero-zone crowd-zone">
          <span className="hero-eyebrow"><i className="live-dot" />Live mess crowd</span>
          <div className="crowd-status-lg" style={{ color: crowd.color, textShadow: `0 14px 48px ${crowd.glow}` }}>
            {crowdLevel}
          </div>
          <div className="crowd-meta">{crowd.label}</div>
          <div className="crowd-updated">Based on 186 student responses · updated 12 min ago</div>

          <div className="crowd-meter"><i style={{ width: crowd.meter }} /></div>

          <div className="crowd-opts">
            <button
              className="crowd-opt"
              style={crowdLevel === 'LOW' ? { background: '#4caf50', color: '#fff', borderColor: 'transparent' } : undefined}
              onClick={() => setCrowdLevel('LOW')}>
              Low
            </button>
            <button
              className="crowd-opt"
              style={crowdLevel === 'MODERATE' ? { background: '#f59e0b', color: '#201503', borderColor: 'transparent' } : undefined}
              onClick={() => setCrowdLevel('MODERATE')}>
              Moderate
            </button>
            <button
              className="crowd-opt"
              style={crowdLevel === 'HIGH' ? { background: '#e0472e', color: '#fff', borderColor: 'transparent' } : undefined}
              onClick={() => setCrowdLevel('HIGH')}>
              High
            </button>
          </div>
          <p style={{ margin: '14px 0 0', fontSize: 11, fontWeight: 700, color: '#706680' }}>
            Owners can override — students see this instantly on Home.
          </p>
        </div>

        <div className="hero-divider" />

        <div className="hero-zone">
          <span className="hero-eyebrow"><Icon name="clock" size={13} />Today · mess serving lunch</span>
          <div className="att-layout">
            <div className="donut">
              <div className="donut-center">
                <b>421</b>
                <span>present</span>
              </div>
            </div>
            <div className="att-numbers">
              <div className="att-num">
                <span><i style={{ background: '#51cf66' }} />Present</span>
                <b>421<small>86.6%</small></b>
              </div>
              <div className="att-num">
                <span><i style={{ background: 'var(--brand)' }} />On leave</span>
                <b>42<small>approved</small></b>
              </div>
              <div className="att-num">
                <span><i style={{ background: '#e0472e' }} />Absent</span>
                <b>23<small>no notice</small></b>
              </div>
            </div>
          </div>
          <p style={{ margin: '18px 0 0', fontSize: 11.5, fontWeight: 700, color: '#706680', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="activity" size={13} /> Attendance refreshes each morning after first serving.
          </p>
        </div>
      </section>

      {/* ── Action band: urgent alerts (wide) + low stock (narrow) ── */}
      <div className="band">
        <section className="card">
          <div className="card-head">
            <span className="hd">
              <span className="hd-chip tone-red"><Icon name="alert" size={17} /></span>
              <div>
                <h3>Needs attention</h3>
                <p>Things that need a decision today</p>
              </div>
            </span>
            <span className="badge danger">4 open</span>
          </div>
          <ul className="alerts-stack" style={{ padding: '14px 22px 20px' }}>
            <li style={{ animationDelay: '0ms' }}>
              <div className="alert alert-urgent">
                <span className="alert-ico tone-red"><Icon name="alert" size={16} /></span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p><strong>Dal stock</strong> running extremely low — 8 kg left.<time>Order today</time></p>
                </div>
                <button className="btn btn-sm" onClick={() => onNavigate('inventory')}>Restock</button>
              </div>
            </li>
            <li style={{ animationDelay: '100ms' }}>
              <div className="alert">
                <span className="alert-ico tone-violet"><Icon name="rupee" size={16} /></span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p><strong>23 students</strong> haven't paid this month's fees yet.<time>Due 5 Aug</time></p>
                </div>
                <button className="btn btn-sm" onClick={() => onNavigate('fees')}>Remind</button>
              </div>
            </li>
            <li style={{ animationDelay: '200ms' }}>
              <div className="alert">
                <span className="alert-ico tone-blue"><Icon name="userX" size={16} /></span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p><strong>2 staff</strong> on approved leave — Sunita &amp; Mohan.<time>Shift plan</time></p>
                </div>
                <button className="btn btn-sm" onClick={() => onNavigate('workers')}>View</button>
              </div>
            </li>
            <li style={{ animationDelay: '300ms' }}>
              <div className="alert">
                <span className="alert-ico tone-amber"><Icon name="star" size={16} /></span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p><strong>14 new reviews</strong> since yesterday — rating up to 4.2.<time>Check feedback</time></p>
                </div>
                <button className="btn btn-sm" onClick={() => onNavigate('reviews')}>Read</button>
              </div>
            </li>
          </ul>
        </section>

        <section className="card">
          <div className="card-head">
            <span className="hd">
              <span className="hd-chip tone-amber"><Icon name="package" size={17} /></span>
              <div>
                <h3>Low stock</h3>
                <p>Restock these before the next meal</p>
              </div>
            </span>
            <button className="link-btn" onClick={() => onNavigate('inventory')}>All stock <Icon name="arrowRight" size={13} /></button>
          </div>
          <ul className="compact-list">
            {LOW_STOCK.map((s) => (
              <li className="compact-row" key={s.name}>
                <span className="ava plain" style={{ width: 34, height: 34, fontSize: 15 }}>
                  <Icon name={s.icon} size={15} />
                </span>
                <span className="who">
                  <b>{s.name}</b>
                  <small>{s.unit}</small>
                </span>
                <span className="stock-bar"><i style={{ width: `${s.pct}%`, background: s.pct < 20 ? 'var(--danger)' : 'var(--warn)' }} /></span>
                <b className="price" style={{ color: s.pct < 20 ? 'var(--danger)' : 'var(--warn)' }}>{s.qty}</b>
              </li>
            ))}
          </ul>
          <div className="card-foot">
            <span className="att-pill" style={{ borderColor: 'transparent', background: 'transparent', padding: 0 }}>
              <Icon name="truck" size={14} /> Next delivery tomorrow 8:00 am
            </span>
          </div>
        </section>
      </div>

      {/* ── Money & feedback band: fees (narrow) + reviews (wide) ── */}
      <div className="band flip">
        <section className="card">
          <div className="card-head">
            <span className="hd">
              <span className="hd-chip tone-red"><Icon name="rupee" size={17} /></span>
              <div>
                <h3>Pending fees</h3>
                <p>Largest dues this month · 23 students</p>
              </div>
            </span>
            <button className="link-btn" onClick={() => onNavigate('fees')}>All fees <Icon name="arrowRight" size={13} /></button>
          </div>
          <ul className="compact-list">
            {DUE_STUDENTS.map((s) => (
              <li className="compact-row" key={s.id}>
                <Avatar name={s.name} size={34} plain />
                <span className="who">
                  <b>{s.name}</b>
                  <small>{s.id} · {s.due}</small>
                </span>
                <b className="price">{s.amount}</b>
                <button className="icon-btn" style={{ width: 32, height: 32 }} title="Send reminder" onClick={() => onNavigate('fees')}>
                  <Icon name="send" size={14} />
                </button>
              </li>
            ))}
          </ul>
          <div className="card-foot">
            <span className="att-pill" style={{ borderColor: 'transparent', background: 'transparent', padding: 0 }}>
              <Icon name="trendUp" size={14} style={{ color: 'var(--success)' }} /> 85% collected so far
            </span>
          </div>
        </section>

        <section className="card">
          <div className="card-head">
            <span className="hd">
              <span className="hd-chip tone-amber"><Icon name="star" size={17} /></span>
              <div>
                <h3>Recent reviews</h3>
                <p>Latest student ratings · 4.2 average</p>
              </div>
            </span>
            <button className="link-btn" onClick={() => onNavigate('reviews')}>View all <Icon name="arrowRight" size={13} /></button>
          </div>
          <div className="card-body">
            {REVIEWS.map((r) => (
              <div className="review-item" style={{ gap: 14 }} key={r.name}>
                <span className="review-quote">“</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <header>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <b style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink)' }}>{r.name}</b>
                      <Stars value={r.stars} size={12} />
                    </div>
                    <span className="review-time">{r.time}</span>
                  </header>
                  <p className="review-txt">{r.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}