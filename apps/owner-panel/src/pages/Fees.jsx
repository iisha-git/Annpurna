import React, { useState } from 'react';

export default function Fees() {
  const [view, setView] = useState('monthly'); // monthly or annual

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', background: 'var(--surface)', borderRadius: '8px', padding: '4px', border: '1px solid var(--border)' }}>
          <button 
            style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: view === 'monthly' ? 'var(--amber-soft)' : 'transparent', color: view === 'monthly' ? 'var(--amber-pressed)' : 'var(--muted)', fontWeight: view === 'monthly' ? '700' : '500' }}
            onClick={() => setView('monthly')}>
            Monthly Overview
          </button>
          <button 
            style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: view === 'annual' ? 'var(--amber-soft)' : 'transparent', color: view === 'annual' ? 'var(--amber-pressed)' : 'var(--muted)', fontWeight: view === 'annual' ? '700' : '500' }}
            onClick={() => setView('annual')}>
            Annual Overview
          </button>
        </div>
        
        {view === 'monthly' ? (
          <select style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)' }}>
            <option>August 2026</option>
            <option>July 2026</option>
            <option>June 2026</option>
          </select>
        ) : (
          <select style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)' }}>
            <option>2026-2027</option>
            <option>2025-2026</option>
          </select>
        )}
      </div>

      {/* Stats Cards */}
      <div className="summary-cards" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="summary-card">
          <div className="summary-label">Expected {view === 'monthly' ? 'This Month' : 'This Year'}</div>
          <div className="summary-value">
            {view === 'monthly' ? '₹14,58,000' : '₹1,74,96,000'}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '8px' }}>
            Based on {view === 'monthly' ? '₹3,000' : '₹36,000'} fee × 486 students
          </div>
        </div>
        
        <div className="summary-card" style={{ background: '#e6f4ea', borderColor: '#cce5d3' }}>
          <div className="summary-label" style={{ color: 'var(--success)' }}>Total Collected</div>
          <div className="summary-value" style={{ color: 'var(--success)' }}>
            {view === 'monthly' ? '₹12,45,000' : '₹84,50,000'}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--success)', marginTop: '8px', opacity: 0.8 }}>
            {view === 'monthly' ? '85% collected' : '48% collected'}
          </div>
        </div>
        
        <div className="summary-card" style={{ background: '#fce8e6', borderColor: '#f5c6cb' }}>
          <div className="summary-label" style={{ color: 'var(--danger)' }}>Total Pending</div>
          <div className="summary-value" style={{ color: 'var(--danger)' }}>
            {view === 'monthly' ? '₹2,13,000' : '₹90,46,000'}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--danger)', marginTop: '8px', opacity: 0.8 }}>
            From 71 students
          </div>
        </div>
      </div>

      {/* Pending List Preview */}
      <div className="ui-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2>Students with Pending Fees</h2>
          <button className="ghost" style={{ padding: '8px 16px', fontSize: '13px', color: 'var(--amber)' }}>Send Reminders to All</button>
        </div>
        
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>ID</th>
              <th>Pending Amount</th>
              <th>Due Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ fontWeight: '600' }}>Kabir Singh</td>
              <td className="muted">24ME091</td>
              <td style={{ color: 'var(--danger)', fontWeight: '700' }}>₹3,000</td>
              <td>05 Aug 2026</td>
              <td><button className="ghost" style={{ fontSize: '12px', border: '1px solid var(--border)', padding: '4px 10px' }}>Remind</button></td>
            </tr>
            <tr>
              <td style={{ fontWeight: '600' }}>Karan Malhotra</td>
              <td className="muted">24IT076</td>
              <td style={{ color: 'var(--danger)', fontWeight: '700' }}>₹6,000</td>
              <td>05 Jul 2026</td>
              <td><button className="ghost" style={{ fontSize: '12px', border: '1px solid var(--border)', padding: '4px 10px' }}>Remind</button></td>
            </tr>
            <tr>
              <td style={{ fontWeight: '600' }}>Neha Gupta</td>
              <td className="muted">24CS188</td>
              <td style={{ color: 'var(--danger)', fontWeight: '700' }}>₹3,000</td>
              <td>05 Aug 2026</td>
              <td><button className="ghost" style={{ fontSize: '12px', border: '1px solid var(--border)', padding: '4px 10px' }}>Remind</button></td>
            </tr>
          </tbody>
        </table>
      </div>

    </div>
  );
}
