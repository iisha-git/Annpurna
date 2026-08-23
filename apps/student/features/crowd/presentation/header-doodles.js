import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';

import {
  DoodleApple,
  DoodleBroccoli,
  DoodleCarrot,
  DoodleCherries,
  DoodleChili,
  DoodleFries,
  DoodleLeaf,
  DoodleMushroom,
  DoodleSparkles,
} from '@/shared/ui/doodles/Doodles';

/**
 * Animated food-doodle scatter across the ENTIRE dark header.
 * Rendered as the first child of the header so all real content
 * paints on top. Pure JS Animated — no native deps.
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
  return (
    <>
      {/* top band */}
      <FloatingDoodle style={{ right: 150, top: 16 }} opacity={0.8} dur={3000} range={5}>
        <DoodleSparkles size={26} color="#FFD08A" strokeWidth={3} />
      </FloatingDoodle>
      <FloatingDoodle style={{ left: '30%', top: 6 }} opacity={0.5} dur={3900} wobble={5}>
        <DoodleMushroom size={26} />
      </FloatingDoodle>
      <FloatingDoodle style={{ right: 70, top: 8 }} opacity={0.6} dur={3600} delay={500} wobble={-6}>
        <DoodleChili size={28} />
      </FloatingDoodle>
      <FloatingDoodle style={{ left: '12%', top: 14 }} opacity={0.45} dur={4400} delay={1100}>
        <DoodleLeaf size={20} />
      </FloatingDoodle>

      {/* middle band */}
      <FloatingDoodle style={{ right: 208, top: 46 }} opacity={0.6} dur={4200} delay={900} wobble={5}>
        <DoodleApple size={30} />
      </FloatingDoodle>
      <FloatingDoodle style={{ right: 104, top: 60 }} opacity={0.65} dur={3600} delay={400} wobble={7}>
        <DoodleCarrot size={38} />
      </FloatingDoodle>
      <FloatingDoodle style={{ left: '52%', top: 66 }} opacity={0.55} dur={4000} delay={1400} wobble={-4}>
        <DoodleFries size={28} />
      </FloatingDoodle>
      <FloatingDoodle style={{ left: '37%', top: 34 }} opacity={0.45} dur={3300} delay={700} range={7}>
        <DoodleCherries size={20} color="#F2A09B" />
      </FloatingDoodle>
      <FloatingDoodle style={{ left: -8, top: '52%' }} opacity={0.5} dur={3800} delay={200} wobble={6}>
        <DoodleBroccoli size={30} />
      </FloatingDoodle>

      {/* bottom band */}
      <FloatingDoodle style={{ right: 168, bottom: 2 }} opacity={0.6} dur={3400} delay={1300} wobble={6}>
        <DoodleCherries size={30} />
      </FloatingDoodle>
      <FloatingDoodle style={{ left: 18, bottom: 10 }} opacity={0.55} dur={4000} delay={600} wobble={-5}>
        <DoodleBroccoli size={32} />
      </FloatingDoodle>
      <FloatingDoodle style={{ left: '62%', bottom: 20 }} opacity={0.45} dur={3200} delay={1600} range={8}>
        <DoodleLeaf size={18} color="#C9E3B4" />
      </FloatingDoodle>
      <FloatingDoodle style={{ left: '10%', bottom: 42 }} opacity={0.5} dur={3700} delay={1000} wobble={-6}>
        <DoodleApple size={22} color="#F2A09B" />
      </FloatingDoodle>
      <FloatingDoodle style={{ left: '44%', bottom: 4 }} opacity={0.5} dur={3500} delay={1800} wobble={4}>
        <DoodleMushroom size={20} color="#C9B6E8" />
      </FloatingDoodle>
      <FloatingDoodle style={{ right: 250, top: 24 }} opacity={0.55} dur={3100} delay={1200} range={7}>
        <DoodleFries size={22} />
      </FloatingDoodle>
    </>
  );
}

const styles = StyleSheet.create({
  item: {
    position: 'absolute',
  },
});
