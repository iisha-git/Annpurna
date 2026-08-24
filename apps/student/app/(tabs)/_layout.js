import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Animated, Easing, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Redirect, Tabs } from 'expo-router';
import { useEffect, useRef } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fonts } from '@/shared/theme/tokens';
import { useAuthSession } from '@/features/auth/presentation/use-auth-session';

// ─────────────────────────────────────────────────────────────────────────────
// SLIDING DOCK — ONE highlight circle lives in the dock and SLIDES to
// whichever tab is active, POPPED OUT of the bar like a rising bump:
// most of the egg floats above the dock's top edge, the rest dips inside.
// Each icon springs UP into the circle when focused and sinks back down
// when it loses focus. Nothing is hand-tuned to one device: the resting
// spot is computed from measured screen width, so it centers everywhere.
//
//   slot      = screenWidth / tab count
//   indicator rides at  slotIndex * slot + (slot - IND_W) / 2
// ─────────────────────────────────────────────────────────────────────────────
const DOCK_H = 62;
const IND_W = 56;
const IND_H = 56; // perfect circle now
const IND_TOP = -34; // floats HIGH above the bar — most of it in open air
const HALO_W = 42; // dock-colored disc riding ON the cream circle…
const HALO_H = 42; // …leaves a ~7px cream ring glowing around it
const ICON_SIZE = 26;
const ICON_LIFT = -33; // how far the active icon rises (+4 optical nudge: glyph boxes render low)

// Rounded, food-friendly glyphs — inactive vs active pairs chosen so
// the swap is OBVIOUS, not a subtle fill change
const TAB_ICON = {
  index: ['home-variant-outline', 'home-variant'],
  menu: ['food-outline', 'noodles'],
  status: ['calendar-month-outline', 'calendar-check'],
  profile: ['account-circle-outline', 'account-circle'],
};

const TABS = [
  ['index', 'Home'],
  ['menu', 'Menu'],
  ['status', 'Mess Status'],
  ['profile', 'Profile'],
];
const TITLES = Object.fromEntries(TABS);

/**
 * Per-tab icon that physically rises to meet the sliding circle.
 * Focused  → springs UP into the popped-out bump (dark ink on cream).
 * Unfocused→ sinks back onto the dark dock surface (dim cream ink).
 */
function DockTabIcon({ focused, name }) {
  const lift = useRef(new Animated.Value(focused ? ICON_LIFT : 0)).current;
  // Skip the choreography on mount — start at resting pose, no jiggle
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    Animated.spring(lift, {
      toValue: focused ? ICON_LIFT : 0,
      friction: focused ? 4.5 : 5,
      tension: 170,
      useNativeDriver: true,
    }).start();
  }, [focused, lift]);

  const color = focused ? colors.accentOnDark : 'rgba(251,247,242,0.62)'; // amber on the dark disc
  return (
    <Animated.View style={{ transform: [{ translateY: lift }] }}>
      <MaterialCommunityIcons name={name} size={ICON_SIZE} color={color} />
    </Animated.View>
  );
}

/**
 * Custom tab bar replacing react-navigation's default.
 *
 * The indicator is a single absolutely-positioned view shared by ALL tabs;
 * focusing a different tab just retargets one animated value, so the
 * highlight glides across intermediate tabs instead of teleporting.
 */
function SlidingDockBar({ state, navigation }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const slot = width / state.routes.length;

  const slideX = useRef(new Animated.Value(0)).current;
  const lastWidth = useRef(width);

  useEffect(() => {
    const target = state.index * slot + (slot - IND_W) / 2;
    if (lastWidth.current !== width) {
      // Rotation/fold/tablet switch: jump instantly, don't glide sideways
      lastWidth.current = width;
      slideX.setValue(target);
      return;
    }
    // Tab change: springy glide — the liquid personality of the dock
    Animated.spring(slideX, { toValue: target, friction: 6, tension: 170, useNativeDriver: true }).start();
  }, [state.index, slot, width, slideX]);

  return (
    <View style={[styles.dock, { height: DOCK_H + insets.bottom, paddingBottom: insets.bottom }]}>
      {/* The single sliding highlight — cream egg with a dock-colored disc
          layered inside it, so the icon sits on dock ink ringed by cream */}
      <Animated.View
        style={[styles.indicator, { width: IND_W, height: IND_H, transform: [{ translateX: slideX }] }]}>
        <View style={styles.halo} />
      </Animated.View>
      {state.routes.map((route, i) => {
        const focused = state.index === i;
        const [inactiveIcon, activeIcon] = TAB_ICON[route.name] ?? ['circle-outline', 'circle'];
        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
        };
        return (
          <Pressable
            key={route.name}
            accessibilityRole="button"
            accessibilityState={focused ? { selected: true } : {}}
            accessibilityLabel={TITLES[route.name]}
            onPress={onPress}
            style={styles.slot}>
            <DockTabIcon focused={focused} name={focused ? activeIcon : inactiveIcon} />
            <Text style={[styles.label, focused && styles.labelActive]}>{TITLES[route.name]}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabLayout() {
  // Gate: no session → the whole tab world is unreachable
  const { user, loading } = useAuthSession();
  if (loading) return null;
  if (!user) return <Redirect href="/login" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background }, // canvas behind every tab
        tabBarShowLabel: false, // labels are drawn by SlidingDockBar
      }}
      tabBar={(props) => <SlidingDockBar {...props} />}>
      {TABS.map(([name, title]) => (
        <Tabs.Screen key={name} name={name} options={{ title }} />
      ))}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  dock: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: colors.dark,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    // NO overflow hidden — the circle and active icon must be free to rise
    // above the dock's silhouette
  },
  slot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 6,
  },
  indicator: {
    position: 'absolute',
    left: 0,
    top: IND_TOP,
    borderRadius: IND_W / 2, // pill/egg silhouette
    backgroundColor: colors.background, // warm paper — the old droplet skin
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    width: HALO_W,
    height: HALO_H,
    borderRadius: HALO_W / 2,
    backgroundColor: colors.dark, // same ink as the dock — a "hole" in the egg
  },
  label: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: 'rgba(251,247,242,0.55)',
    marginTop: 2,
  },
  labelActive: {
    color: colors.accentOnDark, // amber — readable on the dark dock below the circle
  },
});
