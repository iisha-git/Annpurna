import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { enterMess, leaveMess } from './crowd-repository';

export const GEOFENCE_BACKGROUND_TASK = 'ANNPURNA_MESS_GEOFENCE_BACKGROUND_TASK';

// Configure notification behavior for foreground/background
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/** Haversine — returns distance in meters between two GPS points */
function haversineMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const toRad = (d) => (d * Math.PI) / 180;
  const a =
    Math.sin(toRad(lat2 - lat1) / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(toRad(lon2 - lon1) / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Define the OS-level background geofence task.
 * This MUST be defined in module scope before the app component mounts.
 */
try {
  if (!TaskManager.isTaskDefined(GEOFENCE_BACKGROUND_TASK)) {
    TaskManager.defineTask(GEOFENCE_BACKGROUND_TASK, async ({ data: { eventType, region }, error }) => {
      if (error) {
        console.error('[BackgroundGeofence] Task error:', error.message);
        return;
      }

      if (eventType === Location.GeofencingEventType.Enter) {
        console.log('[BackgroundGeofence] Region enter triggered. Verifying accurate fix...');
        // Quick verification of distance to prevent noisy cell/wifi false alarm
        try {
          const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
          if (pos?.coords) {
            const dist = haversineMeters(
              pos.coords.latitude, pos.coords.longitude,
              region.latitude, region.longitude
            );

            // Use the region's own radius + 5m margin for the false-alarm guard
            const threshold = (region.radius || 10) + 5;
            if (dist > threshold) {
              console.log(`[BackgroundGeofence] Ignored false alarm: student is ${Math.round(dist)}m away (threshold: ${threshold}m).`);
              return;
            }
          }
        } catch {
          // If quick fix times out, continue
        }

        console.log('[BackgroundGeofence] Verified inside mess region:', region.identifier);
        enterMess();

        // Ask the student for a crowd review — prompt appears when they tap the notification
        try {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: "Quick! How crowded is the mess? 🍲",
              body: "You're inside Annpurna Mess. Tap to tell others how busy it is right now — takes 2 seconds!",
              data: { action: 'crowd-feedback' },
              sound: true,
            },
            trigger: null, // deliver immediately
          });
        } catch (notifErr) {
          console.warn('[BackgroundGeofence] Notification trigger error:', notifErr.message);
        }
      } else if (eventType === Location.GeofencingEventType.Exit) {
        // With multiple zones, the OS fires Exit per-zone independently.
        // Verify the student is actually outside ALL zones before calling leaveMess().
        try {
          const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          if (pos?.coords) {
            const { MESS_GEOFENCE_ZONES } = require('@/shared/lib/config');
            const stillInside = MESS_GEOFENCE_ZONES.some((zone) => {
              const d = haversineMeters(
                pos.coords.latitude, pos.coords.longitude,
                zone.latitude, zone.longitude
              );
              return d <= zone.radiusMeters;
            });
            if (stillInside) {
              console.log('[BackgroundGeofence] Exited', region.identifier, 'but still inside another zone — skipping leaveMess.');
              return;
            }
          }
        } catch {
          // If GPS check fails, fall through and leave — safer than staying stuck
        }
        console.log('[BackgroundGeofence] Exited all mess regions in background.');
        leaveMess();
      }
    });
    console.log('[BackgroundGeofence] Background task registered successfully.');
  }
} catch (e) {
  console.warn('[BackgroundGeofence] Could not define background task:', e.message);
}
