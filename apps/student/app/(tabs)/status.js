import { AppText, Card, Screen } from '@/shared/ui';

// Placeholder — will render the monthly calendar from features/mess-status
export default function StatusScreen() {
  return (
    <Screen>
      <AppText variant="h1">Mess Status</AppText>
      <AppText variant="caption">Your month at a glance</AppText>

      <Card style={{ marginTop: 16 }}>
        <AppText variant="title">Monthly Calendar</AppText>
        <AppText style={{ marginTop: 8 }}>
          The full month view with present (green) and approved-leave (red) dots will appear here.
        </AppText>
      </Card>
    </Screen>
  );
}
