import { MEAL_SLOTS } from './menu-model';

/**
 * Structured serving windows (24h) — powers "starts in 42 min".
 * Display strings live in the repository; MACHINE times live here,
 * because you can't do math on '12:30 – 2:30 PM'.
 */
export const MEAL_SCHEDULE = {
  BREAKFAST: { startHour: 7, startMin: 30, endHour: 9, endMin: 30 },
  LUNCH: { startHour: 12, startMin: 30, endHour: 14, endMin: 30 },
  SNACKS: { startHour: 17, startMin: 0, endHour: 18, endMin: 0 },
  DINNER: { startHour: 19, startMin: 30, endHour: 21, endMin: 0 },
};

/** @typedef {{status:'SERVING'|'UPCOMING', slot:import('./menu-model').MealSlot, minutesUntil:number}} MealMoment */

/**
 * Where are we relative to today's meals?
 * SERVING wins over UPCOMING; after dinner rolls over to tomorrow's breakfast.
 * @param {Date} [now]
 * @returns {MealMoment}
 */
export function mealMomentFor(now = new Date()) {
  const minutesOfDay = now.getHours() * 60 + now.getMinutes();

  for (const slot of MEAL_SLOTS) {
    const w = MEAL_SCHEDULE[slot];
    const start = w.startHour * 60 + w.startMin;
    const end = w.endHour * 60 + w.endMin;
    if (minutesOfDay >= start && minutesOfDay < end) {
      return { status: 'SERVING', slot, minutesUntil: 0 };
    }
  }

  for (const slot of MEAL_SLOTS) {
    const w = MEAL_SCHEDULE[slot];
    const start = w.startHour * 60 + w.startMin;
    if (minutesOfDay < start) {
      return { status: 'UPCOMING', slot, minutesUntil: start - minutesOfDay };
    }
  }

  // Kitchen's closed — next stop is tomorrow's breakfast
  const bf = MEAL_SCHEDULE.BREAKFAST;
  return {
    status: 'UPCOMING',
    slot: 'BREAKFAST',
    minutesUntil: 24 * 60 - minutesOfDay + bf.startHour * 60 + bf.startMin,
  };
}

/** @param {number} mins */
export function formatStartsIn(mins) {
  if (mins <= 0) return 'serving now';
  if (mins < 60) return `in ${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `in ${h}h ${m}m` : `in ${h}h`;
}
