export const ISHA_PHONE_NUMBER = '7020822465';
export const ISHA_MESS_NUMBER = '164';

/**
 * Checks whether the given student profile belongs to Isha Singh.
 * Matches by:
 * 1. Mess number (164 — SINGH ISHA)
 * 2. Mobile number (7020822465)
 * 3. Name (supports "SINGH ISHA", "ISHA SINGH", or "ISHA")
 *
 * @param {{ name?: string, mobile?: string, messNumber?: string | number, id?: string | number } | null | undefined} student
 * @returns {boolean}
 */
export function isIshaSingh(student) {
  if (!student) return false;

  // 1. Match by Mess Number (Mess 164 is SINGH ISHA)
  const mess = String(student.messNumber ?? student.id ?? '').trim();
  if (mess === ISHA_MESS_NUMBER) return true;

  // 2. Match by registered mobile number
  const mobile = String(student.mobile || '').replace(/\D/g, '');
  if (mobile.includes(ISHA_PHONE_NUMBER)) return true;

  // 3. Match by name in any word order ("SINGH ISHA" or "ISHA SINGH")
  const name = String(student.name || '').trim().toLowerCase();
  if (name.includes('isha') && (name.includes('singh') || name === 'isha')) return true;

  return false;
}
