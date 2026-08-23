import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Platform, StyleSheet, View } from 'react-native';
import { Tabs } from 'expo-router';
import { Animated, Easing } from 'react-native';
import { useEffect, useRef } from 'react';

import { colors, fonts } from '@/shared/theme/tokens';

// Rounded, food-friendly glyphs (MaterialCommunityIcons) — inactive vs
// active pairs chosen so the swap is OBVIOUS, not a subtle fill change
const TAB_ICON = {
  index: ['home-variant-outline', 'home-variant'],
  menu: ['food-outline', 'noodles'],
  status: ['calendar-month-outline', 'calendar-check'],
  profile: ['account-circle-outline', 'account-circle'],
};

/**
 * The Figma-style active bubble: a soft amber pill that POPS UP from
 * beneath the icon whenever its tab becomes focused, and sinks away
 * when focus leaves. The icon itself bounce-springs on top of it.
 * One component instance per tab, so hooks here are safe.
 */
function AnimatedTabIcon({ focused, name, color, size = 24 }) {
  const scale = useRef(new Animated.Value(1)).current;
  const bubble = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    if (focused) {
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scale, { toValue: 1.35, duration: 140, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.spring(scale, { toValue: 1, friction: 3, tension: 160, useNativeDriver: true }),
        ]),
        Animated.spring(bubble, { toValue: 1, friction: 5, tension: 220, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.timing(bubble, { toValue: 0, duration: 160, useNativeDriver: true }).start();
    }
  }, [focused, scale, bubble]);

  return (
    <View style={styles.iconWrap}>
      {/* the bubble — rises from below, spring overshoot = "pop" */}
      <Animated.View
        style={[
          styles.bubble,
          {
            opacity: bubble,
            transform: [{
              translateY: bubble.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }),
            }],
          },
        ]}
      />
      <Animated.View style={{ transform: [{ scale }] }}>
        <MaterialCommunityIcons name={name} size={size} color={color} />
      </Animated.View>
    </View>
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
            tabBarIcon: ({ color, focused }) => (
              <AnimatedTabIcon
                focused={focused}
                name={focused ? TAB_ICON[name][1] : TAB_ICON[name][0]}
                color={color}
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
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: {
    position: 'absolute',
    width: 44,
    height: 30,
    borderRadius: 15,
    bottom: -3,
    backgroundColor: 'rgba(255,157,0,0.22)',
  },
});
