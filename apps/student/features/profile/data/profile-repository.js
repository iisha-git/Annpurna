import { api } from '@/shared/lib/api';

/**
 * PROFILE REPOSITORY — where "who is logged in?" comes from.
 *
 * The API returns the signed-in student (from the session JWT) plus their
 * roster details. Field names are mapped here to the UI contract so the
 * screen below never changes.
 */

/** @param {any} s */
function toProfileView(s) {
  const course = [s.year, s.branch].filter(Boolean).join(' ');
  return {
    name: s.name,
    messNumber: s.messNumber,
    course: course || '—',
    room: s.room || '—',
  };
}

export async function getCurrentStudent() {
  const { student } = await api.get('/students/me');
  return toProfileView(student);
}

export const profileRepository = { getCurrentStudent };