import React, { useMemo, useState } from 'react';

import { Avatar, Icon } from '../ui';

const mockWorkers = [
  { name: 'Ramesh Kumar', role: 'Head Cook', salary: '₹18,000', status: 'Working' },
  { name: 'Sunita Devi', role: 'Kitchen Helper', salary: '₹13,500', status: 'On Leave' },
  { name: 'Mohan Lal', role: 'Cleaner', salary: '₹12,000', status: 'Working' },
  { name: 'Anita Kumari', role: 'Kitchen Helper', salary: '₹13,500', status: 'Working' },
  { name: 'Suresh Babu', role: 'Assistant Cook', salary: '₹16,000', status: 'Working' },
];

const FILTERS = [
  ['all', 'All staff'],
  ['working', 'Working today'],
  ['leave', 'On leave'],
];

export default function WorkerDetails() {
  const [filter, setFilter] = useState('all');
  const onDuty = mockWorkers.filter((w) => w.status === 'Working').length;
  const totalSalary = mockWorkers.reduce((s, w) => s + Number(w.salary.replace(/₹|,/g, '')), 0);

  const rows = useMemo(
    () => mockWorkers.filter((w) => {
      if (filter === 'working' && w.status !== 'Working') return false;
      if (filter === 'leave' && w.status !== 'On Leave') return false;
      return true;
    }),
    [filter],
  );

  return (
    <div className="stack">
      <div className="stats cols-3">
        <div className="card card-pad stat">
          <span className="stat-ico tone-violet sm"><Icon name="chef" size={17} /></span>
          <div>
            <div className="stat-label">Total Staff</div>
            <div className="stat-value">{mockWorkers.length}</div>
            <span className="stat-delta flat">4 roles</span>
          </div>
        </div>
        <div className="card card-pad stat">
          <span className="stat-ico tone-green sm"><Icon name="checkCircle" size={17} /></span>
          <div>
            <div className="stat-label">On Duty Today</div>
            <div className="stat-value">{onDuty} <small>of {mockWorkers.length}</small></div>
            <span className="stat-delta up">Kitchen ready</span>
          </div>
        </div>
        <div className="card card-pad stat">
          <span className="stat-ico tone-amber sm"><Icon name="rupee" size={17} /></span>
          <div>
            <div className="stat-label">Monthly Payroll</div>
            <div className="stat-value">₹{totalSalary.toLocaleString('en-IN')}</div>
            <span className="stat-delta flat">Due 1st of month</span>
          </div>
        </div>
      </div>

      <section className="card">
        <div className="toolbar" style={{ padding: '14px 22px 0', marginBottom: 6 }}>
          <div className="toolbar-l">
            <h3 style={{ fontSize: 15.5, fontWeight: 800 }}>Kitchen &amp; cleaning staff</h3>
          </div>
          <div className="toolbar-r">
            <select className="field" style={{ width: 160 }} value={filter} onChange={(e) => setFilter(e.target.value)}>
              {FILTERS.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
            </select>
            <button className="btn btn-primary">
              <Icon name="userPlus" size={15} /> Add staff
            </button>
          </div>
        </div>

        <div className="table-wrap" style={{ padding: '6px 22px 22px' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Salary</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((w) => (
                <tr key={w.name}>
                  <td>
                    <span className="cell-main">
                      <Avatar name={w.name} size={32} plain />
                      <b>{w.name}</b>
                    </span>
                  </td>
                  <td className="cell-sub">{w.role}</td>
                  <td className="cell-amt">{w.salary}<span className="cell-sub"> /mo</span></td>
                  <td>
                    <span className={`badge ${w.status === 'Working' ? 'working' : 'on-leave'}`}>{w.status}</span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn btn-ghost btn-sm"><Icon name="pencil" size={13} /> Edit</button>
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