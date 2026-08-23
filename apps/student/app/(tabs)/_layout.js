import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { Tabs } from 'expo-router';
import { useEffect, useRef } from 'react';

import { colors, fonts } from '@/shared/theme/tokens';

// ─────────────────────────────────────────────────────────────────────────────
// DROPLET GEOMETRY — owner-approved proportions. Every size derives from
// CIRCLE, so scaling the whole composition later = change ONE number.
//
//   bubble        = CIRCLE wide × BUBBLE_H tall (54 × 58 — taller than wide)
//   dropWrap      = CIRCLE × 1.74 wide, CIRCLE × 1.12 tall
//   fillet        = FROZEN at 17 — owner wants curves unchanged while
//                   the circle alone grows
//   lift          = CIRCLE × 0.42
//   dock height stays independent (62). Icons 28.
// ─────────────────────────────────────────────────────────────────────────────
const CIRCLE = 53;
const BUBBLE_H = 59; // height-only stretch — the droplet reads as a tall egg
const DROP_W = Math.round(CIRCLE * 1.74);
const DROP_H = Math.round(CIRCLE * 1.12);
const FILLET = 17; // frozen — do NOT derive from CIRCLE anymore
const LIFT = -Math.round(CIRCLE * 0.42);

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
function AnimatedTabIcon({ focused, name, size = 28 }) {
  const lift = useRef(new Animated.Value(focused ? LIFT : 0)).current;
  const squash = useRef(new Animated.Value(1)).current;
  const bubbleIn = useRef(new Animated.Value(focused ? 1 : 0)).current;
  // Skip the choreography on mount — animated values start AT their resting
  // pose above, so a fresh render (reload) sits still instead of jiggling.
  // The dance should only play when focus genuinely changes.
  const mounted = useRef(false);

  // Icon ink flips to dark while riding the cream droplet
  const iconColor = focused ? '#17141A' : 'rgba(251,247,242,0.62)';

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    if (focused) {
      // POUR IN — tiny beat lets the old droplet start melting first,
      // so focus reads as one continuous liquid transfer, not a swap
      Animated.parallel([
        Animated.sequence([
          Animated.delay(50),
          Animated.spring(lift, { toValue: LIFT, friction: 4.5, tension: 170, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.delay(50),
          Animated.timing(squash, { toValue: 1.18, duration: 130, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.spring(squash, { toValue: 1, friction: 3.5, tension: 200, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.delay(30),
          Animated.timing(bubbleIn, { toValue: 1, duration: 180, useNativeDriver: true }),
        ]),
      ]).start();
    } else {
      // MELT DOWN — droplet flattens like water leaving while it sinks,
      // then recovers its resting shape for the next time it's chosen
      Animated.parallel([
        Animated.spring(lift, { toValue: 0, friction: 5, tension: 170, useNativeDriver: true }),
        Animated.sequence([
          Animated.timing(squash, { toValue: 0.7, duration: 110, easing: Easing.in(Easing.quad), useNativeDriver: true }),
          Animated.spring(squash, { toValue: 1, friction: 4, tension: 180, useNativeDriver: true }),
        ]),
        Animated.timing(bubbleIn, { toValue: 0, duration: 230, useNativeDriver: true }),
      ]).start();
    }
  }, [focused, lift, squash, bubbleIn]);

  return (
    <Animated.View style={[styles.iconWrap, { transform: [{ translateY: lift }] }]}>
      {/* Droplet assembly: cream circle + INVERTED fillets on both sides.
          Each fillet is a cream square with a dock-colored disc punched
          into its outer-top corner → the leftover sliver is a concave
          curve flowing from the circle's side down to the dock surface. */}
      <Animated.View
        style={[
          styles.dropWrap,
          {
            opacity: bubbleIn,
            transform: [
              { scaleY: squash },
              { scaleX: squash.interpolate({ inputRange: [1, 1.18], outputRange: [1, 0.94] }) },
            ],
          },
        ]}>
        <View style={styles.bubble} />
        <View style={styles.filletL}>
          <View style={styles.filletCutL} />
        </View>
        <View style={styles.filletR}>
          <View style={styles.filletCutR} />
        </View>
      </Animated.View>
      <MaterialCommunityIcons name={name} size={size} color={iconColor} />
    </Animated.View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background }, // canvas behind every tab — must match the droplet's "hole"
        tabBarActiveTintColor: colors.accentOnDark,
        tabBarInactiveTintColor: 'rgba(251,247,242,0.55)',
        tabBarStyle: {
          // Docked flat to the bottom edge — full width, rounded shoulders up top
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 62,
          borderTopLeftRadius: 14,
          borderTopRightRadius: 14,
          backgroundColor: colors.dark,
          borderTopWidth: 0,
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
  dropWrap: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: DROP_W,
    height: DROP_H,
    marginLeft: -DROP_W / 2,
    marginTop: -DROP_H / 2,
  },
  bubble: {
    position: 'absolute',
    width: CIRCLE,
    height: BUBBLE_H,
    borderRadius: CIRCLE / 2,
    top: (DROP_H - BUBBLE_H) / 2 - 1,
    left: (DROP_W - CIRCLE) / 2,
    backgroundColor: colors.background, // exact page "light skin" — reads as a hole in the dock
  },
  filletL: {
    position: 'absolute',
    left: (DROP_W - CIRCLE) / 2 - FILLET + 9, // overlapping INTO the bubble's edge
    top: DROP_H / 2 - 2,
    width: FILLET,
    height: FILLET,
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  // vertically-flipped punch: concave sliver now hugs the TOP edge,
  // curving down-and-outward from the bubble's equator
  filletCutL: {
    position: 'absolute',
    left: -11.5,
    bottom: -11.5,
    width: 23,
    height: 23,
    borderRadius: 11.5,
    backgroundColor: colors.dark,
  },
  filletR: {
    position: 'absolute',
    right: (DROP_W - CIRCLE) / 2 - FILLET + 9,
    top: DROP_H / 2 - 2,
    width: FILLET,
    height: FILLET,
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  filletCutR: {
    position: 'absolute',
    right: -11.5,
    bottom: -11.5,
    width: 23,
    height: 23,
    borderRadius: 11.5,
    backgroundColor: colors.dark,
  },
});
