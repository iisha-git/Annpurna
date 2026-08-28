import { api } from '@/shared/lib/api';
import { MEAL_SLOTS, WEEKDAYS } from '../domain/menu-model';

/**
 * MENU REPOSITORY — the ONLY place the app asks "what's the menu?"
 *
 * POLLS the API every 5s: one menu doc holds the whole week, the owner
 * panel edits it, and each open phone picks up the change within a few
 * seconds of a save. If the server is unreachable we keep showing the last
 * good week — and fall back to the built-in week below if we never
 * managed to fetch anything (fresh install, owner not yet online).
 */

const MEAL_TIMES = {
  BREAKFAST: '7:30 – 9:30 AM',
  LUNCH: '12:30 – 2:30 PM',
  SNACKS: '5:00 – 6:00 PM',
  DINNER: '7:30 – 9:00 PM',
};

/** Seed + offline fallback — the same week the mock used to serve. */
export const DEFAULT_WEEKLY_MENU = {
  MON: {
    BREAKFAST: ['Poha', 'Boiled Eggs', 'Banana', 'Tea'],
    LUNCH: ['Chapati', 'Dal Tadka', 'Aloo Bhujia', 'Rice', 'Curd'],
    SNACKS: ['Samosa', 'Tea'],
    DINNER: ['Chapati', 'Mix Veg Sabzi', 'Paneer Butter Masala', 'Rice', 'Gulab Jamun'],
  },
  TUE: {
    BREAKFAST: ['Idli', 'Sambar', 'Coconut Chutney', 'Milk'],
    LUNCH: ['Chapati', 'Rajma', 'Jeera Rice', 'Salad'],
    SNACKS: ['Bread Pakora', 'Tea'],
    DINNER: ['Chapati', 'Chicken Curry / Soya Chaap', 'Rice', 'Kheer'],
  },
  WED: {
    BREAKFAST: ['Aloo Paratha', 'Curd', 'Green Chutney', 'Tea'],
    LUNCH: ['Chapati', 'Chole', 'Rice', 'Onion Salad'],
    SNACKS: ['Maggi', 'Coffee'],
    DINNER: ['Chapati', 'Egg Curry / Malai Kofta', 'Dal Fry', 'Rice'],
  },
  THU: {
    BREAKFAST: ['Upma', 'Sprouts Salad', 'Tea'],
    LUNCH: ['Chapati', 'Kadhi Pakora', 'Rice', 'Papad'],
    SNACKS: ['Vada Pav', 'Fried Chilli', 'Tea'],
    DINNER: ['Chapati', 'Veg Biryani', 'Mirchi ka Salan', 'Raita'],
  },
  FRI: {
    BREAKFAST: ['Masala Dosa', 'Sambar', 'Chutney', 'Milk'],
    LUNCH: ['Chapati', 'Dal Makhani', 'Steamed Rice', 'Salad'],
    SNACKS: ['Pav Bhaji', 'Tea'],
    DINNER: ['Chapati', 'Shahi Paneer', 'Veg Pulao', 'Ice Cream'],
  },
  SAT: {
    BREAKFAST: ['Puri', 'Chana Masala', 'Sooji Halwa', 'Tea'],
    LUNCH: ['Chapati', 'Aloo Gobhi', 'Dal', 'Rice', 'Curd'],
    SNACKS: ['French Fries', 'Ketchup', 'Coffee'],
    DINNER: ['Chapati', 'Egg Bhurji / Paneer Bhurji', 'Dal Tadka', 'Rice'],
  },
  SUN: {
    BREAKFAST: ['Sandwich', 'Corn Flakes', 'Boiled Eggs', 'Tea'],
    LUNCH: ['Special Thali', 'Chapati', '2 Sabzi', 'Dal', 'Rice', 'Sweet'],
    SNACKS: ['Bhel Puri', 'Tea'],
    DINNER: ['Chapati', 'Veg Kolhapuri', 'Dal Fry', 'Jeera Rice', 'Gulab Jamun'],
  },
};

/** API stores {MON:{BREAKFAST:[...],...}} → shape it for the UI contract. */
function shapeWeek(raw) {
  /** @type {Record<string, any>} */
  const week = {};
  for (const day of WEEKDAYS) {
    const dayData = raw?.[day];
    week[day] = {
      day,
      meals: MEAL_SLOTS.map((slot) => ({
        slot,
        time: MEAL_TIMES[slot],
        items: Array.isArray(dayData?.[slot]) ? dayData[slot] : [],
      })),
    };
  }
  return week;
}

/**
 * Live polling — fires immediately with the current week, then refreshes
 * on every poll tick. Returns an unsubscribe function.
 */
export function subscribeToWeeklyMenu(onData, onError) {
  let alive = true;
  let hasData = false;

  const tick = async () => {
    try {
      const { week } = await api.get('/menu');
      if (!alive) return;
      hasData = true;
      onData(shapeWeek(week));
    } catch (err) {
      if (!alive) return;
      // Never blank the screen: keep last good week, seed on first load.
      if (!hasData) {
        onData(shapeWeek(DEFAULT_WEEKLY_MENU));
        if (onError) onError(err);
      }
    }
  };

  tick();
  const timer = setInterval(tick, 5000);
  return () => {
    alive = false;
    clearInterval(timer);
  };
}

/** One-time read (kept for compatibility with anything that prefers a promise). */
export async function getWeeklyMenu() {
  try {
    const { week } = await api.get('/menu');
    return shapeWeek(week);
  } catch {
    return shapeWeek(DEFAULT_WEEKLY_MENU);
  }
}

/** Repository object — screens/hooks talk to THIS, never to the API directly. */
export const menuRepository = { getWeeklyMenu, subscribeToWeeklyMenu };