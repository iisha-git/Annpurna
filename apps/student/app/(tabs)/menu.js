import { AppText, Card, Screen } from '@/shared/ui';

// Placeholder — will render the menu from features/menu
export default function MenuScreen() {
  return (
    <Screen>
      <AppText variant="h1">Menu</AppText>
      <AppText variant="caption">What's cooking today</AppText>

      <Card style={{ marginTop: 16 }}>
        <AppText variant="title">Today's Menu</AppText>
        <AppText style={{ marginTop: 8 }}>
          Breakfast, lunch and dinner menus will appear here.
        </AppText>
      </Card>
    </Screen>
  );
}
