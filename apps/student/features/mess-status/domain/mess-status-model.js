/**
 * Mess-status domain vocabulary.
 *
 * Business rules (agreed):
 * - The mess OWNER records leave; students can only VIEW their status.
 * - Green dot = Present, Red dot = Approved Leave.
 * - Future days have no status at all.
 *
 * Pure calendar logic lives here so the UI stays dumb and testable.
 */

/** @typedef {'PRESENT'|'APPROVED_LEAVE'} DayStatus */

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** Week starts on Monday — consistent with the Menu day chips. */
export const WEEKDAY_INITIALS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

/**
 * How many days a given month has. month is 0-based (0 = January).
 * Day 0 of the NEXT month = last day of this month. Classic trick.
 * @param {number} year
 * @param {number} month
 */
export function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * How many blank cells before day 1 (Monday-first grid).
 * JS getDay(): Sun=0..Sat=6 → convert to Mon-first index.
 * @param {number} year
 * @param {number} month
 */
export function leadingBlanks(year, month) {
  const jsDay = new Date(year, month, 1).getDay(); // 0=Sun
  return (jsDay + 6) % 7;
}

/**
 * Is this date in the future relative to today?
 * @param {number} year
 * @param {number} month
 * @param {number} day
 */
export function isFutureDay(year, month, day) {
  const then = new Date(year, month, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return then > today;
}
