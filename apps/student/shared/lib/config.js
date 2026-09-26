/**
 * App-level feature switches — flip before release.
 */

// Demo controls on Home (simulate GPS entry, owner override).
// Set to FALSE for production/clean view.
export const SHOW_SIMULATION_TOOLS = false;

/**
 * Mess Hall Geofence zones.
 * Each zone represents a GPS coordinate with a radius (in meters) within which
 * a student is considered to be inside the mess hall.
 * Being inside ANY of these zones counts as "in the mess".
 */
export const MESS_GEOFENCE_ZONES = [
  {
    identifier: 'annpurna_mess_zone_1',
    latitude: 19.6166052,
    longitude: 74.1841384,
    radiusMeters: 10,
  },
];

/**
 * @deprecated Use MESS_GEOFENCE_ZONES instead.
 * Kept for backward compatibility with any code referencing DEFAULT_MESS_COORDINATES.
 */
export const DEFAULT_MESS_COORDINATES = {
  ...MESS_GEOFENCE_ZONES[0],
  radiusMeters: MESS_GEOFENCE_ZONES[0].radiusMeters,
};

