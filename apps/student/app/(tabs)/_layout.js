import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import { colors } from '@/shared/theme/tokens';

const TAB_ICON = {
  index: ['home-outline', 'home'],
  menu: ['restaurant-outline', 'restaurant'],
  status: ['calendar-outline', 'calendar'],
  profile: ['person-circle-outline', 'person-circle'],
};

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}>
      {[
        ['index', 'Home'],
        ['menu', 'Menu'],
        ['status', 'Mess Status'],
        ['profile', 'Profile'],
      ].map(([name, title]) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title,
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? TAB_ICON[name][1] : TAB_ICON[name][0]} size={24} color={color} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
