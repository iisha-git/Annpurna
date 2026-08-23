import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';

import {
  DoodleApple,
  DoodleBroccoli,
  DoodleCarrot,
  DoodleCherries,
  DoodleLeaf,
  DoodleSparkles,
} from '@/shared/ui/doodles/Doodles';

/**
 * Animated food-doodle scatter across the ENTIRE dark header:
 * veggies & fruits drifting gently + one breathing halo behind the
 * mascot zone. Rendered as the first child of the header so all real
 * content paints on top. Pure JS Animated — no native deps.
 */

function FloatingDoodle({ style, dur = 3400, delay = 0, range = 6, opacity = 0.6, wobble = 0, children }) {
  const v = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(v, { toValue: 1, duration: dur / 2, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(v, { toValue: 0, duration: dur / 2, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [dur, delay, v]);

  const transform = [
    { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [range / 2, -range / 2] }) },
  ];
  if (wobble) {
    // Math.abs guards against negative wobble producing '--7deg'
    const deg = Math.abs(wobble);
    transform.push({
      rotate: v.interpolate({ inputRange: [0, 1], outputRange: [`-${deg}deg`, `${deg}deg`] }),
    });
  }

  return (
    <Animated.View pointerEvents="none" style={[styles.item, style, { opacity, transform }]}>
      {children}
    </Animated.View>
  );
}

export default function HeaderDoodles() {
  const halo = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(halo, { toValue: 1, duration: 2600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(halo, { toValue: 0, duration: 2600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [halo]);

  return (
    <>
      {/* breathing halo behind the mascot zone */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.halo,
          {
            opacity: halo.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] }),
            transform: [{ scale: halo.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.12] }) }],
          },
        ]}
      />

      {/* top band */}
      <FloatingDoodle style={{ left: '46%', top: 10 }} opacity={0.55} dur={3800} wobble={6}>
        <DoodleLeaf size={26} />
      </FloatingDoodle>
      <FloatingDoodle style={{ right: 150, top: 16 }} opacity={0.8} dur={3000} range={5}>
        <DoodleSparkles size={26} color="#FFD08A" strokeWidth={3} />
      </FloatingDoodle>

      {/* middle band */}
      <FloatingDoodle style={{ right: 104, top: 58 }} opacity={0.65} dur={3600} delay={400} wobble={-7}>
        <DoodleCarrot size={38} />
      </FloatingDoodle>
      <FloatingDoodle style={{ right: 208, top: 44 }} opacity={0.6} dur={4200} delay={900} wobble={5}>
        <DoodleApple size={30} />
      </FloatingDoodle>

      {/* bottom band */}
      <FloatingDoodle style={{ right: 168, bottom: 4 }} opacity={0.6} dur={3400} delay={1300} wobble={6}>
        <DoodleCherries size={30} />
      </FloatingDoodle>
      <FloatingDoodle style={{ left: 18, bottom: 12 }} opacity={0.55} dur={4000} delay={600} wobble={-5}>
        <DoodleBroccoli size={32} />
      </FloatingDoodle>
      <FloatingDoodle style={{ left: '62%', bottom: 22 }} opacity={0.45} dur={3200} delay={1600} range={8}>
        <DoodleLeaf size={20} color="#C9E3B4" />
      </FloatingDoodle>
    </>
  );
}

const styles = StyleSheet.create({
  item: {
    position: 'absolute',
  },
  halo: {
    position: 'absolute',
    right: 14,
    top: 14,
    width: 124,
    height: 124,
    borderRadius: 62,
    backgroundColor: 'rgba(255,157,0,0.13)',
  },
});
