/**
 * Crowd domain vocabulary.
 *
 * Pure data and rules ONLY — no React, no network calls, no GPS specifics.
 * The UI consumes CrowdStatus; where it came from (simulated source today,
 * geofence pipeline tomorrow) is invisible to it by design.
 */

/** @typedef {'LOW' | 'MODERATE' | 'HIGH'} CrowdLevel */
/** @typedef {'AUTOMATIC' | 'OWNER_OVERRIDE'} CrowdOrigin */

export const CROWD_LEVELS = {
  LOW: 'LOW',
  MODERATE: 'MODERATE',
  HIGH: 'HIGH',
};

/**
 * The single final crowd status consumed by student UI.
 *
 * @typedef {Object} CrowdStatus
 * @property {CrowdLevel} level
 * @property {CrowdOrigin} origin   OWNER_OVERRIDE always wins while active
 * @property {number} responseCount valid reports behind an AUTOMATIC status
 * @property {Date} updatedAt
 */

/**
 * One student's one-tap answer during one mess visit.
 * visitId makes "one response per visit" enforceable.
 *
 * @typedef {Object} CrowdReport
 * @property {string} id
 * @property {string} studentId
 * @property {string} visitId
 * @property {CrowdLevel} level
 * @property {Date} createdAt
 */

/**
 * A student's presence inside the mess geofence.
 *
 * @typedef {Object} MessVisit
 * @property {string} id
 * @property {string} studentId
 * @property {Date} enteredAt
 * @property {?Date} exitedAt
 * @property {boolean} reportSubmitted
 */
