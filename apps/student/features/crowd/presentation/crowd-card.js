import { Animated, Easing, StyleSheet, View } from 'react-native';
import { useEffect, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';

import { RECOMMENDATIONS, WAIT_ESTIMATES } from '../domain/crowd-rules';
import { AppText, Card } from '@/shared/ui';
import { colors } from '@/shared/theme/tokens';

const TOTAL_PEOPLE = 10;

const LEVELS = {
  LOW: { label: 'Low', color: colors.crowdLow, soft: colors.successSoft, people: 4 },
  MODERATE: { label: 'Moderate', color: colors.crowdModerate, soft: '#FDF1DC', people: 6 },
  HIGH: { label: 'High', color: colors.crowdHigh, soft: colors.dangerSoft, people: 9 },
  NONE: { label: 'Not enough feedback yet', color: colors.textMuted, soft: '#F3EEE7', people: 0 },
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

      {/* People meter — "how full does the mess feel?" */}
      <View style={styles.peopleRow}>
        {Array.from({ length: TOTAL_PEOPLE }, (_, i) => (
          <Ionicons
            key={i}
            name="body"
            size={24}
            color={i < meta.people ? meta.color : 'rgba(43,33,24,0.16)'}
          />
        ))}
      </View>
      {status?.level && (
        <AppText variant="caption" style={{ marginTop: 6 }}>
          Feels like {meta.people} of {TOTAL_PEOPLE} seats are taken
        </AppText>
      )}

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
  peopleRow: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 12,
  },
});
