import { Stack } from 'expo-router';
import { DefaultTheme, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { useFonts } from 'expo-font';
import { Fredoka_400Regular, Fredoka_600SemiBold } from '@expo-google-fonts/fredoka';
import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
} from '@expo-google-fonts/nunito';
import * as Notifications from 'expo-notifications';

import { colors } from '@/shared/theme/tokens';
import { AuthProvider } from '@/features/auth/presentation/use-auth-session';
import { triggerFeedbackFromNotification } from '@/features/crowd/data/crowd-repository';
import '@/features/crowd/data/background-geofence-task';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

// Annpurna is a light, warm UI — we pin the navigation theme instead of
// following the system dark mode until a dark palette exists.
const navTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: colors.background },
};

export default function RootLayout() {
  // Fonts load JS-side at startup — no dev-build rebuild needed.
  const [fontsLoaded] = useFonts({
    Fredoka_400Regular,
    Fredoka_600SemiBold,
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });

  // When the student taps the crowd-review push notification,
  // re-surface the in-app feedback modal so they can answer.
  const notifListenerRef = useRef(null);
  useEffect(() => {
    notifListenerRef.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const action = response.notification.request.content.data?.action;
      if (action === 'crowd-feedback') {
        triggerFeedbackFromNotification();
      }
    });
    return () => {
      if (notifListenerRef.current) {
        Notifications.removeNotificationSubscription(notifListenerRef.current);
      }
    };
  }, []);

  if (!fontsLoaded) return null;

  return (
    <ThemeProvider value={navTheme}>
      <AuthProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
          }}
        >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="login" options={{ gestureEnabled: false }} />
          <Stack.Screen name="+not-found" options={{ headerShown: true }} />
        </Stack>
      </AuthProvider>
    </ThemeProvider>
  );
}
