import { toDateKey } from '@/shared/lib/date';

/**
 * STREAK RULES (pure domain — no React, no storage)
 *
 * A "check-in day" = a calendar day on which the student answered at least
 * one crowd feedback prompt.
 *
 * Current streak = consecutive check-in days ending at today… or yesterday.
 * The yesterday-grace means the streak doesn't die at midnight before you
 * get a chance to eat — it dies only after you miss a FULL day.
 *
 * NOT IMPLEMENTED YET (needs real leave data from the owner panel):
 * approved-leave days should pause the streak instead of breaking it.
 */

/** @typedef {string[]} CheckInDays Local day keys, e.g. ['2026-08-22','2026-08-23'] */

/** @typedef {{streak:number, checkedInToday:boolean}} StreakSummary */

/**
 * Counts consecutive check-in days ending today or yesterday.
 * @param {CheckInDays} checkInDays
 * @param {Date} [now]
 */
export function computeCurrentStreak(checkInDays, now = new Date()) {
  const days = new Set(checkInDays);
  let streak = 0;
  const cursor = new Date(now);

  if (!days.has(toDateKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1); // grace window
  }
  while (days.has(toDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/**
 * @param {CheckInDays} checkInDays
 * @param {Date} [now]
 */
export function hasCheckedInToday(checkInDays, now = new Date()) {
  return new Set(checkInDays).has(toDateKey(now));
}
