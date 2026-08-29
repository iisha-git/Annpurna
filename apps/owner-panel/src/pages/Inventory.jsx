import React from 'react';

const mockInventory = [
  { item: 'Basmati Rice', qty: '82', unit: 'kg', status: 'Good', lastUpdate: 'Today, 8:00 AM' },
  { item: 'Toor Dal', qty: '8', unit: 'kg', status: 'Low', lastUpdate: 'Yesterday' },
  { item: 'Refined Oil', qty: '12', unit: 'L', status: 'Good', lastUpdate: 'Today, 8:00 AM' },
  { item: 'Onions', qty: '18', unit: 'kg', status: 'Low', lastUpdate: '2 Days Ago' },
  { item: 'Potatoes', qty: '45', unit: 'kg', status: 'Good', lastUpdate: 'Yesterday' },
  { item: 'Wheat Flour (Atta)', qty: '120', unit: 'kg', status: 'Good', lastUpdate: '1 Week Ago' },
  { item: 'Milk', qty: '20', unit: 'L', status: 'Low', lastUpdate: 'Today, 6:00 AM' },
];

export default function Inventory() {
  return (
    <div className="ui-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2>Inventory Management</h2>
        <div style={{ display: 'flex', gap: '12px' }}>
          <input 
            type="text" 
            placeholder="Search items..." 
            style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--paper)', outline: 'none' }}
          />
          <button className="primaryBtn" style={{ padding: '8px 16px', borderRadius: '8px' }}>+ Add Item</button>
        </div>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Quantity</th>
            <th>Unit</th>
            <th>Status</th>
            <th>Last Updated</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {mockInventory.map((item, i) => (
            <tr key={i}>
              <td style={{ fontWeight: '600' }}>{item.item}</td>
              <td style={{ fontWeight: '700' }}>{item.qty}</td>
              <td className="muted">{item.unit}</td>
              <td>
                <span className={`status-badge ${item.status === 'Good' ? 'good' : 'low'}`}>{item.status}</span>
              </td>
              <td className="muted">{item.lastUpdate}</td>
              <td>
                <button className="ghost" style={{ padding: '4px 12px', fontSize: '12px', color: 'var(--amber)', border: '1px solid var(--amber)' }}>Update Stock</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
