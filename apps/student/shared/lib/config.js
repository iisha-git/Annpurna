/**
 * App-level feature switches — flip before release.
 */

// Demo controls on Home (simulate GPS entry, owner override).
// TRUE while GPS/push aren't implemented, so anyone installing the APK
// can try the full crowd flow. Set to FALSE before the final release build.
export const SHOW_SIMULATION_TOOLS = true;
