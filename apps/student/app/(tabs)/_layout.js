import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Animated, Easing, Platform, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { useEffect, useRef } from 'react';

import { colors, fonts } from '@/shared/theme/tokens';

// Rounded, food-friendly glyphs — inactive vs active pairs chosen so
// the swap is OBVIOUS, not a subtle fill change
const TAB_ICON = {
  index: ['home-variant-outline', 'home-variant'],
  menu: ['food-outline', 'noodles'],
  status: ['calendar-month-outline', 'calendar-check'],
  profile: ['account-circle-outline', 'account-circle'],
};

/**
 * LIQUID TAB BUTTON — the active one physically leaves the dock.
 *
 * Focused:  the icon + droplet circle LIFT ~16px above the dock surface
 *           (springy wobble = fluid), while the droplet stretches tall
 *           mid-rise and settles — classic squash-and-stretch.
 * Unfocused: sinks back into the dock.
 */
function AnimatedTabIcon({ focused, name, size = 24 }) {
  const lift = useRef(new Animated.Value(focused ? -16 : 0)).current;
  const squash = useRef(new Animated.Value(1)).current;

  // Icon ink flips to dark while riding the cream droplet
  const iconColor = focused ? '#17141A' : 'rgba(251,247,242,0.55)';

  useEffect(() => {
    if (focused) {
      Animated.parallel([
        Animated.spring(lift, { toValue: -16, friction: 4.5, tension: 170, useNativeDriver: true }),
        Animated.sequence([
          Animated.timing(squash, { toValue: 1.18, duration: 130, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.spring(squash, { toValue: 1, friction: 3.5, tension: 200, useNativeDriver: true }),
        ]),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(lift, { toValue: 0, friction: 5, tension: 170, useNativeDriver: true }),
        Animated.timing(squash, { toValue: 1, duration: 160, useNativeDriver: true }),
      ]).start();
    }
  }, [focused, lift, squash]);

  return (
    <Animated.View style={[styles.iconWrap, { transform: [{ translateY: lift }] }]}>
      {/* droplet behind the icon — stretches vertically while rising */}
      <Animated.View
        style={[
          styles.bubble,
          {
            transform: [
              { scaleY: squash },
              { scaleX: squash.interpolate({ inputRange: [1, 1.18], outputRange: [1, 0.94] }) },
            ],
          },
        ]}
      />
      <MaterialCommunityIcons name={name} size={size} color={iconColor} />
    </Animated.View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accentOnDark,
        tabBarInactiveTintColor: 'rgba(251,247,242,0.55)',
        tabBarStyle: {
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
              shadowColor: '#0E0B13',
              shadowOpacity: 0.35,
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
            tabBarIcon: ({ focused }) => (
              <AnimatedTabIcon
                focused={focused}
                name={focused ? TAB_ICON[name][1] : TAB_ICON[name][0]}
              />
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
    fontFamily: fonts.bold,
  },
  iconWrap: {
    width: 48,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: {
    position: 'absolute',
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.background, // exact page "light skin" — reads as a hole in the dock
  },
});
