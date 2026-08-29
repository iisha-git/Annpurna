import React from 'react';

const mockStudents = [
  { id: '24CS102', name: 'Aarav Sharma', room: 'A-204', status: 'Present', fee: 'Paid' },
  { id: '24EC118', name: 'Riya Patel', room: 'B-312', status: 'Absent', fee: 'Paid' },
  { id: '24ME091', name: 'Kabir Singh', room: 'A-108', status: 'Present', fee: 'Pending' },
  { id: '24EE045', name: 'Ananya Desai', room: 'C-205', status: 'Present', fee: 'Paid' },
  { id: '24IT076', name: 'Karan Malhotra', room: 'B-114', status: 'Absent', fee: 'Pending' },
  { id: '24CS032', name: 'Sneha Reddy', room: 'A-301', status: 'Present', fee: 'Paid' },
];

export default function StudentDetails() {
  return (
    <div className="ui-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2>Student Details</h2>
        <div style={{ display: 'flex', gap: '12px' }}>
          <input 
            type="text" 
            placeholder="Search students..." 
            style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--paper)', outline: 'none' }}
          />
          <select style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--paper)' }}>
            <option>All Students</option>
            <option>Present</option>
            <option>Absent</option>
            <option>Fees Pending</option>
          </select>
        </div>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>ID</th>
            <th>Room</th>
            <th>Attendance</th>
            <th>Fee Status</th>
          </tr>
        </thead>
        <tbody>
          {mockStudents.map((s, i) => (
            <tr key={i}>
              <td style={{ fontWeight: '600' }}>{s.name}</td>
              <td className="muted">{s.id}</td>
              <td>{s.room}</td>
              <td>
                <span className={`status-badge ${s.status.toLowerCase()}`}>{s.status}</span>
              </td>
              <td>
                <span className={`status-badge ${s.fee === 'Paid' ? 'good' : 'pending'}`}>{s.fee}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
