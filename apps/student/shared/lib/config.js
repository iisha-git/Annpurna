/**
 * App-level feature switches — flip before release.
 */

// Demo controls on Home (simulate GPS entry, owner override).
// Set to FALSE for production/clean view.
export const SHOW_SIMULATION_TOOLS = false;

/**
 * Mess Hall Geofence coordinates.
 * Default radius in meters where student is considered inside the mess.
 */
export const DEFAULT_MESS_COORDINATES = {
  latitude: 18.5204, // Default college campus / hostel mess latitude
  longitude: 73.8567, // Default college campus / hostel mess longitude
  radiusMeters: 40,   // 40m radius around the mess hall
};

