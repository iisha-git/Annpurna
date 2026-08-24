import { doc, getDoc, onSnapshot } from 'firebase/firestore';

import { db } from '@/shared/lib/firebase';
import { MEAL_SLOTS, WEEKDAYS } from '../domain/menu-model';

/**
 * MENU REPOSITORY — the ONLY place the app asks "what's the menu?"
 *
 * LIVE from Firestore: one document (`menus/current`) holds the whole
 * week. The owner panel edits it; every open phone updates instantly
 * through onSnapshot — no pull-to-refresh needed.
 *
 * If the document doesn't exist yet (fresh project), we fall back to the
 * built-in week below so the app never shows an empty screen.
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

/** Firestore path of the single menu document. */
export const MENU_DOC_PATH = ['menus', 'current'];

/** Firestore stores {MON:{BREAKFAST:[...],...}} → shape it for the UI contract. */
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

function menuRef() {
  return doc(db, ...MENU_DOC_PATH);
}

/**
 * Live subscription — fires immediately with current state, then again on
 * EVERY owner edit. Returns an unsubscribe function.
 */
export function subscribeToWeeklyMenu(onData, onError) {
  return onSnapshot(
    menuRef(),
    (snap) => onData(shapeWeek(snap.exists() ? snap.data() : DEFAULT_WEEKLY_MENU)),
    (err) => {
      console.warn('[menu] live read failed:', err.code);
      if (onError) onError(err);
      onData(shapeWeek(DEFAULT_WEEKLY_MENU)); // degrade gracefully, never blank
    }
  );
}

/** One-time read (kept for compatibility with anything that prefers a promise). */
export async function getWeeklyMenu() {
  const snap = await getDoc(menuRef());
  return snap.exists() ? shapeWeek(snap.data()) : shapeWeek(DEFAULT_WEEKLY_MENU);
}

/** Repository object — screens/hooks talk to THIS, never to Firestore directly. */
export const menuRepository = { getWeeklyMenu, subscribeToWeeklyMenu };
