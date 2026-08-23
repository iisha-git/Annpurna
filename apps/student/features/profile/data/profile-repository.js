import { isValidMessNumber } from '../domain/profile-model';

/**
 * PROFILE REPOSITORY — where "who is logged in?" comes from.
 *
 * Mock: one hardcoded student (auth doesn't exist yet — agreed placeholder).
 * Later: real backend returns the signed-in student; internals change,
 * contract stays.
 */

const CURRENT_STUDENT = {
  id: 'student-001',
  name: 'Isha Singh',
  messNumber: '042',
  course: 'B.Tech CSE',
  room: 'H-204',
};

/** Sanity-check our own mock data against the domain rule. */
if (!isValidMessNumber(CURRENT_STUDENT.messNumber)) {
  throw new Error('Mock student has an invalid mess number');
}

export async function getCurrentStudent() {
  await new Promise((r) => setTimeout(r, 400));
  return { ...CURRENT_STUDENT }; // return a copy — never share internal state
}

export const profileRepository = { getCurrentStudent };
