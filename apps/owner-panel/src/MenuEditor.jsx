import { useEffect, useState } from 'react';

import { api } from './api';
import { DAYS, DAY_LABELS, DEFAULT_WEEK, MEALS, MEAL_LABELS } from './menuData';

/**
 * WEEK'S MENU EDITOR — one MongoDB menu doc ("current") holds the week.
 *
 * Editing model: each meal is a plain textarea, ONE DISH PER LINE. Simple
 * to build, fast for the owner, and parsing happens only on Save.
 * Students' phones poll the API and pick up changes.
 */

function textsFromWeek(week) {
  const t = {};
  for (const day of DAYS) {
    for (const meal of MEALS) {
      t[`${day}.${meal}`] = (week[day]?.[meal] ?? []).join('\n');
    }
  }
  return t;
}

export default function MenuEditor() {
  const [texts, setTexts] = useState(null); // null = still loading
  const [activeDay, setActiveDay] = useState('MON');
  const [status, setStatus] = useState(''); // '' | 'dirty' | 'saving' | 'saved' | error msg
  const [loadedFromCloud, setLoadedFromCloud] = useState(false);

  useEffect(() => {
    api
      .get('/menu')
      .then(({ week }) => {
        setLoadedFromCloud(true);
        setStatus('');
        setTexts(textsFromWeek(week));
      })
      .catch((err) => {
        // API unreachable — fall back to defaults, editable offline
        setStatus(`load-failed: ${err.message}`);
        setTexts(textsFromWeek(DEFAULT_WEEK));
      });
  }, []);

  if (!texts) return <p className="muted">Loading menu…</p>;

  function edit(key, value) {
    setTexts((prev) => ({ ...prev, [key]: value }));
    setStatus('dirty');
  }

  async function handleSave() {
    setStatus('saving');
    /** @type {Record<string, Record<string, string[]>>} */
    const week = {};
    for (const day of DAYS) {
      week[day] = {};
      for (const meal of MEALS) {
        week[day][meal] = texts[`${day}.${meal}`]
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean);
      }
    }
    try {
      await api.put('/menu', { week });
      setStatus('saved');
    } catch (err) {
      setStatus(`save-failed: ${err.message}`);
    }
  }

  function loadDefault() {
    setTexts(textsFromWeek(DEFAULT_WEEK));
    setStatus('dirty');
  }

  return (
    <section className="card">
      <div className="editorHead">
        <div>
          <h2 style={{ marginBottom: 4 }}>This week's menu</h2>
          <p className="muted" style={{ margin: 0 }}>
            {status === 'dirty' && 'Unsaved changes'}
            {status === 'saving' && 'Saving…'}
            {status === 'saved' && `Saved ✓ — phones update shortly${loadedFromCloud ? '' : ' (first publish)'}`}
            {status.startsWith('save-failed') && `Save failed: ${status}`}
            {status.startsWith('load-failed') && `Couldn't reach the API (${status}) — editing local defaults.`}
            {status === '' && loadedFromCloud && 'Loaded from the server'}
          </p>
        </div>
        <div className="editorActions">
          <button className="ghost dark" onClick={loadDefault}>Load default week</button>
          <button
            className="primaryBtn"
            onClick={handleSave}
            disabled={status === 'saving' || status === 'saved'}>
            {status === 'saving' ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>

      {/* Day switcher */}
      <div className="dayTabs">
        {DAYS.map((d) => (
          <button
            key={d}
            className={activeDay === d ? 'active' : ''}
            onClick={() => setActiveDay(d)}>
            {DAY_LABELS[d].slice(0, 3)}
          </button>
        ))}
      </div>

      {/* Four meals for the active day */}
      <div className="meals">
        {MEALS.map((meal) => (
          <label key={meal} className="mealBlock">
            <span className="mealName">{MEAL_LABELS[meal]}</span>
            <textarea
              rows={Math.max(4, texts[`${activeDay}.${meal}`].split('\n').length + 1)}
              value={texts[`${activeDay}.${meal}`]}
              onChange={(e) => edit(`${activeDay}.${meal}`, e.target.value)}
              placeholder={'One dish per line'}
              spellCheck={false}
            />
          </label>
        ))}
      </div>
    </section>
  );
}
