import { CROWD_LEVELS } from './crowd-model';

/**
 * CROWD RULES — the brain of Annpurna, as pure functions.
 *
 * Agreed business rules:
 * 1. Only FRESH reports count (30 min validity, agreed default).
 * 2. Majority vote decides; ties resolve to the HIGHER level
 *    (conservative: never understate crowding).
 * 3. Fewer than MIN_RESPONSES → no level at all ("Not enough feedback yet").
 *    Honest UI beats fake confidence.
 * 4. Owner override always wins while active.
 */

/** How long a report stays valid. */
export const REPORT_VALIDITY_MS = 30 * 60 * 1000;

/** Below this many fresh responses, we show "not enough feedback". */
export const MIN_RESPONSES = 3;

/** Severity order — used for tie-breaking and comparisons. */
const SEVERITY = [CROWD_LEVELS.LOW, CROWD_LEVELS.MODERATE, CROWD_LEVELS.HIGH];

/**
 * Aggregate fresh reports into an automatic crowd signal.
 *
 * @param {Array<import('./crowd-model').CrowdReport>} reports
 * @param {number} now  Date.now() — passed in so tests are deterministic
 * @returns {{level: ?string, responseCount: number}}
 */
export function aggregateReports(reports, now) {
  const fresh = reports.filter((r) => now - r.createdAt < REPORT_VALIDITY_MS);

  if (fresh.length < MIN_RESPONSES) {
    return { level: null, responseCount: fresh.length };
  }

  const counts = { [CROWD_LEVELS.LOW]: 0, [CROWD_LEVELS.MODERATE]: 0, [CROWD_LEVELS.HIGH]: 0 };
  for (const r of fresh) counts[r.level] += 1;

  const maxCount = Math.max(...Object.values(counts));
  // Tie-break: pick the most severe level among those tied for max.
  const winner = [...SEVERITY].reverse().find((lvl) => counts[lvl] === maxCount);

  return { level: winner, responseCount: fresh.length };
}

/**
 * The single resolution point every student sees.
 *
 * @param {?{level:string}} ownerOverride  null when no override is active
 * @param {{level:?string, responseCount:number}} automatic
 * @returns {import('./crowd-model').CrowdStatus}
 */
export function resolveCrowdStatus(ownerOverride, automatic) {
  if (ownerOverride) {
    return {
      level: ownerOverride.level,
      origin: 'OWNER_OVERRIDE',
      responseCount: automatic.responseCount,
      updatedAt: new Date(),
    };
  }
  return {
    level: automatic.level,
    origin: 'AUTOMATIC',
    responseCount: automatic.responseCount,
    updatedAt: new Date(),
  };
}

/** Student-facing wait estimate per level (display copy, still a rule). */
export const WAIT_ESTIMATES = {
  LOW: 'Little to no wait',
  MODERATE: 'Around 10–15 min',
  HIGH: '20+ minutes',
};

/** Should I go right now? */
export const RECOMMENDATIONS = {
  LOW: 'Great time to visit the mess',
  MODERATE: 'Manageable — expect a short queue',
  HIGH: 'Consider waiting a bit before going',
};
