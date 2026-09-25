import { useEffect, useMemo, useRef, useState } from 'react';

import { api } from './api';
import { DAYS } from './menuData';
import { Avatar, FoodLoader, Icon } from './ui';

/**
 * ROSTER + LEAVES — owner pastes the mess office list, students claim their
 * accounts by verifying mess number + name + mobile at signup.
 * Data lives in MongoDB:
 *   students/{messNumber} = { messNumber, name, year?, branch?, room?, mobile, claimed, claimedAt }
 *   leaves   { messNumber}_{YYYY-MM-DD} = { messNumber, date }
 * This panel polls the API every ~5s.
 */

/** Poll a GET endpoint until the component unmounts. `refresh()` forces a reload. */
function usePoll(path, transform, interval = 5000) {
  const [data, setData] = useState(null);
  const [pollError, setPollError] = useState('');
  const [version, setVersion] = useState(0);
  const refresh = () => setVersion((v) => v + 1);
  useEffect(() => {
    let alive = true;
    const load = () =>
      api
        .get(path)
        .then((d) => {
          if (alive) setData(transform(d));
        })
        .catch((e) => {
          if (alive) setPollError(e.message);
        });
    load();
    const t = setInterval(load, interval);
    return () => {
      alive = false;
      clearInterval(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, version]);

  return [data, pollError, refresh];
}

function isoDate(dt) {
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}

const LEAVE_TYPE_LABELS = { normal: 'Regular', holiday: 'Holiday', prep: 'Prep' };

function formatDay(iso) {
  const dt = new Date(`${iso}T00:00:00`);
  return dt.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

function formatShort(iso) {
  const dt = new Date(`${iso}T00:00:00`);
  return dt.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}

function makeWeek(offset) {
  const now = new Date();
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7) + offset * 7);
  return DAYS.map((day, i) => {
    const dt = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
    return {
      day,
      label: dt.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' }),
      short: dt.toLocaleDateString('en-IN', { weekday: 'short' }),
      date: dt.getDate(),
      month: dt.toLocaleDateString('en-IN', { month: 'short' }),
      iso: isoDate(dt),
      isToday: isoDate(now) === isoDate(dt),
    };
  });
}

function cleanMobile(raw) {
  const digits = String(raw || '').trim().split(/[/\s,]+/)[0].replace(/\D/g, '');
  return { mobile: digits, mobileOk: digits.length === 10 };
}

function parseRoster(text) {
  return text.split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const cells = line.includes('\t') ? line.split('\t') : line.split(/[,\t;]+/);
      const messNo = (cells[0] || '').replace(/\s/g, '');
      if (!/^\d+$/.test(messNo)) return null;
      const name = (cells[1] || '').trim();
      if (!name) return null;
      const { mobile, mobileOk } = cleanMobile(cells[5]);
      return {
        messNo,
        name: name.replace(/\s+/g, ' '),
        year: (cells[2] || '').trim(),
        branch: (cells[3] || '').trim(),
        room: (cells[4] || '').replace(/\s/g, ''),
        mobile,
        mobileOk,
      };
    })
    .filter(Boolean);
}

function Modal({ title, sub, children, actions, onClose }) {
  useEffect(() => {
    const h = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" role="dialog" aria-modal="true">
        <div className="modal-head">
          <div>
            <h3>{title}</h3>
            {sub && <p>{sub}</p>}
          </div>
          <button className="icon-btn" style={{ width: 32, height: 32 }} onClick={onClose} title="Close">
            <Icon name="x" size={15} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {actions && <div className="modal-foot">{actions}</div>}
      </div>
    </div>
  );
}

export default function LeavesEditor() {
  const [students, studentsError, refreshStudents] = usePoll('/students', (d) =>
    d.students
      .map((s) => ({ id: s.messNumber, ...s }))
      .sort((a, b) => (a.name || '').localeCompare(b.name || '')),
  );
  const [serverLeaves, leavesError, refreshLeaves] = usePoll('/leaves', (d) =>
    d.leaves.reduce((acc, l) => {
      acc[l.id] = l.type || 'normal';
      return acc;
    }, {}),
  );
  const [leaves, setLeaves] = useState(null);
  const pendingToggles = useRef(0);

  /* Apply the server snapshot only when no toggle is mid-flight, so a poll
     can never undo an approval that is still saving. */
  useEffect(() => {
    if (!serverLeaves) return;
    if (pendingToggles.current > 0) return;
    setLeaves({ ...serverLeaves });
  }, [serverLeaves]);

  const LEAVE_TYPES = [
    { id: 'normal', label: 'Regular', hint: 'Up to 4 / month' },
    { id: 'holiday', label: 'Holiday', hint: 'Festival / break' },
    { id: 'prep', label: 'Prep', hint: 'Exam prep' },
  ];

  const [selectedId, setSelectedId] = useState(null);
  const [modal, setModal] = useState(null); // null | 'add' | 'import'
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [rosterTab, setRosterTab] = useState('active');
  const [rosterQuery, setRosterQuery] = useState('');
  const [rosterFilter, setRosterFilter] = useState('all'); // 'all' | 'linked' | 'unlinked' | 'leave'
  const [confirmRemoveId, setConfirmRemoveId] = useState(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const week = useMemo(() => makeWeek(weekOffset), [weekOffset]);

  useEffect(() => {
    if (studentsError) setError(studentsError);
    if (leavesError) setError(leavesError);
  }, [studentsError, leavesError]);

  /* Auto-select the first student so the planner never sits empty. */
  useEffect(() => {
    if (!students) return;
    const first = students.find((s) => s.name && s.active !== false);
    if (first && !selectedId) setSelectedId(first.id);
  }, [students]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Bulk import ──────────────────────────────────────────────────── */

  const [bulkText, setBulkText] = useState('');
  const [importMsg, setImportMsg] = useState('');
  const [importBusy, setImportBusy] = useState(false);

  async function importRoster() {
    const entries = parseRoster(bulkText);
    setImportMsg('');
    if (!entries.length) { setImportMsg('Nothing to import — check the format below.'); return; }
    setImportBusy(true);
    try {
      const { imported, skipped } = await api.post('/students/import', {
        students: entries.map((e) => ({
          messNumber: e.messNo,
          name: e.name,
          year: e.year,
          branch: e.branch,
          room: e.room,
          mobile: e.mobile,
        })),
      });
      const skippedNote = Array.isArray(skipped) && skipped.length
        ? ` Skipped (mobile missing/invalid): ${skipped.map((s) => `${s.messNumber} ${s.name}`).join(', ')}`
        : '';
      setImportMsg(`Imported ${imported} / ${entries.length} students.${skippedNote}`);
      if (!(skipped && skipped.length)) {
        setBulkText('');
        setModal(null);
        setStatus(`Imported ${imported} students into the roster.`);
      }
      refreshStudents();
      setImportBusy(false);
    } catch (err) {
      setImportMsg(`Import failed: ${err.message}`);
      setImportBusy(false);
    }
  }

  /* ── Quick add ────────────────────────────────────────────────────── */

  const blankQuick = { messNumber: '', name: '', mobile: '', year: '', branch: '', room: '' };
  const [quick, setQuick] = useState(blankQuick);
  const [addMsg, setAddMsg] = useState('');
  const [addBusy, setAddBusy] = useState(false);

  function openAdd() {
    setQuick(blankQuick);
    setAddMsg('');
    setAddBusy(false);
    setModal('add');
  }
  function openImport() {
    setBulkText('');
    setImportMsg('');
    setImportBusy(false);
    setModal('import');
  }

  async function quickAdd() {
    setAddMsg('');
    const messNo = quick.messNumber.replace(/\s/g, '');
    if (!/^\d+$/.test(messNo)) { setAddMsg('Enter a numeric mess number.'); return; }
    if (!quick.name.trim()) { setAddMsg('Enter the student name.'); return; }
    if (quick.mobile.replace(/\D/g, '').length !== 10) { setAddMsg('Mobile must be a 10-digit number.'); return; }
    setAddBusy(true);
    try {
      await api.post('/students', {
        messNumber: messNo,
        name: quick.name.trim().replace(/\s+/g, ' '),
        mobile: quick.mobile.replace(/\D/g, ''),
        year: quick.year.trim(),
        branch: quick.branch.trim(),
        room: quick.room.trim(),
      });
      setModal(null);
      setStatus(`Added ${quick.name.trim()} to the roster.`);
      setSelectedId(messNo);
      refreshStudents();
      setAddBusy(false);
    } catch (err) {
      setAddMsg(`Couldn't add: ${err.message}`);
      setAddBusy(false);
    }
  }

  /* ── Soft-remove / restore ─────────────────────────────────────────── */

  async function removeEntry(id) {
    try {
      await api.del(`/students/${encodeURIComponent(id)}`);
      if (selectedId === id) setSelectedId(null);
      setConfirmRemoveId(null);
      setStatus('Moved to Removed — can be restored any time.');
      refreshStudents();
    } catch (err) {
      setError(`Couldn't remove: ${err.message}`);
    }
  }

  async function restoreEntry(id, name) {
    try {
      await api.post(`/students/${encodeURIComponent(id)}/restore`);
      setError('');
      setStatus(`Restored ${name} to the active roster.`);
      refreshStudents();
    } catch (err) {
      setError(`Couldn't restore: ${err.message}`);
    }
  }

  /* ── Leave toggle ───────────────────────────────────────────────────── */

  const [rangeFrom, setRangeFrom] = useState('');
  const [rangeTo, setRangeTo] = useState('');
  const [rangeBusy, setRangeBusy] = useState(false);
  const [leaveType, setLeaveType] = useState('normal');

  /* Auto-save: the moment a valid From→To range + type exists, persist it
     to the backend (debounced). No Apply button needed. */
  const lastAutoSig = useRef('');
  useEffect(() => {
    if (!selectedId || !rangeFrom || !rangeTo || rangeFrom > rangeTo) return;
    const sig = `${selectedId}|${rangeFrom}|${rangeTo}|${leaveType}`;
    if (sig === lastAutoSig.current) return;
    lastAutoSig.current = sig;
    const t = setTimeout(() => applyRange(), 450);
    return () => clearTimeout(t);
  }, [rangeFrom, rangeTo, leaveType, selectedId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function toggleDay(iso, type = leaveType) {
    if (!selectedId) return;
    const key = `${selectedId}_${iso}`;
    pendingToggles.current += 1;
    /* Flip the chip immediately so the UI feels instant… */
    setLeaves((prev) => {
      const next = { ...prev };
      if (next[key]) delete next[key];
      else next[key] = type;
      return next;
    });
    try {
      /* …then let the server be authoritative for this day. */
      const res = await api.put('/leaves/toggle', { messNumber: selectedId, date: iso, type });
      setLeaves((prev) => {
        const next = { ...prev };
        if (res.on) next[key] = res.type || type;
        else delete next[key];
        return next;
      });
    } catch (err) {
      setError(`Toggle failed: ${err.message}`);
      setLeaves((prev) => {
        const next = { ...prev };
        if (next[key]) delete next[key];
        else next[key] = type;
        return next;
      });
    } finally {
      pendingToggles.current -= 1;
      if (pendingToggles.current === 0) refreshLeaves();
    }
  }

  async function applyRange() {
    if (!selectedId) return;
    if (!rangeFrom || !rangeTo) { setError('Pick both a start and an end date.'); return; }
    if (rangeFrom > rangeTo) { setError('End date is before the start date.'); return; }
    setError('');
    pendingToggles.current += 1;
    setRangeBusy(true);
    try {
      const res = await api.put('/leaves/range', {
        messNumber: selectedId,
        from: rangeFrom,
        to: rangeTo,
        type: leaveType,
      });
      const applied = res.applied || [];
      const skipped = res.skipped || [];
      setLeaves((prev) => {
        const next = { ...prev };
        applied.forEach((a) => { next[a.id] = a.type; });
        skipped.forEach((s) => { delete next[s.id]; });
        return next;
      });
      const label = LEAVE_TYPES.find((t) => t.id === leaveType).label;
      const msg = `Applied ${applied.length} ${label} leave day${applied.length === 1 ? '' : 's'}.`;
      setStatus(skipped.length ? `${msg} ${skipped.length} skipped — Regular leave is capped at 4 days/month.` : msg);
      if (applied.length) alignWeekTo(rangeFrom);
    } catch (err) {
      setError(`Couldn't apply the range: ${err.message}`);
    } finally {
      pendingToggles.current -= 1;
      if (pendingToggles.current === 0) refreshLeaves();
      setRangeBusy(false);
    }
  }

  /** Point the planner at the week containing the given date, so the
      filled From/To dates line up with their weekday column below. */
  function alignWeekTo(iso) {
    if (!iso) return;
    const target = new Date(`${iso}T00:00:00`);
    const now = new Date();
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7));
    const days = Math.floor((target.getTime() - monday.getTime()) / 86400000);
    setWeekOffset(Math.floor(days / 7));
  }

  async function clearWeek() {
    if (!selectedId) return;
    for (const d of week) {
      if (leaves[`${selectedId}_${d.iso}`]) await toggleDay(d.iso);
    }
    setStatus('Cleared all leave for this week.');
  }

  async function clearHistory() {
    if (!selectedId) return;
    const days = history.filter((h) => leaves[`${selectedId}_${h.iso}`]);
    if (!days.length) return;
    for (const { iso } of days) {
      await toggleDay(iso);
    }
    setStatus(`Removed all ${days.length} saved day${days.length === 1 ? '' : 's'} for ${selected.name}.`);
  }

  async function removeGroup(group) {
    if (!selectedId) return;
    for (const iso of group.days) {
      await toggleDay(iso);
    }
    setStatus(`Removed ${group.days.length} day${group.days.length === 1 ? '' : 's'} for ${selected.name}.`);
  }

  /* ── Render ───────────────────────────────────────────────────────── */

  const loadError = studentsError || leavesError;
  if (!students || !leaves) {
    return (
      <div className="page-load" aria-live="polite">
        <FoodLoader />
        {loadError ? (
          <p>
            <b>Couldn't load the roster.</b>&nbsp;{loadError}
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => { refreshStudents(); refreshLeaves(); }}>
              <Icon name="refresh" size={13} /> Retry
            </button>
          </p>
        ) : (
          <p>Warming up the mess pot…</p>
        )}
      </div>
    );
  }

  const selected = students.find((s) => s.id === selectedId);
  const rosterStudents = students.filter((s) => s.name);
  const activeStudents = rosterStudents.filter((s) => s.active !== false);
  const removedStudents = rosterStudents.filter((s) => s.active === false);

  const linkedCount = activeStudents.filter((s) => s.claimed).length;
  const onLeaveThisWeek = activeStudents.filter((s) =>
    week.some((d) => leaves[`${s.id}_${d.iso}`]),
  ).length;
  const unclaimedCount = activeStudents.length - linkedCount;

  const weekStart = week[0];
  const weekEnd = week[6];
  const weekRange = `${weekStart.short} ${weekStart.date} ${weekStart.month} – ${weekEnd.short} ${weekEnd.date} ${weekEnd.month}`;
  const isCurrentWeek = weekOffset === 0;

  /* The selected student's saved leave days, newest first — this is the
     backend source of truth (polled from /leaves) shown under the planner. */
  const todayIso = isoDate(new Date());
  const history = selected && leaves
    ? Object.entries(leaves)
        .filter(([k, v]) => v && k.startsWith(`${selectedId}_`))
        .map(([k, v]) => ({ iso: k.slice(selectedId.length + 1), type: v }))
        .sort((a, b) => (a.iso < b.iso ? 1 : -1))
    : [];

  /* Runs of consecutive days (1-day gaps, same type) shown together. */
  const historyGroups = (() => {
    const groups = [];
    for (const { iso, type } of history) {
      const last = groups[groups.length - 1];
      if (last && last.type === type) {
        const prev = new Date(`${last.days[last.days.length - 1]}T00:00:00`);
        const cur = new Date(`${iso}T00:00:00`);
        if ((prev - cur) / 86400000 === 1) {
          last.days.push(iso);
          last.start = iso;
          continue;
        }
      }
      groups.push({ type, days: [iso], start: iso, end: iso });
    }
    return groups;
  })();

  /* Which week (index from today's Monday) holds a given date? */
  const weekIndex = (iso) => {
    if (!iso) return weekOffset;
    const target = new Date(`${iso}T00:00:00`);
    const now = new Date();
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7));
    return Math.floor((target.getTime() - monday.getTime()) / 86400000 / 7);
  };

  /* Render every week the filled From→To range covers so a multi-week
     range stays visible and coloured end to end (plus the browsed week). */
  const rowOffsets = (() => {
    const lo = Math.min(weekOffset, weekIndex(rangeFrom), weekIndex(rangeTo));
    const hi = Math.max(weekOffset, weekIndex(rangeFrom), weekIndex(rangeTo));
    if (hi - lo > 8) return [weekOffset]; // safety — never explode the layout
    const out = [];
    for (let o = lo; o <= hi; o++) out.push(o);
    return out;
  })();

  /* Regular-leave meter for the selected student, shown week's calendar month. */
  const selMonth = week[0].iso.slice(0, 7);
  const normalUsedThisMonth = selected
    ? Object.entries(leaves).filter(([k, v]) => k.startsWith(`${selectedId}_${selMonth}`) && v === 'normal').length
    : 0;

  const q = rosterQuery.trim().toLowerCase().replace(/\s+/g, ' ');
  const qWords = q ? q.split(' ') : [];
  const byFilter = (s) => {
    if (rosterFilter === 'linked') return s.claimed;
    if (rosterFilter === 'unlinked') return !s.claimed;
    if (rosterFilter === 'leave') return week.some((d) => leaves[`${s.id}_${d.iso}`]);
    return true;
  };
  const visibleActive = activeStudents.filter((s) => {
    if (!byFilter(s)) return false;
    if (!q) return true;
    const hay = `${s.name} ${s.messNumber} ${s.room || ''} ${s.branch || ''}`.toLowerCase().replace(/\s+/g, ' ');
    return qWords.every((w) => hay.includes(w));
  });
  const filterMeta = {
    linked: { label: 'Linked accounts', icon: 'checkCircle' },
    unlinked: { label: 'Not yet linked', icon: 'userPlus' },
    leave: { label: 'On leave · shown week', icon: 'calendar' },
  };

  const selectedDaysOff = selected
    ? week.filter((d) => leaves[`${selectedId}_${d.iso}`]).length
    : 0;

  const quickFields = [
    ['messNumber', 'Mess number', 'e.g. 142'],
    ['name', 'Full name', 'As per mess records'],
    ['mobile', 'Mobile (10 digits)', '9123456789'],
    ['year', 'Year', 'BE / SE / TE'],
    ['branch', 'Branch', 'COMP / IT…'],
    ['room', 'Room', 'e.g. A-118'],
  ];

  return (
    <div className="stack">
      {/* ── Quick-scan stats (click to filter the roster) ── */}
      <div className="kpis">
        <button className={`card card-pad kpi kpi-btn${rosterFilter === 'all' ? ' active' : ''}`} onClick={() => { setRosterFilter('all'); setRosterTab('active'); }} title="Show everyone on the roster">
          <span className="kpi-ico tone-violet"><Icon name="users" size={19} /></span>
          <div>
            <div className="kpi-num">{activeStudents.length}</div>
            <div className="kpi-label">Students on roster</div>
            <div className="kpi-note">{removedStudents.length ? `${removedStudents.length} removed` : 'Full mess strength'}</div>
          </div>
          <Icon name="arrowRight" size={13} className="kpi-go" />
        </button>
        <button className={`card card-pad kpi kpi-btn${rosterFilter === 'linked' ? ' active' : ''}`} onClick={() => { setRosterFilter('linked'); setRosterTab('active'); }} title="Show students whose accounts are linked">
          <span className="kpi-ico tone-green"><Icon name="checkCircle" size={19} /></span>
          <div>
            <div className="kpi-num">{linkedCount}</div>
            <div className="kpi-label">Accounts linked</div>
            <div className="kpi-note">Student app logins</div>
          </div>
          <Icon name="arrowRight" size={13} className="kpi-go" />
        </button>
        <button className={`card card-pad kpi kpi-btn${rosterFilter === 'leave' ? ' active' : ''}`} onClick={() => { setRosterFilter('leave'); setRosterTab('active'); }} title="Show students with approved leave in the shown week">
          <span className="kpi-ico tone-amber"><Icon name="calendar" size={19} /></span>
          <div>
            <div className="kpi-num">{onLeaveThisWeek}</div>
            <div className="kpi-label">On leave</div>
            <div className="kpi-note">{isCurrentWeek ? 'This week · approved days' : weekRange}</div>
          </div>
          <Icon name="arrowRight" size={13} className="kpi-go" />
        </button>
        <button className={`card card-pad kpi kpi-btn${rosterFilter === 'unlinked' ? ' active' : ''}`} onClick={() => { setRosterFilter('unlinked'); setRosterTab('active'); }} title="Show students waiting to link their account">
          <span className="kpi-ico tone-blue"><Icon name="userPlus" size={19} /></span>
          <div>
            <div className="kpi-num">{unclaimedCount}</div>
            <div className="kpi-label">Not yet linked</div>
            <div className="kpi-note">Waiting for sign-up</div>
          </div>
          <Icon name="arrowRight" size={13} className="kpi-go" />
        </button>
      </div>

      {/* ── Roster + planner ── */}
      <div className="leaves-grid">
        {/* Left · Roster list */}
        <section className="card roster-card">
          <div className="card-head">
            <span className="hd">
              <span className="hd-chip tone-violet"><Icon name="users" size={16} /></span>
              <div>
                <h3>Roster</h3>
                <p>Search, add and manage students</p>
              </div>
            </span>
          </div>

          <div style={{ padding: '14px 22px 14px', display: 'flex', gap: 8 }}>
            <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={openAdd}>
              <Icon name="plus" size={14} /> Add student
            </button>
            <button className="btn btn-sm" style={{ flex: 1 }} onClick={openImport}>
              <Icon name="upload" size={14} /> Import list
            </button>
          </div>

          <div className="roster-tabs seg">
            <button className={rosterTab === 'active' ? 'active' : ''} style={{ flex: 1 }} onClick={() => setRosterTab('active')}>
              Active ({activeStudents.length})
            </button>
            <button className={rosterTab === 'removed' ? 'active' : ''} style={{ flex: 1 }} onClick={() => setRosterTab('removed')}>
              Removed ({removedStudents.length})
            </button>
          </div>

          {rosterTab === 'active' ? (
            <>
              {activeStudents.length > 0 && (
                <div style={{ padding: '0 22px 10px' }}>
                  <span className="search-wrap" style={{ display: 'block' }}>
                    <Icon name="search" size={15} />
                    <input
                      className="field"
                      style={{ width: '100%' }}
                      placeholder="Search name, mess no. or room…"
                      value={rosterQuery}
                      onChange={(e) => setRosterQuery(e.target.value)}
                    />
                  </span>
                </div>
              )}
              {rosterFilter !== 'all' && (
                <div className="roster-filter-note">
                  <span>
                    <Icon name={filterMeta[rosterFilter].icon} size={13} />
                    Showing <b>{filterMeta[rosterFilter].label}</b> · {visibleActive.length} student{visibleActive.length === 1 ? '' : 's'}
                  </span>
                  <button className="link-btn" onClick={() => setRosterFilter('all')}>Show all</button>
                </div>
              )}
              {visibleActive.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-ico"><Icon name="users" size={20} /></span>
                  <b>{activeStudents.length === 0 ? 'No students yet' : rosterFilter !== 'all' ? 'Nothing here' : 'No matches'}</b>
                  <p>{activeStudents.length === 0
                    ? 'Add a student or paste the mess office list to get going.'
                    : rosterFilter === 'linked' ? 'No student has linked their app account yet.'
                    : rosterFilter === 'unlinked' ? 'Everyone has linked their account — nice.'
                    : rosterFilter === 'leave' ? 'Nobody has approved leave in the shown week.'
                    : 'Try a different name, mess number or room.'}</p>
                </div>
              ) : (
                <ul className="roster-list">
                  {visibleActive.map((s) => {
                    const isSel = selectedId === s.id;
                    const confirming = confirmRemoveId === s.id;
                    return (
                      <li key={s.id} className="roster-li">
                        <div
                          className={`roster-row ${isSel ? 'selected' : ''}`}
                          role="button"
                          tabIndex={0}
                          onClick={() => setSelectedId(s.id)}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedId(s.id); } }}>
                          <Avatar name={s.name} size={36} plain />
                          <span className="who">
                            <b>{s.name}</b>
                            <small>#{s.messNumber}{s.room ? ` · ${s.room}` : ''}{s.branch ? ` · ${s.branch}` : ''}</small>
                          </span>
                          <span className={`badge ${s.claimed ? 'good' : 'neutral'}`}>
                            {s.claimed ? 'Linked' : 'Invite'}
                          </span>
                          {confirming ? (
                            <span className="confirm-row">
                              <button className="btn btn-danger btn-xs" onClick={(e) => { e.stopPropagation(); removeEntry(s.id); }}>Remove</button>
                              <button className="btn btn-ghost btn-xs" onClick={(e) => { e.stopPropagation(); setConfirmRemoveId(null); }}>Cancel</button>
                            </span>
                          ) : (
                            <button className="row-x" title="Remove from roster" onClick={(e) => { e.stopPropagation(); setConfirmRemoveId(s.id); }}>
                              <Icon name="x" size={14} />
                            </button>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          ) : removedStudents.length === 0 ? (
            <div className="empty-state">
              <span className="empty-ico"><Icon name="check" size={20} /></span>
              <b>Nothing removed</b>
              <p>Removed students land here and can be restored any time.</p>
            </div>
          ) : (
            <ul className="roster-list">
              {removedStudents.map((s) => (
                <li key={s.id} className="roster-li">
                  <div className="roster-row" role="button" tabIndex={0}
                    onClick={() => { setRosterTab('active'); setSelectedId(s.id); }}
                    onKeyDown={(e) => { if (e.key === 'Enter') { setRosterTab('active'); setSelectedId(s.id); } }}>
                    <Avatar name={s.name} size={36} plain />
                    <span className="who">
                      <b>{s.name}</b>
                      <small>#{s.messNumber} · removed</small>
                    </span>
                    <span className="badge neutral">Removed</span>
                    <button className="btn btn-ghost btn-xs btn-restore" onClick={(e) => { e.stopPropagation(); restoreEntry(s.id, s.name); }}>
                      <Icon name="refresh" size={12} /> Restore
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="planner-col">
          {/* Right · Weekly planner */}
          <section className="card">
          {!selected ? (
            <div className="empty-state">
              <span className="empty-ico"><Icon name="calendar" size={20} /></span>
              <b>Pick a student</b>
              <p>Select anyone from the roster to approve or cancel their leave days.</p>
            </div>
          ) : (
            <>
              <div className="card-head">
                <span className="hd">
                  <span className="hd-chip tone-amber"><Icon name="calendar" size={16} /></span>
                  <div>
                    <h3>Weekly planner</h3>
                    <p>Approve or cancel leave day by day</p>
                  </div>
                </span>
                <span className="head-actions">
                  <span className="week-nav">
                    <button className="nav-btn" onClick={() => setWeekOffset((o) => o - 1)} title="Previous week">
                      <Icon name="chevronLeft" size={15} />
                    </button>
                    <button className="nav-week" onClick={() => setWeekOffset(0)} title="Jump back to this week">
                      {isCurrentWeek ? 'This week' : weekRange}
                    </button>
                    <button className="nav-btn" onClick={() => setWeekOffset((o) => o + 1)} title="Next week">
                      <Icon name="chevronRight" size={15} />
                    </button>
                  </span>
                  <button className="btn btn-ghost btn-sm" onClick={clearWeek} title="Turn off every approved day for this week">
                    Clear week
                  </button>
                </span>
              </div>

              <div className="card-body planner-body">
                <div className="planner-hero">
                  <Avatar name={selected.name} size={52} />
                  <div className="hero-meta">
                    <h3>{selected.name}</h3>
                    <p className="meta-chips">
                      <span>#{selected.messNumber}</span>
                      {selected.branch && <span>{selected.branch}</span>}
                      {selected.room && <span>{selected.room}</span>}
                      {selected.year && <span>{selected.year}</span>}
                    </p>
                  </div>
                  <span className={`badge ${selected.claimed ? 'good' : 'neutral'}`} style={{ flex: '0 0 auto' }}>
                    {selected.claimed ? 'Account linked' : 'Not linked yet'}
                  </span>
                </div>

                <div className="range-panel">
                  <div className="range-head">
                    <span className="range-title"><Icon name="calendar" size={14} /> Apply a date range</span>
                    <span className="range-hint">Auto-saves to the backend as you pick dates</span>
                  </div>
                  <div className="range-row">
                    <label className="range-field">
                      <span>From</span>
                      <input type="date" value={rangeFrom} onChange={(e) => {
                        const v = e.target.value;
                        setRangeFrom(v);
                        if (v && !rangeTo) setRangeTo(v);
                        alignWeekTo(v);
                      }} />
                    </label>
                    <Icon name="arrowRight" size={14} className="range-arrow" />
                    <label className="range-field">
                      <span>To</span>
                      <input type="date" value={rangeTo} onChange={(e) => {
                        const v = e.target.value;
                        setRangeTo(v);
                        if (v && !rangeFrom) setRangeFrom(v);
                        alignWeekTo(v);
                      }} />
                    </label>
                    <div className="type-seg seg" role="group" aria-label="Leave type">
                      {LEAVE_TYPES.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          className={`${t.id}${leaveType === t.id ? ' active' : ''}`}
                          aria-pressed={leaveType === t.id}
                          onClick={() => setLeaveType(t.id)}
                          title={t.hint}>
                          {t.label}
                        </button>
                      ))}
                    </div>
                    {rangeBusy ? (
                      <span className="auto-chip"><span className="auto-spin" /> Saving…</span>
                    ) : (
                      <span className="auto-chip ok"><Icon name="check" size={12} /> Saves automatically</span>
                    )}
                  </div>
                </div>

                {rowOffsets.map((off) => {
                  const days = makeWeek(off);
                  const head = off === 0 ? 'This week'
                    : `${days[0].short} ${days[0].date} ${days[0].month} – ${days[6].short} ${days[6].date} ${days[6].month}`;
                  return (
                    <div className="week-row" key={off}>
                      <span className="week-row-head"><Icon name="calendar" size={11} />{head}</span>
                      <div className="leave-week">
                        {days.map(({ day, short, date, month, iso, isToday }) => {
                          const key = `${selectedId}_${iso}`;
                          const type = leaves[key] || '';
                          const on = !!type;
                          const inRange = !on && rangeFrom && rangeTo && iso >= rangeFrom && iso <= rangeTo;
                          const anchor = iso === rangeFrom && iso === rangeTo ? ' both'
                            : iso === rangeFrom ? ' from'
                            : iso === rangeTo ? ' to'
                            : '';
                          return (
                            <button
                              key={`${off}_${day}`}
                              className={`leave-day${on ? ` on ${type}` : ''}${inRange ? ` preview ${leaveType}` : ''}${isToday ? ' today' : ''}${anchor}`}
                              onClick={() => toggleDay(iso)}
                              title={`${short} ${date} ${month} — ${on ? 'cancel leave' : `add ${LEAVE_TYPES.find((t) => t.id === leaveType).label} leave`}`}>
                              <span className="tick"><Icon name="check" size={11} /></span>
                              {anchor && <span className={`anchor-mark${anchor}`} />}
                              <span className="wd">{short}</span>
                              <span className="dd">{date}</span>
                              <span className="state">{isToday ? 'Today' : month}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                <div className="legend">
                  {LEAVE_TYPES.map((t) => (
                    <span key={t.id}><i className={`dot ${t.id}`} />{t.label} · {t.hint}</span>
                  ))}
                </div>

                <div className="planner-summary">
                  <span className="sum-days">
                    <Icon name={selectedDaysOff ? 'checkCircle' : 'clock'} size={15} />
                    {selectedDaysOff
                      ? `${selectedDaysOff} ${selectedDaysOff === 1 ? 'day' : 'days'} on leave this week`
                      : 'No leave approved this week'}
                  </span>
                  <span className="badge neutral">Regular {normalUsedThisMonth}/4 this month</span>
                  <span className="sum-live"><Icon name="activity" size={13} /> Saves instantly</span>
                </div>
              </div>

              <div className="planner-foot">
                <p><Icon name="activity" size={13} style={{ color: 'var(--success)' }} /> Students' mess-status calendars update live.</p>
              </div>
            </>
          )}
        </section>

        {/* Previous holidays · saved days for the selected student */}
        <section className="card history-card">
          {!selected ? (
            <div className="empty-state">
              <span className="empty-ico"><Icon name="calendar" size={20} /></span>
              <b>Previous holidays</b>
              <p>Pick a student from the roster to see every approved day.</p>
            </div>
          ) : (
            <>
              <div className="card-head">
                <span className="hd">
                  <span className="hd-chip tone-violet"><Icon name="calendar" size={16} /></span>
                  <div>
                    <h3>Previous holidays</h3>
                    <p>{selected.name} · #{selected.messNumber} — every saved day {history.length ? `(${history.length})` : ''}</p>
                  </div>
                </span>
                {history.length > 0 && (
                  <button className="btn btn-ghost btn-sm" onClick={clearHistory} title="Remove every saved day for this student">
                    Clear all
                  </button>
                )}
              </div>
              <div className="card-body">
                {history.length === 0 ? (
                  <div className="empty-state">
                    <span className="empty-ico"><Icon name="check" size={20} /></span>
                    <b>No holidays saved yet</b>
                    <p>Approve days in the planner above and they'll be saved in the backend.</p>
                  </div>
                ) : (
                  <ul className="history-list">
                    {historyGroups.map((g) => {
                      const dayCount = g.days?.length || 1;
                      const range = dayCount === 1
                        ? formatDay(g.start)
                        : `${formatShort(g.start)} – ${formatDay(g.end)}`;
                      const upcoming = g.end >= todayIso;
                      return (
                        <li key={g.start} className="history-row">
                          <i className={`hdot ${g.type}`} />
                          <span className="hmeta">
                            <b>{range}</b>
                            <small>{dayCount} day{dayCount === 1 ? '' : 's'} · {LEAVE_TYPE_LABELS[g.type] || 'Leave'}</small>
                          </span>
                          {upcoming && <span className="badge neutral">Upcoming</span>}
                          <button className="btn btn-ghost btn-xs" title="Remove this leave" onClick={() => removeGroup(g)}>
                            <Icon name="x" size={12} /> Remove
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </>
          )}
        </section>
        </div>
      </div>

      {status && <div className="form-ok" style={{ gridColumn: '1 / -1' }}><Icon name="check" size={15} />{status}</div>}
      {error && <div className="form-error" style={{ gridColumn: '1 / -1' }}><Icon name="alert" size={15} />{error}</div>}

      {/* ── Modals ── */}
      {modal === 'add' && (
        <Modal
          title="Add a student"
          sub="One person, manually added to the roster"
          onClose={() => setModal(null)}
          actions={
            <>
              <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={quickAdd} disabled={addBusy}>
                <Icon name="check" size={15} /> {addBusy ? 'Adding…' : 'Add to roster'}
              </button>
            </>
          }>
          <div className="quick-grid">
            {quickFields.map(([key, label, ph]) => (
              <label className="field-group" key={key}>
                <span>{label}</span>
                <input
                  className="field"
                  placeholder={ph}
                  value={quick[key]}
                  onChange={(e) => setQuick({ ...quick, [key]: e.target.value })}
                />
              </label>
            ))}
          </div>
          {addMsg && <div className="form-error"><Icon name="alert" size={15} />{addMsg}</div>}
        </Modal>
      )}

      {modal === 'import' && (
        <Modal
          title="Import the mess office list"
          sub="Paste the TSV export — new students are added, existing ones updated"
          onClose={() => setModal(null)}
          actions={
            <>
              <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={importRoster} disabled={importBusy}>
                <Icon name="upload" size={15} /> {importBusy ? 'Importing…' : 'Import roster'}
              </button>
            </>
          }>
          <div className="modal-hint">
            <b>Format:</b>&nbsp; one student per line, tab-separated — mess number, name, year, branch, room, mobile.
            Students with a missing or invalid 10-digit mobile are skipped and reported.
          </div>
          <textarea
            className="field"
            rows={6}
            spellCheck={false}
            placeholder={'MESS NO.\tNAME\tYEAR\tBRANCH\tROOM\tMOBILE\n1\tKARPE VAISHNAVI\tBE\tCOMP\t118\t7219607376/9130297384\n2\tDESHMUKH RUTUJA\tSE\tIT\t204\t9876543210'}
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
          />
          {importMsg && (
            <div className={importMsg.startsWith('Imported') ? 'form-ok' : 'form-error'}>
              <Icon name={importMsg.startsWith('Imported') ? 'check' : 'alert'} size={15} />{importMsg}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}