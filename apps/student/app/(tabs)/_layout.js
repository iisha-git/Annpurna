import { Ionicons } from '@expo/vector-icons';
import { Platform, StyleSheet } from 'react-native';
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
        tabBarActiveTintColor: colors.accentOnDark,
        tabBarInactiveTintColor: 'rgba(251,247,242,0.55)',
        tabBarStyle: {
          // Floating dark dock — detached from screen edges
          position: 'absolute',
          bottom: 18,
          left: 18,
          right: 18,
          height: 62,
          borderRadius: 20,
          backgroundColor: colors.dark,
          borderTopWidth: 0,
          ...Platform.select({
            ios: {
              shadowColor: '#2B2118',
              shadowOpacity: 0.3,
              shadowRadius: 16,
              shadowOffset: { width: 0, height: 8 },
            },
            android: { elevation: 10 },
          }),
        },
        tabBarLabelStyle: styles.label,
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

const styles = StyleSheet.create({
  label: {
    fontSize: 11,
    fontWeight: '600',
  },
});
