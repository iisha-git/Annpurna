import { daysInMonth, isFutureDay } from '../domain/mess-status-model';

/**
 * MESS-STATUS REPOSITORY
 *
 * Business context: leave is recorded by the mess OWNER (on paper / owner panel).
 * Students only read their own monthly status here.
 *
 * Mock: deterministic fake data — everyone was present except a few
 * hardcoded approved leaves. Real backend replaces the internals later.
 */

// Approved leaves: "YYYY-MM": [days]
const MOCK_APPROVED_LEAVES = {
  // current-ish months get a few leaves; other months = full attendance
  5: [3, 4],   // June
  6: [17],     // July
  7: [11, 12, 13], // August
};

/**
 * @param {number} year
 * @param {number} month   0-based (0 = Jan)
 * @returns {Promise<{statuses: Object<number, import('../domain/mess-status-model').DayStatus>}>}
 */
export async function getMonthlyStatus(year, month) {
  await new Promise((r) => setTimeout(r, 500));

  const total = daysInMonth(year, month);
  const leaves = MOCK_APPROVED_LEAVES[month] ?? [];
  /** @type {Record<number, any>} */
  const statuses = {};

  for (let day = 1; day <= total; day++) {
    if (isFutureDay(year, month, day)) continue; // future days: no status
    statuses[day] = leaves.includes(day) ? 'APPROVED_LEAVE' : 'PRESENT';
  }
  return { statuses };
}

export const messStatusRepository = { getMonthlyStatus };
