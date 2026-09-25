import { useEffect, useState } from 'react';
import { api } from './api';
import { DAYS, DAY_LABELS, DEFAULT_WEEK, MEALS, MEAL_LABELS } from './menuData';
import { FoodLoader, Icon } from './ui';

/**
 * WEEK'S MENU EDITOR — one MongoDB menu doc ("current") holds the week.
 * Editing model: each meal is a plain textarea, ONE DISH PER LINE. Students'
 * phones poll the API and pick up changes.
 */

const MEAL_ICON = { BREAKFAST: 'flame', LUNCH: 'wheat', SNACKS: 'star', DINNER: 'book' };
const MEAL_TONE = {
  BREAKFAST: 'tone-amber', LUNCH: 'tone-green', SNACKS: 'tone-violet', DINNER: 'tone-blue',
};

function textsFromWeek(week) {
  const t = {};
  for (const day of DAYS) {
    for (const meal of MEALS) {
      t[`${day}.${meal}`] = (week[day]?.[meal] ?? []).join('\n');
    }
  }
  return t;
}

function statusMeta(status, loadedFromCloud) {
  if (status === 'dirty') return { label: 'Unsaved changes', tone: 'dirty' };
  if (status === 'saving') return { label: 'Saving…', tone: 'saving' };
  if (status === 'saved') return { label: loadedFromCloud ? 'Saved — live on phones' : 'Saved (first publish)', tone: 'saved' };
  if (status.startsWith('save-failed')) return { label: 'Save failed — try again', tone: 'error' };
  if (status.startsWith('load-failed')) return { label: 'Offline — editing defaults', tone: 'error' };
  if (loadedFromCloud) return { label: 'Loaded from server', tone: 'neutral' };
  return { label: 'Defaults', tone: 'neutral' };
}

function MealCard({ meal, value, onChange }) {
  const count = value.split('\n').filter((l) => l.trim()).length;
  return (
    <div className="meal">
      <div className="meal-head">
        <span className="meal-name">
          <span className={`meal-dot ${MEAL_TONE[meal]}`}><Icon name={MEAL_ICON[meal]} size={15} /></span>
          {MEAL_LABELS[meal]}
        </span>
        <span className="meal-count">{count} {count === 1 ? 'dish' : 'dishes'}</span>
      </div>
      <textarea
        rows={Math.max(4, value.split('\n').length + 1)}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="One dish per line"
        spellCheck={false}
        aria-label={MEAL_LABELS[meal]}
      />
    </div>
  );
}

export default function MenuEditor() {
  const [texts, setTexts] = useState(null); // null = still loading
  const [activeDay, setActiveDay] = useState('MON');
  const [status, setStatus] = useState('');
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
        setStatus(`load-failed: ${err.message}`);
        setTexts(textsFromWeek(DEFAULT_WEEK));
      });
  }, []);

  if (!texts) {
    return (
      <div className="page-load" aria-live="polite">
        <FoodLoader />
        <p>Stirring today's menu…</p>
      </div>
    );
  }

  function edit(key, value) {
    setTexts((prev) => ({ ...prev, [key]: value }));
    setStatus('dirty');
  }

  async function handleSave() {
    setStatus('saving');
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

  const meta = statusMeta(status, loadedFromCloud);
  const today = DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];

  return (
    <section className="card">
      <div className="card-head">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <h3>This week's menu</h3>
          <span className={`status-chip ${meta.tone}`}>{meta.label}</span>
        </div>
        <div className="toolbar-r">
          <button className="btn btn-ghost" onClick={loadDefault}>
            <Icon name="refresh" size={14} /> Load default week
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={status === 'saving' || status === 'saved'}>
            <Icon name="check" size={15} />
            {status === 'saving' ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>

      <div className="daytabs" role="tablist" aria-label="Pick a day">
        {DAYS.map((d) => (
          <button
            key={d}
            role="tab"
            aria-selected={activeDay === d}
            className={`daytab ${activeDay === d ? 'active' : ''}`}
            onClick={() => setActiveDay(d)}>
            {DAY_LABELS[d].slice(0, 3)}
            <small>{d === today ? 'Today' : DAY_LABELS[d].slice(0, 3)}</small>
          </button>
        ))}
      </div>

      <div className="meals">
        {MEALS.map((meal) => (
          <MealCard
            key={meal}
            meal={meal}
            value={texts[`${activeDay}.${meal}`]}
            onChange={(v) => edit(`${activeDay}.${meal}`, v)}
          />
        ))}
      </div>
    </section>
  );
}