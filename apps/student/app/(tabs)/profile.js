import { AppText, Card, Screen } from '@/shared/ui';

// Placeholder — will render profile from features/profile (name, mess number, streak)
export default function ProfileScreen() {
  return (
    <Screen>
      <AppText variant="h1">Profile</AppText>
      <AppText variant="caption">You in the mess</AppText>

      <Card style={{ marginTop: 16 }}>
        <AppText variant="title">Your Details</AppText>
        <AppText style={{ marginTop: 8 }}>
          Name, mess number and your feedback streak will appear here.
        </AppText>
      </Card>
    </Screen>
  );
}
