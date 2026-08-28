import { useEffect, useMemo, useState } from 'react';

import { api } from './api';
import { DAYS } from './menuData';

/**
 * ROSTER + LEAVES — owner pastes the mess office list, students claim their
 * accounts by verifying mess number + name + mobile at signup.
 *
 * Data lives in MongoDB:
 *   students/{messNumber} = { messNumber, name, year?, branch?, room?, mobile, claimed, claimedAt }
 *   leaves   { messNumber}_{YYYY-MM-DD} = { messNumber, date }
 *
 * This panel polls the API every ~5s, so changes made by students (a fresh
 * claim, a leave granted) show up here almost immediately.
 *
 * Bulk paste accepts the office TSV (6 columns, tab-separated):
 *   MESS NO.  NAME   YEAR  BRANCH  ROOM NO.  MOBILE NUMBER
 *   1         KARPE  BE    COMP    118       7219607376/9130297384
 * Only the first mobile number is kept. Students whose mobile is missing
 * or doesn't look like a 10-digit Indian number are skipped and reported,
 * so the owner can get a corrected number and re-import later.
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

function currentWeek() {
  const now = new Date();
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7));
  return DAYS.map((day, i) => {
    const dt = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
    return {
      day,
      label: dt.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' }),
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
      if (!/^\d+$/.test(messNo)) return null; // skips header row + junk lines
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

export default function LeavesEditor() {
  const [students, studentsError] = usePoll('/students', (d) =>
    d.students
      .map((s) => ({ id: s.messNumber, ...s }))
      .sort((a, b) => (a.name || '').localeCompare(b.name || '')),
  );
  const [serverLeaves, leavesError, refreshLeaves] = usePoll('/leaves', (d) =>
    new Set(d.leaves.map((l) => l.id)),
  );
  const [leaves, setLeaves] = useState(null);
  useEffect(() => {
    if (serverLeaves) setLeaves(serverLeaves);
  }, [serverLeaves]);

  const [selectedId, setSelectedId] = useState(null);
  const [bulkText, setBulkText] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const week = useMemo(currentWeek, []);

  useEffect(() => {
    if (studentsError) setError(studentsError);
    if (leavesError) setError(leavesError);
  }, [studentsError, leavesError]);

  /* ── Bulk import ──────────────────────────────────────────────────── */

  async function importRoster() {
    const entries = parseRoster(bulkText);
    if (!entries.length) { setError('Nothing to import — check the format.'); return; }
    setStatus(`Importing ${entries.length} students…`);
    setError('');
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
        ? ` · Skipped (mobile missing/invalid): ${skipped.map((s) => `${s.messNumber} ${s.name}`).join(', ')}`
        : '';
      setStatus(`Imported ${imported} / ${entries.length}${skippedNote}`);
      setBulkText('');
    } catch (err) {
      setError(`Import failed: ${err.message}`);
    }
  }

  /* ── Remove roster entry ──────────────────────────────────────────── */

  async function removeEntry(id) {
    try { await api.del(`/students/${encodeURIComponent(id)}`); }
    catch (err) { setError(`Delete failed: ${err.message}`); }
  }

  /* ── Leave toggle ─────────────────────────────────────────────────── */

  async function toggleDay(iso) {
    if (!selectedId) return;
    // Flip locally for instant feedback, then reconcile with the server.
    setLeaves((prev) => {
      const next = new Set(prev);
      if (next.has(`${selectedId}_${iso}`)) next.delete(`${selectedId}_${iso}`);
      else next.add(`${selectedId}_${iso}`);
      return next;
    });
    try {
      await api.put('/leaves/toggle', { messNumber: selectedId, date: iso });
    } catch (err) {
      setError(`Toggle failed: ${err.message}`);
      refreshLeaves(); // restore true state
    }
  }

  /* ── Render ───────────────────────────────────────────────────────── */

  if (!students || !leaves) return <p className="muted">Loading roster…</p>;

  const selected = students.find((s) => s.id === selectedId);
  const rosterStudents = students.filter((s) => s.name); // filter out legacy/stray docs

  return (
    <div className="leavesGrid">
      {/* Left column: roster management + student list */}
      <section className="card studentCard">
        <h2 style={{ marginBottom: 4 }}>Roster</h2>
        <p className="muted" style={{ marginTop: 0, marginBottom: 8 }}>
          {rosterStudents.length} students · {rosterStudents.filter((s) => s.claimed).length} linked
        </p>

        {/* Bulk import */}
        <details style={{ marginBottom: 12 }}>
          <summary style={{ cursor: 'pointer', fontWeight: 600, fontSize: 13.5 }}>
            Bulk import from mess office list
          </summary>
          <textarea
            className="bulkBox"
            rows={5}
            placeholder={'Paste the mess office sheet (tab-separated):\nMESS NO.  NAME  YEAR  BRANCH  ROOM  MOBILE\n1  KARPE VAISHNAVI  BE  COMP  118  7219607376/9130297384'}
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            spellCheck={false}
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
            <button
              className="primaryBtn"
              onClick={importRoster}
              disabled={!bulkText.trim()}>
              Import
            </button>
            {status && <span className="muted">{status}</span>}
          </div>
        </details>

        {/* Student table */}
        {rosterStudents.length === 0 ? (
          <p className="muted">No students yet — paste the list above.</p>
        ) : (
          <ul className="studentList">
            {rosterStudents.map((s) => (
              <li key={s.id} className={selectedId === s.id ? 'selected' : ''}>
                <button onClick={() => setSelectedId(s.id)}>
                  <span className="studentName">{s.name}</span>
                  <span className="studentMeta">
                    #{s.messNumber}{s.claimed ? ' · linked' : ' · unclaimed'}
                  </span>
                </button>
                <button
                  className="rowDelete"
                  title="Remove from roster"
                  onClick={() => removeEntry(s.id)}>
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
        {error && <p className="error" style={{ marginTop: 8 }}>{error}</p>}
      </section>

      {/* Right column: leave toggles */}
      <section className="card">
        {!selected ? (
          <>
            <h2>Approved leaves</h2>
            <p className="muted">Pick a student on the left to manage their week.</p>
          </>
        ) : (
          <>
            <h2 style={{ marginBottom: 4 }}>{selected.name}</h2>
            <p className="muted" style={{ marginTop: 0 }}>
              #{selected.messNumber} · Tap a day to approve / cancel leave
            </p>
            <div className="leaveWeek">
              {week.map(({ day, label, iso, isToday }) => {
                const on = leaves.has(`${selectedId}_${iso}`);
                return (
                  <button
                    key={day}
                    className={`leaveChip${on ? ' on' : ''}${isToday ? ' today' : ''}`}
                    onClick={() => toggleDay(iso)}>
                    <span>{label}</span>
                    <small>{on ? 'On leave ✓' : isToday ? 'Today · present' : 'Present'}</small>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
