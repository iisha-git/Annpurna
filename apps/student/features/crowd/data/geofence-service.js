import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { MESS_GEOFENCE_ZONES, DEFAULT_MESS_COORDINATES } from '@/shared/lib/config';
import { enterMess, leaveMess } from './crowd-repository';
import { GEOFENCE_BACKGROUND_TASK } from './background-geofence-task';

/**
 * GEOFENCE SERVICE
 * Tracks student's GPS position in relation to the Mess Hall perimeter.
 * Supports multi-zone geofencing — student is considered inside the mess
 * if they are within the radius of ANY configured zone.
 * Supports both live Foreground position watching and 24/7 OS-level Background Geofencing.
 */

/** All configured mess geofence zones */
let messZones = MESS_GEOFENCE_ZONES.map((z) => ({ ...z }));

/** Backward-compat reference — points to primary zone */
let messCoords = { ...DEFAULT_MESS_COORDINATES };
let currentCoords = null;
let currentDistance = null;
let isInside = false;
let permissionStatus = 'undetermined'; // 'undetermined' | 'granted' | 'denied'
let backgroundStatus = 'inactive'; // 'active' | 'inactive' | 'denied' | 'unsupported'
let errorMessage = null;
let locationWatcher = null;
const listeners = new Set();

/** Haversine formula to compute great-circle distance between two GPS points in meters */
export function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  const R = 6371e3; // meters
  const toRad = (d) => (d * Math.PI) / 180;
  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);
  const deltaPhi = toRad(lat2 - lat1);
  const deltaLambda = toRad(lon2 - lon1);

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // full precision — critical for 10m zone boundary checks
}

export function getGeofenceSnapshot() {
  return {
    messCoords,
    currentCoords,
    distance: currentDistance,
    isInside,
    permissionStatus,
    backgroundStatus,
    error: errorMessage,
  };
}

function emit() {
  const snap = getGeofenceSnapshot();
  listeners.forEach((fn) => fn(snap));
}

/**
 * Returns the shortest distance (in meters) from the given coords to ANY mess zone.
 * Also returns which zone is closest.
 */
function closestZoneDistance(lat, lon) {
  let minDist = Infinity;
  let closestZone = messZones[0];
  for (const zone of messZones) {
    const d = calculateDistanceMeters(lat, lon, zone.latitude, zone.longitude);
    if (d !== null && d < minDist) {
      minDist = d;
      closestZone = zone;
    }
  }
  return { distance: minDist === Infinity ? null : minDist, zone: closestZone };
}

/** Returns true if student is inside the radius of ANY configured mess zone */
function isInsideAnyZone(lat, lon, accuracy) {
  // Allow up to 60m horizontal accuracy to account for indoor GPS signal degradation
  const isAccurate = accuracy == null || accuracy <= 60;
  if (!isAccurate) return false;
  return messZones.some((zone) => {
    const d = calculateDistanceMeters(lat, lon, zone.latitude, zone.longitude);
    return d !== null && d <= zone.radiusMeters;
  });
}

function updateLocation(coords) {
  currentCoords = {
    latitude: coords.latitude,
    longitude: coords.longitude,
    accuracy: coords.accuracy,
  };

  // Distance to closest zone (used for UI display)
  const { distance } = closestZoneDistance(coords.latitude, coords.longitude);
  currentDistance = distance;

  const nowInside = isInsideAnyZone(coords.latitude, coords.longitude, coords.accuracy);

  if (nowInside && !isInside) {
    isInside = true;
    enterMess();
  } else if (!nowInside && isInside) {
    isInside = false;
    leaveMess();
  }

  emit();
}

/** Check if background geofencing is currently registered with OS */
export async function syncBackgroundStatus() {
  try {
    if (!Location.hasStartedGeofencingAsync) {
      backgroundStatus = 'unsupported';
      emit();
      return false;
    }

    const isRunning = await Location.hasStartedGeofencingAsync(GEOFENCE_BACKGROUND_TASK);
    backgroundStatus = isRunning ? 'active' : 'inactive';
    emit();
    return isRunning;
  } catch (err) {
    console.warn('[Geofence] Could not check background geofence status:', err.message);
    backgroundStatus = 'inactive';
    emit();
    return false;
  }
}

/** Register 24/7 Background Geofencing with Android/iOS OS */
export async function startBackgroundGeofencing() {
  try {
    // 1. Foreground location permission
    const fg = await Location.requestForegroundPermissionsAsync();
    if (fg.status !== 'granted') {
      backgroundStatus = 'denied';
      errorMessage = 'Location permission is required for background geofencing.';
      emit();
      return false;
    }

    // 2. Background location permission ("Allow all the time")
    if (Location.requestBackgroundPermissionsAsync) {
      const bg = await Location.requestBackgroundPermissionsAsync();
      if (bg.status !== 'granted') {
        backgroundStatus = 'denied';
        errorMessage = 'Background location ("Allow all the time") is required for 24/7 geofencing.';
        emit();
        return false;
      }
    }

    // 3. Notification permission (for local alerts on entry)
    try {
      await Notifications.requestPermissionsAsync();
    } catch {
      /* ignore if fails on web */
    }

    // 4. Register all mess zones with the OS
    if (Location.startGeofencingAsync) {
      const regions = messZones.map((zone) => ({
        identifier: zone.identifier,
        latitude: zone.latitude,
        longitude: zone.longitude,
        radius: zone.radiusMeters,
        notifyOnEnter: true,
        notifyOnExit: true,
      }));
      await Location.startGeofencingAsync(GEOFENCE_BACKGROUND_TASK, regions);
      backgroundStatus = 'active';
      errorMessage = null;
      console.log(`[Geofence] 24/7 background geofencing registered for ${regions.length} zones (${regions[0].radius}m radius each).`);
    } else {
      backgroundStatus = 'unsupported';
    }

    emit();
    return true;
  } catch (err) {
    console.error('[Geofence] Error starting background geofence:', err);
    backgroundStatus = 'inactive';
    errorMessage = err.message || 'Failed to start background geofencing';
    emit();
    return false;
  }
}

/** Stop 24/7 Background Geofencing */
export async function stopBackgroundGeofencing() {
  try {
    if (Location.stopGeofencingAsync) {
      const isRunning = await Location.hasStartedGeofencingAsync(GEOFENCE_BACKGROUND_TASK);
      if (isRunning) {
        await Location.stopGeofencingAsync(GEOFENCE_BACKGROUND_TASK);
      }
    }
    backgroundStatus = 'inactive';
    emit();
  } catch (err) {
    console.warn('[Geofence] Error stopping background geofencing:', err);
  }
}

/** Initialize and start watching foreground position */
export async function startGeofencing() {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    permissionStatus = status;

    if (status !== 'granted') {
      errorMessage = 'Location permission denied. Geofence requires location access.';
      emit();
      return false;
    }

    errorMessage = null;

    // Get initial fix
    try {
      const initial = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      });
      if (initial?.coords) {
        updateLocation(initial.coords);
      }
    } catch {
      // initial fix timeout/error, watcher will catch up
    }

    // Start live tracking
    if (!locationWatcher) {
      locationWatcher = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Highest,
          timeInterval: 2000,
          distanceInterval: 1,
        },
        (loc) => {
          if (loc?.coords) {
            updateLocation(loc.coords);
          }
        }
      );
    }

    // Check background status
    syncBackgroundStatus();

    emit();
    return true;
  } catch (err) {
    errorMessage = err.message || 'Error initializing geofence';
    emit();
    return false;
  }
}

/** Stop watching foreground position */
export function stopGeofencing() {
  if (locationWatcher) {
    locationWatcher.remove();
    locationWatcher = null;
  }
}

/** Update the target mess coordinates (e.g. for testing or config) */
export function setMessCoordinates(newCoords) {
  // Update ALL zones so foreground + background both use the new coordinates
  messZones = messZones.map((zone) => ({
    ...zone,
    latitude: newCoords.latitude ?? zone.latitude,
    longitude: newCoords.longitude ?? zone.longitude,
    radiusMeters: newCoords.radiusMeters ?? zone.radiusMeters,
  }));
  messCoords = { ...messCoords, ...newCoords };

  if (currentCoords) {
    updateLocation(currentCoords);
  } else {
    emit();
  }

  // Re-register background geofence with updated coordinates if active
  if (backgroundStatus === 'active') {
    startBackgroundGeofencing();
  }
}

/** Set mess location to student's current location (instant inside-geofence for testing) */
export async function setMessToCurrentLocation() {
  if (!currentCoords) {
    try {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
      if (loc?.coords) {
        currentCoords = loc.coords;
      }
    } catch (err) {
      errorMessage = 'Could not get current location: ' + err.message;
      emit();
      return;
    }
  }

  if (currentCoords) {
    setMessCoordinates({
      latitude: currentCoords.latitude,
      longitude: currentCoords.longitude,
    });
  }
}

/** Subscribe to geofence updates */
export function subscribeGeofence(listener) {
  listeners.add(listener);
  listener(getGeofenceSnapshot());

  if (permissionStatus === 'undetermined') {
    startGeofencing();
  }

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      stopGeofencing();
    }
  };
}
