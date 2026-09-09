import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { enterMess, leaveMess } from './crowd-repository';

export const GEOFENCE_BACKGROUND_TASK = 'ANNPUTNA_MESS_GEOFENCE_BACKGROUND_TASK';

// Configure notification behavior for foreground/background
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

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
        console.log('[BackgroundGeofence] Entered mess region in background:', region.identifier);
        enterMess();

        try {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: "You've arrived at Annpurna Mess! 🍲",
              body: "How crowded is it right now? Tap to share live feedback with other students.",
              data: { action: 'crowd-feedback' },
              sound: true,
            },
            trigger: null, // deliver immediately
          });
        } catch (notifErr) {
          console.warn('[BackgroundGeofence] Notification trigger error:', notifErr.message);
        }
      } else if (eventType === Location.GeofencingEventType.Exit) {
        console.log('[BackgroundGeofence] Exited mess region in background:', region.identifier);
        leaveMess();
      }
    });
    console.log('[BackgroundGeofence] Background task registered successfully.');
  }
} catch (e) {
  console.warn('[BackgroundGeofence] Could not define background task:', e.message);
}
