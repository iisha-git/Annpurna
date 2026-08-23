/**
 * Shared date helpers.
 *
 * Dates are stored as LOCAL day keys ('YYYY-MM-DD'), never raw timestamps,
 * because concepts like "checked in today" must follow the phone's timezone.
 */

/** Formats a Date into a stable local-day key, e.g. '2026-08-23'. */
export function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
