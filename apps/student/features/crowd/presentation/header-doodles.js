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
      {/* ── Band 1 · top · 7 evenly spaced columns ── */}
      <FloatingDoodle style={{ left: '4%', top: 6 }} opacity={0.45} dur={4200} wobble={5}>
        <DoodleLeaf size={20} />
      </FloatingDoodle>
      <FloatingDoodle style={{ left: '17%', top: 12 }} opacity={0.5} dur={3900} delay={600} wobble={-4}>
        <DoodleMushroom size={24} />
      </FloatingDoodle>
      <FloatingDoodle style={{ left: '30%', top: 3 }} opacity={0.75} dur={3000} range={5} delay={1100}>
        <DoodleSparkles size={22} color="#FFD08A" strokeWidth={3} />
      </FloatingDoodle>
      <FloatingDoodle style={{ left: '43%', top: 10 }} opacity={0.55} dur={3600} delay={500} wobble={6}>
        <DoodleChili size={26} />
      </FloatingDoodle>
      <FloatingDoodle style={{ left: '56%', top: 4 }} opacity={0.5} dur={4300} delay={900} wobble={-5}>
        <DoodleApple size={26} />
      </FloatingDoodle>
      <FloatingDoodle style={{ left: '70%', top: 12 }} opacity={0.55} dur={3400} delay={1300} range={7}>
        <DoodleFries size={24} />
      </FloatingDoodle>
      <FloatingDoodle style={{ left: '84%', top: 4 }} opacity={0.6} dur={3700} delay={200} wobble={7}>
        <DoodleCarrot size={30} />
      </FloatingDoodle>

      {/* ── Band 2 · middle · fills the gaps ── */}
      <FloatingDoodle style={{ left: '8%', top: '42%' }} opacity={0.5} dur={3800} delay={300} wobble={-6}>
        <DoodleBroccoli size={28} />
      </FloatingDoodle>
      <FloatingDoodle style={{ left: '22%', top: '36%' }} opacity={0.45} dur={3300} delay={800} range={7}>
        <DoodleCherries size={18} color="#F2A09B" />
      </FloatingDoodle>
      <FloatingDoodle style={{ left: '36%', top: '44%' }} opacity={0.4} dur={4100} delay={1500}>
        <DoodleLeaf size={18} color="#C9E3B4" />
      </FloatingDoodle>
      <FloatingDoodle style={{ left: '50%', top: '38%' }} opacity={0.45} dur={3500} delay={1000} wobble={5}>
        <DoodleMushroom size={22} color="#C9B6E8" />
      </FloatingDoodle>
      <FloatingDoodle style={{ left: '64%', top: '45%' }} opacity={0.5} dur={3900} delay={400} wobble={-4}>
        <DoodleFries size={22} />
      </FloatingDoodle>
      <FloatingDoodle style={{ left: '78%', top: '37%' }} opacity={0.5} dur={3200} delay={1700} range={6}>
        <DoodleSparkles size={18} color="rgba(255,255,255,0.85)" strokeWidth={3} />
      </FloatingDoodle>
      <FloatingDoodle style={{ left: '91%', top: '44%' }} opacity={0.55} dur={3600} delay={1200} wobble={6}>
        <DoodleApple size={24} />
      </FloatingDoodle>

      {/* ── Band 3 · bottom ── */}
      <FloatingDoodle style={{ left: '5%', bottom: 10 }} opacity={0.5} dur={4000} delay={700} wobble={-5}>
        <DoodleBroccoli size={30} />
      </FloatingDoodle>
      <FloatingDoodle style={{ left: '19%', bottom: 16 }} opacity={0.45} dur={3700} delay={1100} wobble={-6}>
        <DoodleApple size={20} color="#F2A09B" />
      </FloatingDoodle>
      <FloatingDoodle style={{ left: '33%', bottom: 4 }} opacity={0.55} dur={3400} delay={1400} wobble={6}>
        <DoodleCherries size={26} />
      </FloatingDoodle>
      <FloatingDoodle style={{ left: '46%', bottom: 14 }} opacity={0.45} dur={3100} delay={1900} range={6}>
        <DoodleMushroom size={18} color="#C9B6E8" />
      </FloatingDoodle>
      <FloatingDoodle style={{ left: '59%', bottom: 5 }} opacity={0.5} dur={3800} delay={250} wobble={-5}>
        <DoodleCarrot size={22} />
      </FloatingDoodle>
      <FloatingDoodle style={{ left: '73%', bottom: 15 }} opacity={0.4} dur={4200} delay={1600} range={8}>
        <DoodleLeaf size={16} color="#C9E3B4" />
      </FloatingDoodle>
      <FloatingDoodle style={{ left: '87%', bottom: 8 }} opacity={0.5} dur={3500} delay={900} wobble={4}>
        <DoodleChili size={22} />
      </FloatingDoodle>
    </>
  );
}

const styles = StyleSheet.create({
  item: {
    position: 'absolute',
  },
});
