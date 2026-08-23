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
      {/* ── Band 1 · top · organic spacing ── */}
      <FloatingDoodle style={{ left: '3%', top: 16 }} opacity={0.45} dur={4200} wobble={5}>
        <DoodleLeaf size={26} />
      </FloatingDoodle>
      <FloatingDoodle style={{ left: '15%', top: 4 }} opacity={0.5} dur={3900} delay={600} wobble={-4}>
        <DoodleMushroom size={32} />
      </FloatingDoodle>
      <FloatingDoodle style={{ left: '29%', top: 14 }} opacity={0.75} dur={3000} range={5} delay={1100}>
        <DoodleSparkles size={28} color="#FFD08A" strokeWidth={3} />
      </FloatingDoodle>
      <FloatingDoodle style={{ left: '44%', top: 2 }} opacity={0.55} dur={3600} delay={500} wobble={6}>
        <DoodleChili size={34} />
      </FloatingDoodle>
      <FloatingDoodle style={{ left: '57%', top: 16 }} opacity={0.5} dur={4300} delay={900} wobble={-5}>
        <DoodleApple size={32} />
      </FloatingDoodle>
      <FloatingDoodle style={{ left: '71%', top: 6 }} opacity={0.55} dur={3400} delay={1300} range={7}>
        <DoodleFries size={32} />
      </FloatingDoodle>
      <FloatingDoodle style={{ left: '86%', top: 12 }} opacity={0.6} dur={3700} delay={200} wobble={7}>
        <DoodleCarrot size={40} />
      </FloatingDoodle>

      {/* ── Band 2 · middle · loose fillers ── */}
      <FloatingDoodle style={{ left: '6%', top: '50%' }} opacity={0.5} dur={3800} delay={300} wobble={-6}>
        <DoodleBroccoli size={36} />
      </FloatingDoodle>
      <FloatingDoodle style={{ left: '19%', top: '33%' }} opacity={0.45} dur={3300} delay={800} range={7}>
        <DoodleCherries size={24} color="#F2A09B" />
      </FloatingDoodle>
      <FloatingDoodle style={{ left: '31%', top: '52%' }} opacity={0.4} dur={4100} delay={1500}>
        <DoodleLeaf size={22} color="#C9E3B4" />
      </FloatingDoodle>
      <FloatingDoodle style={{ left: '47%', top: '35%' }} opacity={0.45} dur={3500} delay={1000} wobble={5}>
        <DoodleMushroom size={28} color="#C9B6E8" />
      </FloatingDoodle>
      <FloatingDoodle style={{ left: '63%', top: '50%' }} opacity={0.5} dur={3900} delay={400} wobble={-4}>
        <DoodleFries size={28} />
      </FloatingDoodle>
      <FloatingDoodle style={{ left: '77%', top: '33%' }} opacity={0.5} dur={3200} delay={1700} range={6}>
        <DoodleSparkles size={22} color="rgba(255,255,255,0.85)" strokeWidth={3} />
      </FloatingDoodle>
      <FloatingDoodle style={{ left: '92%', top: '48%' }} opacity={0.55} dur={3600} delay={1200} wobble={6}>
        <DoodleApple size={28} />
      </FloatingDoodle>

      {/* ── Band 3 · bottom · staggered depths ── */}
      <FloatingDoodle style={{ left: '4%', bottom: 6 }} opacity={0.5} dur={4000} delay={700} wobble={-5}>
        <DoodleBroccoli size={36} />
      </FloatingDoodle>
      <FloatingDoodle style={{ left: '17%', bottom: 22 }} opacity={0.45} dur={3700} delay={1100} wobble={-6}>
        <DoodleApple size={26} color="#F2A09B" />
      </FloatingDoodle>
      <FloatingDoodle style={{ left: '31%', bottom: 2 }} opacity={0.55} dur={3400} delay={1400} wobble={6}>
        <DoodleCherries size={32} />
      </FloatingDoodle>
      <FloatingDoodle style={{ left: '48%', bottom: 20 }} opacity={0.45} dur={3100} delay={1900} range={6}>
        <DoodleMushroom size={24} color="#C9B6E8" />
      </FloatingDoodle>
      <FloatingDoodle style={{ left: '60%', bottom: 3 }} opacity={0.5} dur={3800} delay={250} wobble={-5}>
        <DoodleCarrot size={28} />
      </FloatingDoodle>
      <FloatingDoodle style={{ left: '74%', bottom: 24 }} opacity={0.4} dur={4200} delay={1600} range={8}>
        <DoodleLeaf size={20} color="#C9E3B4" />
      </FloatingDoodle>
      <FloatingDoodle style={{ left: '88%', bottom: 5 }} opacity={0.5} dur={3500} delay={900} wobble={4}>
        <DoodleChili size={28} />
      </FloatingDoodle>
    </>
  );
}

const styles = StyleSheet.create({
  item: {
    position: 'absolute',
  },
});
