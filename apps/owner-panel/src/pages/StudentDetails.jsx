import React, { useMemo, useState } from 'react';

import { Avatar, Icon } from '../ui';

const mockStudents = [
  { id: '24CS102', name: 'Aarav Sharma', room: 'A-204', status: 'Present', fee: 'Paid', branch: 'CS' },
  { id: '24EC118', name: 'Riya Patel', room: 'B-312', status: 'Absent', fee: 'Paid', branch: 'EC' },
  { id: '24ME091', name: 'Kabir Singh', room: 'A-108', status: 'Present', fee: 'Pending', branch: 'ME' },
  { id: '24EE045', name: 'Ananya Desai', room: 'C-205', status: 'Present', fee: 'Paid', branch: 'EE' },
  { id: '24IT076', name: 'Karan Malhotra', room: 'B-114', status: 'Absent', fee: 'Pending', branch: 'IT' },
  { id: '24CS032', name: 'Sneha Reddy', room: 'A-301', status: 'Present', fee: 'Paid', branch: 'CS' },
];

const FILTERS = [
  ['all', 'All Students'],
  ['present', 'Present'],
  ['absent', 'Absent'],
  ['pending', 'Fees Pending'],
];

export default function StudentDetails() {
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('all');

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return mockStudents.filter((s) => {
      if (term && !`${s.name} ${s.id} ${s.room}`.toLowerCase().includes(term)) return false;
      if (filter === 'present' && s.status !== 'Present') return false;
      if (filter === 'absent' && s.status !== 'Absent') return false;
      if (filter === 'pending' && s.fee !== 'Pending') return false;
      return true;
    });
  }, [q, filter]);

  return (
    <section className="card">
      <div className="toolbar" style={{ padding: '20px 22px 0', marginBottom: 14 }}>
        <div className="toolbar-l">
          <span className="search-wrap">
            <Icon name="search" size={15} />
            <input
              className="field"
              placeholder="Search name, ID or room…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </span>
        </div>
        <div className="toolbar-r">
          <select className="field" style={{ width: 170 }} value={filter} onChange={(e) => setFilter(e.target.value)}>
            {FILTERS.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
          </select>
          <button className="btn btn-ghost">
            <Icon name="plus" size={15} /> Add student
          </button>
        </div>
      </div>

      <div className="table-wrap" style={{ padding: '0 22px 22px' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>ID</th>
              <th>Room</th>
              <th>Attendance</th>
              <th>Fee Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.id}>
                <td>
                  <span className="cell-main">
                    <Avatar name={s.name} size={32} plain />
                    <span>
                      <b>{s.name}</b>
                      <div className="cell-sub">{s.branch} Engineering</div>
                    </span>
                  </span>
                </td>
                <td className="cell-sub">{s.id}</td>
                <td>{s.room}</td>
                <td><span className={`badge ${s.status === 'Present' ? 'present' : 'absent'}`}>{s.status}</span></td>
                <td><span className={`badge ${s.fee === 'Paid' ? 'good' : 'pending'}`}>{s.fee}</span></td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5}>
                  <div className="empty-state">
                    <span className="empty-ico"><Icon name="search" size={20} /></span>
                    <b>No students match</b>
                    <p>Try a different search term or filter.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}