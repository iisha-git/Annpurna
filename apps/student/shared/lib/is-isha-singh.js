export const ISHA_PHONE_NUMBER = '7020822465';

/**
 * Checks whether the given student profile belongs to Isha Singh.
 * Matches by verified mobile number (7020822465) or name ("Isha Singh" / "Isha").
 *
 * @param {{ name?: string, mobile?: string } | null | undefined} student
 * @returns {boolean}
 */
export function isIshaSingh(student) {
  if (!student) return false;

  // Match by registered mobile number
  const mobile = String(student.mobile || '').replace(/\D/g, '');
  if (mobile.includes(ISHA_PHONE_NUMBER)) return true;

  // Match by name
  const name = String(student.name || '').trim().toLowerCase();
  if (name.includes('isha singh') || name === 'isha') return true;

  return false;
}
