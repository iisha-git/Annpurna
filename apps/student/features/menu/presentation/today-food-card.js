import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { useWeeklyMenu } from './use-weekly-menu';
import { MEAL_LABELS, weekdayKeyFor } from '../domain/menu-model';
import { formatStartsIn, mealMomentFor } from '../domain/meal-schedule';
import { DoodleFries } from '@/shared/ui/doodles/Doodles';
import { AppText, Card } from '@/shared/ui';
import { colors, radii, spacing } from '@/shared/theme/tokens';

const MAX_CHIPS = 4;

const DAY_NAMES = {
  SUN: 'Sunday', MON: 'Monday', TUE: 'Tuesday', WED: 'Wednesday',
  THU: 'Thursday', FRI: 'Friday', SAT: 'Saturday',
};

/**
 * Home's "what's cooking" card: next meal + today's dishes.
 * Whole card is pressable → jumps to the Menu tab for the full week.
 */
export default function TodayFoodCard() {
  const router = useRouter();
  const { loading, week } = useWeeklyMenu();

  const moment = useMemo(() => mealMomentFor(new Date()), []);
  const dayKey = weekdayKeyFor(new Date());

  const todayMenu = week?.[dayKey];
  const focusMeal = todayMenu?.meals.find((m) => m.slot === moment.slot);
  const items = focusMeal?.items ?? [];
  const shown = items.slice(0, MAX_CHIPS);
  const extra = items.length - shown.length;

  return (
    <Pressable
      onPress={() => router.push('/menu')}
      style={({ pressed }) => [{ marginTop: spacing.md }, pressed && { transform: [{ scale: 0.985 }] }]}>
      <Card style={styles.card}>
        <View style={styles.headerRow}>
          <View style={styles.titleRow}>
            <DoodleFries size={22} />
            <AppText variant="title">Today's food</AppText>
          </View>
          <AppText variant="caption">{DAY_NAMES[dayKey]}</AppText>
        </View>

        {/* Next-meal strip */}
        <View style={styles.strip}>
          <AppText style={styles.stripMain}>
            {moment.status === 'SERVING' ? MEAL_LABELS[moment.slot] : `Next: ${MEAL_LABELS[moment.slot]}`}
          </AppText>
          <AppText variant="caption">
            {focusMeal ? `${focusMeal.time} · ` : ''}
            {moment.status === 'SERVING' ? 'serving now' : formatStartsIn(moment.minutesUntil)}
          </AppText>
        </View>

        {/* Dish chips */}
        {loading && <AppText variant="caption">Loading today's menu…</AppText>}
        {!loading && (
          <View style={styles.chipsRow}>
            {shown.map((item) => (
              <View key={item} style={styles.chip}>
                <Text style={styles.chipText}>{item}</Text>
              </View>
            ))}
            {extra > 0 && (
              <View style={[styles.chip, styles.moreChip]}>
                <Text style={[styles.chipText, { color: colors.accentPressed }]}>+{extra} more</Text>
              </View>
            )}
          </View>
        )}
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingVertical: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  strip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: spacing.md,
  },
  stripMain: {
    fontSize: 15,
    fontWeight: '700',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  chip: {
    backgroundColor: colors.accentSoft,
    borderRadius: radii.pill,
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
  },
  moreChip: {
    backgroundColor: 'transparent',
    borderWidth: 1.2,
    borderColor: colors.accent,
  },
  chipText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.accentPressed,
  },
});
