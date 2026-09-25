import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import { DEFAULT_MESS_COORDINATES } from '@/shared/lib/config';
import { enterMess, leaveMess } from './crowd-repository';
import { GEOFENCE_BACKGROUND_TASK } from './background-geofence-task';

/**
 * GEOFENCE SERVICE
 * Tracks student's GPS position in relation to the Mess Hall perimeter.
 * Supports both live Foreground position watching and 24/7 OS-level Background Geofencing.
 */

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
  return Math.round(R * c);
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

function updateLocation(coords) {
  currentCoords = {
    latitude: coords.latitude,
    longitude: coords.longitude,
    accuracy: coords.accuracy,
  };

  const dist = calculateDistanceMeters(
    coords.latitude,
    coords.longitude,
    messCoords.latitude,
    messCoords.longitude
  );
  currentDistance = dist;

  // Only consider a fix valid for entry if accuracy is reasonable (<= 35m)
  const isAccurate = coords.accuracy == null || coords.accuracy <= 35;
  const nowInside = dist !== null && dist <= messCoords.radiusMeters && isAccurate;

  if (nowInside && !isInside) {
    isInside = true;
    enterMess();
  } else if (!nowInside) {
    // If student is outside boundary (> 30m), guarantee leaveMess is called
    if (isInside || (dist !== null && dist > messCoords.radiusMeters)) {
      isInside = false;
      leaveMess();
    }
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

    // 4. Register region with OS
    if (Location.startGeofencingAsync) {
      await Location.startGeofencingAsync(GEOFENCE_BACKGROUND_TASK, [
        {
          identifier: 'annpurna_mess_hall',
          latitude: messCoords.latitude,
          longitude: messCoords.longitude,
          radius: messCoords.radiusMeters || 40,
          notifyOnEnter: true,
          notifyOnExit: true,
        },
      ]);
      backgroundStatus = 'active';
      errorMessage = null;
      console.log('[Geofence] 24/7 background geofencing registered for 40m radius.');
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
        accuracy: Location.Accuracy.Balanced,
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
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 5000,
          distanceInterval: 5,
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
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
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
