import React from 'react';

const mockWorkers = [
  { name: 'Ramesh Kumar', role: 'Head Cook', salary: '₹18,000/month', status: 'Working' },
  { name: 'Sunita Devi', role: 'Kitchen Helper', salary: '₹13,500/month', status: 'On Leave' },
  { name: 'Mohan Lal', role: 'Cleaner', salary: '₹12,000/month', status: 'Working' },
  { name: 'Anita Kumari', role: 'Kitchen Helper', salary: '₹13,500/month', status: 'Working' },
  { name: 'Suresh Babu', role: 'Assistant Cook', salary: '₹16,000/month', status: 'Working' },
];

export default function WorkerDetails() {
  return (
    <div className="ui-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2>Worker Details</h2>
        <button className="primaryBtn" style={{ padding: '8px 16px', borderRadius: '8px' }}>+ Add Worker</button>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Role</th>
            <th>Salary</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {mockWorkers.map((w, i) => (
            <tr key={i}>
              <td style={{ fontWeight: '600' }}>{w.name}</td>
              <td className="muted">{w.role}</td>
              <td>{w.salary}</td>
              <td>
                <span className={`status-badge ${w.status === 'Working' ? 'good' : 'pending'}`}>{w.status}</span>
              </td>
              <td>
                <button className="ghost" style={{ padding: '4px 8px', fontSize: '12px', color: 'var(--amber)' }}>Edit</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
