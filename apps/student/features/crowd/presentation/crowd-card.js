import { Animated, Easing, StyleSheet, View } from 'react-native';
import { useEffect, useRef } from 'react';

import { RECOMMENDATIONS, WAIT_ESTIMATES } from '../domain/crowd-rules';
import { AppText, Card } from '@/shared/ui';
import { colors } from '@/shared/theme/tokens';

const LEVELS = {
  LOW: { label: 'Low', color: colors.crowdLow, soft: colors.successSoft, segments: 1 },
  MODERATE: { label: 'Moderate', color: colors.crowdModerate, soft: '#FDF1DC', segments: 2 },
  HIGH: { label: 'High', color: colors.crowdHigh, soft: colors.dangerSoft, segments: 3 },
  NONE: { label: 'Not enough feedback yet', color: colors.textMuted, soft: '#F3EEE7', segments: 0 },
};

function timeAgo(date) {
  if (!date) return '';
  const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
  return mins < 1 ? 'updated just now' : `updated ${mins} min ago`;
}

/**
 * The hero card of Annpurna — current mess crowding.
 * Consumes ONLY the resolved CrowdStatus; blind to GPS/reports/overrides.
 */
export default function CrowdCard({ status }) {
  const meta = status?.level ? LEVELS[status.level] : LEVELS.NONE;

  return (
    <Card style={{ marginTop: 16 }}>
      <View style={styles.headerRow}>
        <AppText variant="title">Mess crowd</AppText>
        <View style={{ alignItems: 'flex-end' }}>
          {status?.origin === 'OWNER_OVERRIDE' && (
            <AppText variant="caption" color={colors.accent}>
              set by mess manager
            </AppText>
          )}
          <AppText variant="caption" style={{ fontSize: 11 }}>
            {timeAgo(status?.updatedAt)}
          </AppText>
        </View>
      </View>

      {/* Level pill */}
      <View style={[styles.pill, { backgroundColor: meta.soft }]}>
        <PulsingDot color={meta.color} />
        <AppText style={{ color: meta.color, fontWeight: '800', fontSize: 19 }}>
          {meta.label}
        </AppText>
      </View>

      {/* 3-segment meter */}
      <View style={styles.meter}>
        {[1, 2, 3].map((seg) => (
          <View
            key={seg}
            style={[styles.segment, seg <= meta.segments && { backgroundColor: meta.color }]}
          />
        ))}
      </View>

      <AppText style={{ marginTop: 14 }}>
        {RECOMMENDATIONS[status?.level] ?? 'Check back in a few minutes'}
      </AppText>

      {WAIT_ESTIMATES[status?.level] && (
        <AppText variant="caption" style={{ marginTop: 4 }}>
          Estimated wait: {WAIT_ESTIMATES[status.level]}
        </AppText>
      )}

      <AppText variant="caption" style={{ marginTop: 10 }}>
        Based on {status?.responseCount ?? 0} anonymous responses from students at the mess
      </AppText>
    </Card>
  );
}

/** Soft breathing animation on the live dot — "this is happening right now". */
function PulsingDot({ color }) {
  const value = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(value, { toValue: 1.6, duration: 1000, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(value, { toValue: 1, duration: 1000, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [value]);

  return (
    <Animated.View style={[styles.dotHalo, { transform: [{ scale: value }] }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 18,
    marginTop: 14,
  },
  dotHalo: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  meter: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 12,
  },
  segment: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
  },
});
