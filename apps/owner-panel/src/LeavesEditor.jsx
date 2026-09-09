import React, { useState, useEffect, useMemo } from 'react';
import { api } from './api';
import { DAYS } from './menuData';

function isoDate(dt) {
  const d = new Date(dt);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatDateDisplay(isoStr) {
  const [y, m, d] = isoStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
}

function getWeekDays(referenceDate = new Date()) {
  const ref = new Date(referenceDate);
  const dayIndex = ref.getDay(); // 0 is Sunday
  const mondayDiff = dayIndex === 0 ? -6 : 1 - dayIndex;
  const monday = new Date(ref);
  monday.setDate(ref.getDate() + mondayDiff);

  return DAYS.map((dayName, i) => {
    const dt = new Date(monday);
    dt.setDate(monday.getDate() + i);
    const iso = isoDate(dt);
    return {
      day: dayName,
      label: dt.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' }),
      iso,
      isToday: iso === isoDate(new Date()),
    };
  });
}

export default function LeavesEditor() {
  const todayIso = useMemo(() => isoDate(new Date()), []);
  const tomorrowIso = useMemo(() => {
    const tm = new Date();
    tm.setDate(tm.getDate() + 1);
    return isoDate(tm);
  }, []);

  const [selectedDate, setSelectedDate] = useState(todayIso);
  const [activeTab, setActiveTab] = useState('onLeave'); // 'onLeave' | 'all'
  const [searchQuery, setSearchQuery] = useState('');
  const [students, setStudents] = useState([]);
  const [leavesSet, setLeavesSet] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState({ text: '', type: '' });

  // Modals
  const [weekModalStudent, setWeekModalStudent] = useState(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({ messNumber: '', date: todayIso });

  // Fetch students & leaves
  const loadData = async () => {
    try {
      const [studRes, leaveRes] = await Promise.all([
        api.get('/students'),
        api.get('/leaves')
      ]);

      const activeList = (studRes.students || [])
        .filter((s) => s.active !== false && s.name)
        .sort((a, b) => Number(a.messNumber) - Number(b.messNumber));

      setStudents(activeList);

      const lSet = new Set((leaveRes.leaves || []).map((l) => `${l.messNumber}_${l.date}`));
      setLeavesSet(lSet);
    } catch (err) {
      setFeedback({ text: `Failed to load: ${err.message}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  // Show temporary feedback toast
  const showToast = (text, type = 'success') => {
    setFeedback({ text, type });
    setTimeout(() => setFeedback({ text: '', type: '' }), 3500);
  };

  // Toggle single day leave
  const handleToggleLeave = async (messNumber, date) => {
    const key = `${messNumber}_${date}`;
    const willBeOn = !leavesSet.has(key);

    // Optimistic update
    setLeavesSet((prev) => {
      const next = new Set(prev);
      if (willBeOn) next.add(key);
      else next.delete(key);
      return next;
    });

    try {
      await api.put('/leaves/toggle', { messNumber, date });
      showToast(willBeOn ? `Student #${messNumber} marked on leave for ${date}` : `Leave cancelled for #${messNumber}`);
    } catch (err) {
      // Revert
      setLeavesSet((prev) => {
        const next = new Set(prev);
        if (willBeOn) next.delete(key);
        else next.add(key);
        return next;
      });
      showToast(`Error: ${err.message}`, 'error');
    }
  };

  // Handle manual add leave modal
  const handleAddLeaveSubmit = async (e) => {
    e.preventDefault();
    if (!addForm.messNumber) {
      showToast('Please select or enter a student mess number.', 'error');
      return;
    }
    const key = `${addForm.messNumber}_${addForm.date}`;
    if (leavesSet.has(key)) {
      showToast(`Student #${addForm.messNumber} is already on leave for ${addForm.date}.`, 'error');
      return;
    }

    try {
      await api.put('/leaves/toggle', { messNumber: addForm.messNumber, date: addForm.date });
      setLeavesSet((prev) => new Set(prev).add(key));
      showToast(`Leave approved for #${addForm.messNumber} on ${addForm.date}`);
      setAddModalOpen(false);
      setAddForm({ messNumber: '', date: selectedDate });
    } catch (err) {
      showToast(`Failed: ${err.message}`, 'error');
    }
  };

  // Calculations for selectedDate
  const studentsOnLeaveToday = useMemo(() => {
    return students.filter((s) => leavesSet.has(`${s.messNumber}_${selectedDate}`));
  }, [students, leavesSet, selectedDate]);

  const totalActive = students.length || 418;
  const leaveCount = studentsOnLeaveToday.length;
  const presentCount = Math.max(0, totalActive - leaveCount);

  // Filter all students list
  const filteredStudents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        String(s.messNumber).includes(q) ||
        (s.room && s.room.toLowerCase().includes(q))
    );
  }, [students, searchQuery]);

  const weekDays = useMemo(() => getWeekDays(selectedDate), [selectedDate]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Toast notification */}
      {feedback.text && (
        <div
          style={{
            position: 'fixed',
            top: '24px',
            right: '32px',
            zIndex: 9999,
            padding: '12px 20px',
            borderRadius: '10px',
            background: feedback.type === 'error' ? 'var(--danger)' : 'var(--dark)',
            color: 'white',
            fontWeight: '600',
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            fontSize: '14px',
            transition: 'all 0.3s ease',
          }}>
          {feedback.text}
        </div>
      )}

      {/* Header & Date Controller */}
      <div className="ui-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: 'var(--ink)' }}>
              Approved Leaves
            </h1>
            <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: '14px' }}>
              Check daily leaves at a glance and track meal preparation counts.
            </p>
          </div>
          
          <button 
            className="primaryBtn" 
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px' }}
            onClick={() => {
              setAddForm({ messNumber: '', date: selectedDate });
              setAddModalOpen(true);
            }}>
            <span>+</span> Mark Student on Leave
          </button>
        </div>

        {/* Date Selector & KPI Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
          {/* Quick Date Picker */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontWeight: '600', fontSize: '14px', color: 'var(--ink)' }}>Date:</span>
            <button
              onClick={() => setSelectedDate(todayIso)}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: selectedDate === todayIso ? 'var(--dark)' : 'var(--paper)',
                color: selectedDate === todayIso ? 'white' : 'var(--ink)',
                fontWeight: selectedDate === todayIso ? '700' : '500',
                fontSize: '13px'
              }}>
              Today
            </button>
            <button
              onClick={() => setSelectedDate(tomorrowIso)}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: selectedDate === tomorrowIso ? 'var(--dark)' : 'var(--paper)',
                color: selectedDate === tomorrowIso ? 'white' : 'var(--ink)',
                fontWeight: selectedDate === tomorrowIso ? '700' : '500',
                fontSize: '13px'
              }}>
              Tomorrow
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
              style={{
                padding: '6px 10px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: 'var(--paper)',
                fontSize: '13px',
                fontWeight: '600'
              }}
            />
            <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--amber-pressed)', marginLeft: '4px' }}>
              {formatDateDisplay(selectedDate)}
            </span>
          </div>

          {/* Quick Stats Pills */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ background: '#fff0d6', border: '1px solid #ffd8a8', padding: '6px 14px', borderRadius: '8px', fontSize: '13px' }}>
              <span style={{ color: 'var(--muted)', marginRight: '6px' }}>On Leave:</span>
              <strong style={{ color: 'var(--amber-pressed)', fontSize: '15px' }}>{leaveCount}</strong>
            </div>
            <div style={{ background: '#ebfbee', border: '1px solid #b2f2bb', padding: '6px 14px', borderRadius: '8px', fontSize: '13px' }}>
              <span style={{ color: 'var(--muted)', marginRight: '6px' }}>Expected Present:</span>
              <strong style={{ color: 'var(--success)', fontSize: '15px' }}>{presentCount}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid var(--border)', paddingBottom: '2px' }}>
        <button
          onClick={() => setActiveTab('onLeave')}
          style={{
            padding: '10px 18px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'onLeave' ? '3px solid var(--amber-pressed)' : '3px solid transparent',
            color: activeTab === 'onLeave' ? 'var(--ink)' : 'var(--muted)',
            fontWeight: activeTab === 'onLeave' ? '700' : '500',
            fontSize: '15px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
          <span>🌴 Students On Leave</span>
          <span style={{ background: activeTab === 'onLeave' ? 'var(--amber)' : 'rgba(0,0,0,0.06)', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: '700' }}>
            {leaveCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('all')}
          style={{
            padding: '10px 18px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'all' ? '3px solid var(--amber-pressed)' : '3px solid transparent',
            color: activeTab === 'all' ? 'var(--ink)' : 'var(--muted)',
            fontWeight: activeTab === 'all' ? '700' : '500',
            fontSize: '15px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
          <span>👥 All Students Roster</span>
          <span style={{ background: 'rgba(0,0,0,0.06)', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' }}>
            {totalActive}
          </span>
        </button>
      </div>

      {/* TAB 1: ON LEAVE ON SELECTED DATE */}
      {activeTab === 'onLeave' && (
        <div className="ui-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ margin: 0, fontSize: '17px' }}>
              Students on leave on {formatDateDisplay(selectedDate)}
            </h2>
            <span style={{ fontSize: '13px', color: 'var(--muted)' }}>
              {leaveCount} student{leaveCount === 1 ? '' : 's'} total
            </span>
          </div>

          {loading ? (
            <p style={{ textAlign: 'center', padding: '30px', color: 'var(--muted)' }}>Loading leave records…</p>
          ) : studentsOnLeaveToday.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 24px', background: 'var(--paper)', borderRadius: '14px' }}>
              <div style={{ fontSize: '40px', marginBottom: '10px' }}>🍲</div>
              <h3 style={{ margin: '0 0 6px', color: 'var(--ink)' }}>No students on leave on this date</h3>
              <p style={{ margin: 0, color: 'var(--muted)', fontSize: '14px', maxWidth: '420px', marginLeft: 'auto', marginRight: 'auto' }}>
                Full attendance expected! All {totalActive} students are accounted for meals on {formatDateDisplay(selectedDate)}.
              </p>
              <button
                className="primaryBtn"
                style={{ marginTop: '16px', padding: '8px 16px', fontSize: '13px' }}
                onClick={() => setAddModalOpen(true)}>
                + Mark a student on leave
              </button>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '80px' }}>Mess #</th>
                  <th>Student Name</th>
                  <th>Room</th>
                  <th>Branch / Year</th>
                  <th>Mobile</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {studentsOnLeaveToday.map((student) => (
                  <tr key={student.messNumber}>
                    <td style={{ fontWeight: '700', color: 'var(--amber-pressed)' }}>
                      #{student.messNumber}
                    </td>
                    <td>
                      <div style={{ fontWeight: '600' }}>{student.name}</div>
                    </td>
                    <td>{student.room || '—'}</td>
                    <td>{student.branch || '—'} {student.year ? `(${student.year})` : ''}</td>
                    <td>{student.mobile || '—'}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => handleToggleLeave(student.messNumber, selectedDate)}
                        style={{
                          background: '#fff0d6',
                          border: '1px solid #ffd8a8',
                          color: 'var(--danger)',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: '700',
                          cursor: 'pointer'
                        }}
                        title="Cancel leave and mark student present">
                        ✕ Cancel Leave (Mark Present)
                      </button>
                      <button
                        onClick={() => setWeekModalStudent(student)}
                        style={{
                          background: 'none',
                          border: '1px solid var(--border)',
                          color: 'var(--ink)',
                          padding: '6px 10px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: '600',
                          marginLeft: '8px',
                          cursor: 'pointer'
                        }}>
                        Week 📅
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* TAB 2: ALL STUDENTS ROSTER WITH TOGGLES */}
      {activeTab === 'all' && (
        <div className="ui-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', width: '320px', maxWidth: '100%' }}>
              <input
                type="text"
                placeholder="🔍 Search student name, mess #, room..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  border: '1px solid var(--border)',
                  background: 'var(--paper)',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--muted)',
                    fontSize: '13px'
                  }}>
                  ✕
                </button>
              )}
            </div>

            <div style={{ fontSize: '13px', color: 'var(--muted)' }}>
              Showing {filteredStudents.length} of {totalActive} students
            </div>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '80px' }}>Mess #</th>
                <th>Student Name</th>
                <th>Room</th>
                <th>Status on {formatDateDisplay(selectedDate)}</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: 'var(--muted)' }}>
                    No students match "{searchQuery}".
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s) => {
                  const isOnLeave = leavesSet.has(`${s.messNumber}_${selectedDate}`);
                  return (
                    <tr key={s.messNumber}>
                      <td style={{ fontWeight: '700' }}>#{s.messNumber}</td>
                      <td>
                        <div style={{ fontWeight: '600' }}>{s.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
                          {s.branch || ''} {s.year ? `· ${s.year}` : ''}
                        </div>
                      </td>
                      <td>{s.room || '—'}</td>
                      <td>
                        <span className={`status-badge ${isOnLeave ? 'low' : 'good'}`}>
                          {isOnLeave ? '🌴 On Leave' : '✓ Present'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={() => handleToggleLeave(s.messNumber, selectedDate)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            border: isOnLeave ? '1px solid #ffd8a8' : '1px solid var(--border)',
                            background: isOnLeave ? '#fff0d6' : 'var(--paper)',
                            color: isOnLeave ? 'var(--danger)' : 'var(--ink)'
                          }}>
                          {isOnLeave ? 'Cancel Leave' : '+ Mark Leave'}
                        </button>
                        <button
                          onClick={() => setWeekModalStudent(s)}
                          style={{
                            background: 'none',
                            border: '1px solid var(--border)',
                            color: 'var(--muted)',
                            padding: '6px 10px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: '600',
                            marginLeft: '8px',
                            cursor: 'pointer'
                          }}
                          title="View 7-day schedule">
                          Week 📅
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL 1: STUDENT 7-DAY WEEK VIEW */}
      {weekModalStudent && (
        <div className="modal-overlay" onClick={() => setWeekModalStudent(null)}>
          <div 
            className="modal-card" 
            onClick={(e) => e.stopPropagation()} 
            style={{ maxWidth: '620px', width: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '18px' }}>
                  Weekly Leaves for {weekModalStudent.name}
                </h2>
                <div style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '3px' }}>
                  Mess #{weekModalStudent.messNumber} · Room {weekModalStudent.room || '—'}
                </div>
              </div>
              <button 
                className="ghost" 
                style={{ fontSize: '18px', padding: '4px 8px' }} 
                onClick={() => setWeekModalStudent(null)}>
                ✕
              </button>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--muted)', margin: '0 0 16px' }}>
              Tap any day below to approve or cancel leave for that date:
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '10px' }}>
              {weekDays.map(({ day, label, iso, isToday }) => {
                const on = leavesSet.has(`${weekModalStudent.messNumber}_${iso}`);
                return (
                  <button
                    key={iso}
                    onClick={() => handleToggleLeave(weekModalStudent.messNumber, iso)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '14px 8px',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      border: on ? '2px solid var(--amber-pressed)' : '1px solid var(--border)',
                      background: on ? '#fff0d6' : isToday ? 'var(--amber-soft)' : 'var(--paper)',
                      color: 'var(--ink)'
                    }}>
                    <span style={{ fontWeight: '700', fontSize: '14px' }}>{label}</span>
                    <span style={{ fontSize: '11px', color: on ? 'var(--amber-pressed)' : 'var(--muted)', fontWeight: on ? '700' : '500' }}>
                      {on ? '🌴 On Leave' : isToday ? 'Today · Present' : 'Present'}
                    </span>
                  </button>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button 
                className="primaryBtn" 
                onClick={() => setWeekModalStudent(null)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: QUICK MARK ON LEAVE */}
      {addModalOpen && (
        <div className="modal-overlay" onClick={() => setAddModalOpen(false)}>
          <div 
            className="modal-card" 
            onClick={(e) => e.stopPropagation()} 
            style={{ maxWidth: '440px', width: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ margin: 0, fontSize: '18px' }}>Mark Student on Leave</h2>
              <button className="ghost" onClick={() => setAddModalOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleAddLeaveSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>
                  Select Student:
                </label>
                <select
                  required
                  value={addForm.messNumber}
                  onChange={(e) => setAddForm({ ...addForm, messNumber: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: '1px solid var(--border)',
                    background: 'var(--paper)',
                    fontSize: '14px'
                  }}>
                  <option value="">-- Choose student --</option>
                  {students.map((s) => (
                    <option key={s.messNumber} value={s.messNumber}>
                      #{s.messNumber} - {s.name} (Room {s.room || '—'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>
                  Leave Date:
                </label>
                <input
                  type="date"
                  required
                  value={addForm.date}
                  onChange={(e) => setAddForm({ ...addForm, date: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: '1px solid var(--border)',
                    background: 'var(--paper)',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button 
                  type="button" 
                  className="ghost dark" 
                  onClick={() => setAddModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="primaryBtn">
                  Confirm Leave
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
