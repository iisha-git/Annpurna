import React, { useState } from 'react';

import { Avatar, Icon } from '../ui';

const PENDING = [
  { name: 'Kabir Singh', id: '24ME091', amount: '₹3,000', due: '05 Aug 2026' },
  { name: 'Karan Malhotra', id: '24IT076', amount: '₹6,000', due: '05 Jul 2026' },
  { name: 'Neha Gupta', id: '24CS188', amount: '₹3,000', due: '05 Aug 2026' },
];

export default function Fees() {
  const [view, setView] = useState('monthly');
  const monthly = view === 'monthly';

  const expected = monthly ? '₹14,58,000' : '₹1,74,96,000';
  const collected = monthly ? '₹12,45,000' : '₹84,50,000';
  const pending = monthly ? '₹2,13,000' : '₹90,46,000';
  const rate = monthly ? '85%' : '48%';

  return (
    <div className="stack">
      <div className="toolbar" style={{ marginBottom: 0 }}>
        <div className="toolbar-l">
          <div className="seg">
            <button className={monthly ? 'active' : ''} onClick={() => setView('monthly')}>
              Monthly overview
            </button>
            <button className={!monthly ? 'active' : ''} onClick={() => setView('annual')}>
              Annual overview
            </button>
          </div>
        </div>
        <div className="toolbar-r">
          <select className="field" style={{ width: 180 }} defaultValue={monthly ? 'Aug 2026' : '2026–27'}>
            {monthly
              ? <><option>Aug 2026</option><option>Jul 2026</option><option>Jun 2026</option></>
              : <><option>2026–27</option><option>2025–26</option></>}
          </select>
        </div>
      </div>

      <div className="stats cols-3">
        <div className="card card-pad">
          <div className="stat-label">{monthly ? 'Expected this month' : 'Expected this year'}</div>
          <div className="stat-value" style={{ marginTop: 6 }}>{expected}</div>
          <div className="stat-delta flat">₹3,000 × 486 students</div>
        </div>
        <div className="card card-pad" style={{ borderColor: '#cde5d3' }}>
          <div className="stat-label" style={{ color: 'var(--success)' }}>Total collected</div>
          <div className="stat-value" style={{ marginTop: 6, color: 'var(--success)' }}>{collected}</div>
          <span className="stat-delta up">{monthly ? '+ ₹3.2L vs last month' : 'Half-year run rate'}</span>
        </div>
        <div className="card card-pad" style={{ borderColor: '#f3cdc8' }}>
          <div className="stat-label" style={{ color: 'var(--danger)' }}>Total pending</div>
          <div className="stat-value" style={{ marginTop: 6, color: 'var(--danger)' }}>{pending}</div>
          <span className="stat-delta down">{monthly ? '71 students' : rate + ' collected'}</span>
        </div>
      </div>

      <section className="card">
        <div className="card-head">
          <div>
            <h3>Students with pending fees</h3>
            <p className="sub">{monthly ? 'Dues for August 2026' : 'Dues for the academic year'}</p>
          </div>
          <button className="btn btn-ghost btn-sm"><Icon name="send" size={13} /> Send reminders to all</button>
        </div>
        <div className="table-wrap" style={{ padding: '4px 22px 22px' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>ID</th>
                <th>Pending Amount</th>
                <th>Due Date</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {PENDING.map((p) => (
                <tr key={p.id}>
                  <td>
                    <span className="cell-main">
                      <Avatar name={p.name} size={32} plain />
                      <b>{p.name}</b>
                    </span>
                  </td>
                  <td className="cell-sub">{p.id}</td>
                  <td className="cell-amt" style={{ color: 'var(--danger)' }}>{p.amount}</td>
                  <td className="cell-sub">{p.due}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn btn-sm"><Icon name="send" size={13} /> Remind</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}