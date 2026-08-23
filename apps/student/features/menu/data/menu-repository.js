import { MEAL_SLOTS, WEEKDAYS } from '../domain/menu-model';

/**
 * MENU REPOSITORY — the ONLY place the app asks "what's the menu?"
 *
 * Today: a mock that returns hardcoded weekly data after a fake delay,
 * so loading states are realistic during development.
 *
 * Tomorrow: swap the internals for real API calls (or Firestore, etc.).
 * The UI and this contract stay untouched — that's the architecture paying off.
 */

const MEAL_TIMES = {
  BREAKFAST: '7:30 – 9:30 AM',
  LUNCH: '12:30 – 2:30 PM',
  SNACKS: '5:00 – 6:00 PM',
  DINNER: '7:30 – 9:00 PM',
};

/** Weekly mess menu — will come from the owner panel later. */
const WEEKLY_MENU = {
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

function simulateLatency(ms = 600) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Returns the full week: { MON: DayMenu, ... }
 * @returns {Promise<Object<import('../domain/menu-model').Weekday, import('../domain/menu-model').DayMenu>>}
 */
export async function getWeeklyMenu() {
  await simulateLatency();

  /** @type {Record<string, any>} */
  const week = {};
  for (const day of WEEKDAYS) {
    week[day] = {
      day,
      meals: MEAL_SLOTS.map((slot) => ({
        slot,
        time: MEAL_TIMES[slot],
        items: WEEKLY_MENU[day][slot],
      })),
    };
  }
  return week;
}

/** Repository object — screens/hooks talk to THIS, never to raw data. */
export const menuRepository = { getWeeklyMenu };
