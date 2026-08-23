/**
 * Profile domain vocabulary.
 *
 * Business rule: every student gets a unique 2–3 digit mess number,
 * assigned by the mess OWNER. Students can see it but never change it.
 */

/**
 * @typedef {Object} Student
 * @property {string} id
 * @property {string} name
 * @property {string} messNumber   2–3 digits, e.g. '042' — owner-assigned
 * @property {string} [course]
 * @property {string} [room]
 */

/**
 * The mess-number rule, in exactly one place.
 * @param {string} value
 * @returns {boolean}
 */
export function isValidMessNumber(value) {
  return /^\d{2,3}$/.test(value);
}

/**
 * Initials for the avatar circle.
 * @param {string} fullName
 */
export function initialsFor(fullName) {
  return fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}
