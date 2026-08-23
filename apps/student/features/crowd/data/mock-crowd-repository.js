import { CROWD_LEVELS } from '../domain/crowd-model';
import { REPORT_VALIDITY_MS, aggregateReports, resolveCrowdStatus } from '../domain/crowd-rules';
import { toDateKey } from '@/shared/lib/date';

/**
 * MOCK CROWD ENGINE — stands in for the whole real-world pipeline:
 *
 *   GPS entry → visit recorded → 10-min delay → push notification
 *   → one-tap response → aggregation → CrowdStatus
 *                          ↑ owner override overrides everything
 *
 * What is simulated here today (agreed scope):
 * - "Entering the mess"      → enterMess() called by a dev button
 * - The 10-min delay         → compressed to ~8s
 * - Push notification        → in-app prompt UI driven by `feedbackPending`
 * - Other students' responses→ synthetic reports on a timer
 *
 * When the real backend/GPS/notifications arrive, ONLY this file changes.
 */

const FEEDBACK_DELAY_MS = 8000; // real version ≈ 10 minutes
const TICK_MS = 12000;          // how often fake activity happens

const CURRENT_STUDENT_ID = 'student-001';

// ---------------------------------------------------------------------------
// Internal state
// ---------------------------------------------------------------------------
let visitSeq = 1;
/** @type {?{id:string, enteredAt:number, reportSubmitted:boolean}} */
let myVisit = null;
let feedbackPending = false;
let promptTimer = null;

/** @type {Array<import('../domain/crowd-model').CrowdReport>} */
let reports = [];

/**
 * Calendar days on which I answered a crowd prompt (drives the streak).
 * Unlike crowd reports these never expire — a check-in day is forever.
 * NOTE: in-memory for now; the real backend will persist this.
 * @type {Set<string>}
 */
const myCheckInDays = new Set();

/** @type {?{level:string}} */
let ownerOverride = null;

const listeners = new Set();

// Fake students "inside the mess" right now.
const FAKE_STUDENTS = Array.from({ length: 14 }, (_, i) => `fake-${i + 1}`);

function randomLevel() {
  const r = Math.random();
  if (r < 0.35) return CROWD_LEVELS.LOW;
  if (r < 0.8) return CROWD_LEVELS.MODERATE;
  return CROWD_LEVELS.HIGH;
}

// ---------------------------------------------------------------------------
// Seeding — the mess starts with history so the card isn't empty on launch
// ---------------------------------------------------------------------------
(function seed() {
  const now = Date.now();
  for (const studentId of FAKE_STUDENTS) {
    reports.push({
      id: `seed-${studentId}`,
      studentId,
      visitId: `seeded-visit-${studentId}`,
      level: randomLevel(),
      createdAt: now - Math.random() * 25 * 60 * 1000, // spread over last 25 min
    });
  }
})();

// ---------------------------------------------------------------------------
// Live simulation — fake students keep responding; stale reports expire
// ---------------------------------------------------------------------------
setInterval(() => {
  const now = Date.now();
  reports = reports.filter((r) => now - r.createdAt < REPORT_VALIDITY_MS);

  const burstCount = Math.floor(Math.random() * 3); // 0–2 responses per tick
  for (let i = 0; i < burstCount; i++) {
    const studentId = FAKE_STUDENTS[Math.floor(Math.random() * FAKE_STUDENTS.length)];
    reports.push({
      id: `${studentId}-${now}-${i}`,
      studentId,
      visitId: 'synthetic',
      level: randomLevel(),
      createdAt: now,
    });
  }
  emit();
}, TICK_MS);

// ---------------------------------------------------------------------------
// Public API — this is what the repository contract looks like
// ---------------------------------------------------------------------------

/** Simulates the geofence detecting that I walked into the mess. */
export function enterMess() {
  if (myVisit) return; // already inside
  myVisit = { id: `visit-${visitSeq++}`, enteredAt: Date.now(), reportSubmitted: false };

  // Real version: expo-notifications fires AFTER ~10 min of presence.
  promptTimer = setTimeout(() => {
    feedbackPending = true;
    emit();
  }, FEEDBACK_DELAY_MS);
  emit();
}

/** One-tap answer. Enforces one response per visit at the data layer. */
export function submitFeedback(level) {
  if (!myVisit || myVisit.reportSubmitted || !feedbackPending) return false;
  clearTimeout(promptTimer);
  myVisit.reportSubmitted = true;
  feedbackPending = false;
  myCheckInDays.add(toDateKey(new Date())); // streak record
  reports.push({
    id: `me-${Date.now()}`,
    studentId: CURRENT_STUDENT_ID,
    visitId: myVisit.id,
    level,
    createdAt: Date.now(),
  });
  emit();
  return true;
}

/** Simulates walking out (dev convenience / reset). */
export function leaveMess() {
  if (promptTimer) clearTimeout(promptTimer);
  myVisit = null;
  feedbackPending = false;
  emit();
}

// Owner-panel powers (used by the override demo buttons)
export function setOwnerOverride(level) {
  ownerOverride = { level };
  emit();
}
export function clearOwnerOverride() {
  ownerOverride = null;
  emit();
}

/**
 * Immutable-ish snapshot of everything the UI needs.
 * Recomputed fresh on every read — no stale copies anywhere.
 */
export function getSnapshot() {
  const automatic = aggregateReports(reports, Date.now());
  return {
    status: resolveCrowdStatus(ownerOverride, automatic),
    hasActiveVisit: Boolean(myVisit),
    canSubmitFeedback: Boolean(myVisit && !myVisit.reportSubmitted),
    feedbackPending,
    checkInDates: [...myCheckInDays],
  };
}

/** Subscribe to live updates. Returns an unsubscribe function. */
export function subscribe(listener) {
  listeners.add(listener);
  listener(getSnapshot());
  return () => listeners.delete(listener);
}

function emit() {
  const snap = getSnapshot();
  listeners.forEach((fn) => fn(snap));
}

/** Dev-only full reset. */
export function resetSimulation() {
  leaveMess();
  ownerOverride = null;
  emit();
}
