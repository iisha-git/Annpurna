import { AppText, Screen } from '@/shared/ui';
import { Stack } from 'expo-router';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Not found' }} />
      <Screen style={{ alignItems: 'center', justifyContent: 'center' }}>
        <AppText variant="h1">Page not found</AppText>
        <AppText variant="caption" style={{ marginTop: 8 }}>
          This screen doesn't exist.
        </AppText>
      </Screen>
    </>
  );
}
