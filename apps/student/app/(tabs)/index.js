import { AppText, Card, Screen } from '@/shared/ui';

// Placeholder — will render live CrowdStatus from features/crowd
export default function HomeScreen() {
  return (
    <Screen>
      <AppText variant="h1">Home</AppText>
      <AppText variant="caption">Know before you go</AppText>

      <Card style={{ marginTop: 16 }}>
        <AppText variant="title">Crowd Status</AppText>
        <AppText style={{ marginTop: 8 }}>
          Live crowd level and wait-time estimate will appear here.
        </AppText>
      </Card>
    </Screen>
  );
}
