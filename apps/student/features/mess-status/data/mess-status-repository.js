import { daysInMonth, isFutureDay } from '../domain/mess-status-model';
import { api } from '@/shared/lib/api';

/**
 * MESS-STATUS REPOSITORY
 *
 * Business context: leave is recorded by the mess OWNER (owner panel).
 * Students only read their own approved annual leaves from the API and the
 * screen turns them into a month-by-month attendance view.
 */

/** @type {Record<number, any>} */
function toStatusMap(datesForMonth, year, month) {
  const total = daysInMonth(year, month);
  const leaves = new Set(datesForMonth);
  /** @type {Record<number, any>} */
  const statuses = {};
  for (let day = 1; day <= total; day++) {
    if (isFutureDay(year, month, day)) continue; // future days: no status
    statuses[day] = leaves.has(day) ? 'APPROVED_LEAVE' : 'PRESENT';
  }
  return statuses;
}

/**
 * @param {number} year
 * @param {number} month   0-based (0 = Jan)
 * @returns {Promise<{statuses: Object<number, import('../domain/mess-status-model').DayStatus>}>}
 */
export async function getMonthlyStatus(year, month) {
  const { dates } = await api.get('/leaves/mine'); // ["YYYY-MM-DD", ...]
  const prefix = `${year}-${String(month + 1).padStart(2, '0')}-`;
  const days = dates
    .filter((d) => d.startsWith(prefix))
    .map((d) => Number(d.slice(prefix.length)));

  return { statuses: toStatusMap(days, year, month) };
}

export const messStatusRepository = { getMonthlyStatus };