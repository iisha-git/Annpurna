import React, { useMemo, useState } from 'react';

import { Avatar, Icon } from '../ui';

const mockInventory = [
  { item: 'Basmati Rice', qty: '82', unit: 'kg', status: 'Good', lastUpdate: 'Today, 8:00 AM', shade: 'wheat' },
  { item: 'Toor Dal', qty: '8', unit: 'kg', status: 'Low', lastUpdate: 'Yesterday', shade: 'wheat' },
  { item: 'Refined Oil', qty: '12', unit: 'L', status: 'Good', lastUpdate: 'Today, 8:00 AM', shade: 'package' },
  { item: 'Onions', qty: '18', unit: 'kg', status: 'Low', lastUpdate: '2 days ago', shade: 'package' },
  { item: 'Potatoes', qty: '45', unit: 'kg', status: 'Good', lastUpdate: 'Yesterday', shade: 'package' },
  { item: 'Wheat Flour (Atta)', qty: '120', unit: 'kg', status: 'Good', lastUpdate: '1 week ago', shade: 'wheat' },
  { item: 'Milk', qty: '20', unit: 'L', status: 'Low', lastUpdate: 'Today, 6:00 AM', shade: 'package' },
];

export default function Inventory() {
  const [q, setQ] = useState('');
  const low = mockInventory.filter((i) => i.status === 'Low').length;

  const rows = useMemo(
    () => mockInventory.filter((i) => i.item.toLowerCase().includes(q.trim().toLowerCase())),
    [q],
  );

  return (
    <div className="stack">
      <div className="stats cols-3">
        <div className="card card-pad stat">
          <span className="stat-ico tone-amber sm"><Icon name="package" size={17} /></span>
          <div>
            <div className="stat-label">Items Tracked</div>
            <div className="stat-value">{mockInventory.length}</div>
            <span className="stat-delta flat">Dry goods + fresh</span>
          </div>
        </div>
        <div className="card card-pad stat">
          <span className="stat-ico tone-red sm"><Icon name="alert" size={17} /></span>
          <div>
            <div className="stat-label">Low Stock</div>
            <div className="stat-value">{low}</div>
            <span className="stat-delta down">Restock needed</span>
          </div>
        </div>
        <div className="card card-pad stat">
          <span className="stat-ico tone-green sm"><Icon name="clock" size={17} /></span>
          <div>
            <div className="stat-label">Last Restock</div>
            <div className="stat-value" style={{ fontSize: 18 }}>Today</div>
            <span className="stat-delta flat">8:00 am delivery</span>
          </div>
        </div>
      </div>

      <section className="card">
        <div className="toolbar" style={{ padding: '14px 22px 0', marginBottom: 6 }}>
          <div className="toolbar-l">
            <span className="search-wrap">
              <Icon name="search" size={15} />
              <input className="field" placeholder="Search items…" value={q} onChange={(e) => setQ(e.target.value)} />
            </span>
          </div>
          <div className="toolbar-r">
            <button className="btn btn-primary"><Icon name="plus" size={15} /> Add item</button>
          </div>
        </div>

        <div className="table-wrap" style={{ padding: '6px 22px 22px' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Quantity</th>
                <th>Status</th>
                <th>Last Updated</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => (
                <tr key={item.item}>
                  <td>
                    <span className="cell-main">
                      <Icon name={item.shade} size={16} style={{ color: item.status === 'Low' ? 'var(--danger)' : 'var(--warn)' }} />
                      <b>{item.item}</b>
                    </span>
                  </td>
                  <td className="cell-amt">{item.qty} <span className="cell-sub">{item.unit}</span></td>
                  <td><span className={`badge ${item.status === 'Good' ? 'good' : 'low'}`}>{item.status}</span></td>
                  <td className="cell-sub">{item.lastUpdate}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn btn-sm btn-success"><Icon name="refresh" size={13} /> Update stock</button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5}>
                    <div className="empty-state">
                      <span className="empty-ico"><Icon name="search" size={20} /></span>
                      <b>No items match</b>
                      <p>Try searching for something else.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}