import { useEffect, useState } from 'react';
import * as geofenceService from '../data/geofence-service';

/**
 * useGeofence — subscribes the component to live GPS Geofence updates.
 */
export function useGeofence() {
  const [snapshot, setSnapshot] = useState(() => geofenceService.getGeofenceSnapshot());

  useEffect(() => {
    const unsubscribe = geofenceService.subscribeGeofence(setSnapshot);
    return unsubscribe;
  }, []);

  return {
    ...snapshot,
    requestPermission: geofenceService.startGeofencing,
    startBackgroundGeofencing: geofenceService.startBackgroundGeofencing,
    stopBackgroundGeofencing: geofenceService.stopBackgroundGeofencing,
    setMessToCurrentLocation: geofenceService.setMessToCurrentLocation,
    setMessCoordinates: geofenceService.setMessCoordinates,
    publishMessCoordinatesToCloud: geofenceService.publishMessCoordinatesToCloud,
    syncMessConfigFromCloud: geofenceService.syncMessConfigFromCloud,
  };
}
