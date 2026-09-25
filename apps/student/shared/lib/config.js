/**
 * App-level feature switches — flip before release.
 */

// Demo controls on Home (simulate GPS entry, owner override).
// Set to FALSE for production/clean view.
export const SHOW_SIMULATION_TOOLS = true;

/**
 * Mess Hall Geofence coordinates.
 * Default radius in meters where student is considered inside the mess.
 */
export const DEFAULT_MESS_COORDINATES = {
  latitude: 19.616671066282116, // College hostel mess latitude
  longitude: 74.18486872523384, // College hostel mess longitude
  radiusMeters: 30,             // 30m radius around the mess hall
};

