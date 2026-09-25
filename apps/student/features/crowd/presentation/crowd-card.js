import { Animated, Easing, StyleSheet, View } from 'react-native';
import { useEffect, useRef } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { AppText, Card } from '@/shared/ui';
import { colors, spacing } from '@/shared/theme/tokens';

const TOTAL_PEOPLE = 10;

const LEVELS = {
  LOW: { label: 'Low', color: colors.crowdLow, soft: colors.successSoft, people: 4 },
  MODERATE: { label: 'Moderate', color: colors.crowdModerate, soft: '#FDF1DC', people: 6 },
  HIGH: { label: 'High', color: colors.crowdHigh, soft: colors.dangerSoft, people: 9 },
  NONE: { label: 'Not enough feedback yet', color: colors.textMuted, soft: '#F3EEE7', people: 0 },
};

/** Ultra-short verdict — the pill & people meter do the explaining. */
const SHORT_TAKE = {
  LOW: 'Perfect time to go',
  MODERATE: 'A little busy — your call',
  HIGH: 'Packed right now',
  NONE: 'Waiting for first responses…',
};

function timeAgo(date) {
  if (!date) return '';
  const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
  return mins < 1 ? 'just now' : `${mins} min ago`;
}

/**
 * The hero card of Annpurna — current mess crowding.
 * Consumes ONLY the resolved CrowdStatus; blind to GPS/reports/overrides.
 */
export default function CrowdCard({ status }) {
  const meta = status?.level ? LEVELS[status.level] : LEVELS.NONE;
  const level = status?.level;

  return (
    <Card style={{ marginTop: spacing.md }}>
      <View style={styles.headerRow}>
        <AppText variant="title">Mess crowd</AppText>
        <AppText variant="caption" style={{ fontSize: 11 }}>
          {timeAgo(status?.updatedAt)} · {status?.responseCount ?? 0} responses
        </AppText>
      </View>

      {/* Level pill */}
      <View style={[styles.pill, { backgroundColor: meta.soft }]}>
        <PulsingDot color={meta.color} />
        <AppText style={{ color: meta.color, fontWeight: '800', fontSize: 19 }}>
          {meta.label}
        </AppText>
        {status?.origin === 'OWNER_OVERRIDE' && (
          <AppText variant="caption" style={{ marginLeft: 6 }} color={colors.accentPressed}>
            · set by manager
          </AppText>
        )}
      </View>

      {/* People meter — the visual IS the data */}
      <View style={styles.peopleRow}>
        {Array.from({ length: TOTAL_PEOPLE }, (_, i) => (
          <MaterialCommunityIcons
            key={i}
            name="human-handsdown"
            size={26}
            color={i < meta.people ? meta.color : 'rgba(43,33,24,0.16)'}
          />
        ))}
      </View>

      {/* Live Geofence Headcount */}
      <View style={styles.headcountBadge}>
        <MaterialCommunityIcons name="account-group" size={17} color={colors.accent} />
        <AppText style={styles.headcountText}>
          {status?.headcount != null
            ? `${status.headcount} student${status.headcount === 1 ? '' : 's'} inside mess now`
            : '0 students inside mess now'}
        </AppText>
      </View>

      {/* The ONLY sentence we allow ourselves */}
      <AppText variant="title" style={{ marginTop: spacing.sm, fontSize: 15 }}>
        {SHORT_TAKE[level] ?? SHORT_TAKE.NONE}
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
  headcountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFF6E8',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginTop: 12,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#FFE2B8',
  },
  headcountText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8A4A00',
  },
});
