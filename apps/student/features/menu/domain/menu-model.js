/**
 * Menu domain vocabulary.
 *
 * The mess menu repeats weekly (typical for hostel messes), so a "menu"
 * is 7 DayMenus keyed MON..SUN. Pure data — no UI, no storage here.
 */

/** @typedef {'MON'|'TUE'|'WED'|'THU'|'FRI'|'SAT'|'SUN'} Weekday */

/** Canonical day order — UI and data both rely on this. */
export const WEEKDAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

/** @typedef {'BREAKFAST'|'LUNCH'|'SNACKS'|'DINNER'} MealSlot */

/** Display order of meals within a day. */
export const MEAL_SLOTS = ['BREAKFAST', 'LUNCH', 'SNACKS', 'DINNER'];

export const MEAL_LABELS = {
  BREAKFAST: 'Breakfast',
  LUNCH: 'Lunch',
  SNACKS: 'Evening Snacks',
  DINNER: 'Dinner',
};

/**
 * @typedef {Object} Meal
 * @property {MealSlot} slot
 * @property {string} time    e.g. '7:30 – 9:30 AM'
 * @property {string[]} items
 */

/**
 * @typedef {Object} DayMenu
 * @property {Weekday} day
 * @property {Meal[]} meals   ordered per MEAL_SLOTS
 */

/**
 * Maps JS Date weekday (0=Sun..6=Sat) to our Weekday key.
 * @param {Date} date
 * @returns {Weekday}
 */
export function weekdayKeyFor(date) {
  return ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][date.getDay()];
}
