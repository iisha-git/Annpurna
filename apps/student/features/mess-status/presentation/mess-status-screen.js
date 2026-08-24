import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import {
  isFutureDay,
  leadingBlanks,
  MONTH_NAMES,
  WEEKDAY_INITIALS,
} from '../domain/mess-status-model';
import { useMonthlyStatus } from './use-monthly-status';
import { AppText, Card, Screen } from '@/shared/ui';
import { DoodleFlame } from '@/shared/ui/doodles/Doodles';
import { colors, fonts, radii, spacing } from '@/shared/theme/tokens';

export default function MessStatusScreen() {
  const now = new Date();
  const [viewed, setViewed] = useState({ year: now.getFullYear(), month: now.getMonth() });
  const { loading, statuses } = useMonthlyStatus(viewed.year, viewed.month);

  const atCurrentMonth =
    viewed.year === now.getFullYear() && viewed.month === now.getMonth();

  // Month-at-a-glance numbers, recomputed whenever a month's data lands
  const stats = useMemo(() => {
    const values = Object.values(statuses);
    const present = values.filter((s) => s === 'PRESENT').length;
    const leaves = values.filter((s) => s === 'APPROVED_LEAVE').length;
    const rate = values.length ? Math.round((present / values.length) * 100) : 0;
    return { present, leaves, rate };
  }, [statuses]);

  const goPrev = () =>
    setViewed(({ year, month }) =>
      month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 }
    );
  const goNext = () => {
    if (atCurrentMonth) return;
    setViewed(({ year, month }) =>
      month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 }
    );
  };

  // Build the grid: blank offsets + one cell per day
  const blanks = Array.from({ length: leadingBlanks(viewed.year, viewed.month) });
  const totalDays = new Date(viewed.year, viewed.month + 1, 0).getDate();
  const days = Array.from({ length: totalDays }, (_, i) => i + 1);

  return (
    // Bottom padding = dock clearance — nothing may slide behind the droplet
    <Screen style={styles.screen}>
      {/* Hero band — echoes the Home header */}
      <View style={styles.hero}>
        <View style={{ flex: 1 }}>
          <AppText variant="h1" style={styles.heroTitle}>
            Mess Status
          </AppText>
          <AppText variant="caption" style={styles.heroCaption}>
            Your month, as the mess recorded it
          </AppText>
        </View>
        <DoodleFlame size={44} color={colors.accent} />
      </View>

      {/* Floating month switcher */}
      <View style={styles.monthPill}>
        <Pressable onPress={goPrev} hitSlop={12} style={styles.chevron}>
          <Ionicons name="chevron-back" size={20} color={colors.accentOnDark} />
        </Pressable>
        <Text style={styles.monthLabel}>
          {MONTH_NAMES[viewed.month]} {viewed.year}
        </Text>
        <Pressable onPress={goNext} hitSlop={12} disabled={atCurrentMonth} style={styles.chevron}>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={atCurrentMonth ? 'rgba(255,201,107,0.25)' : colors.accentOnDark}
          />
        </Pressable>
      </View>

      {/* Calendar card */}
      <Card>
        {/* Weekday header */}
        <View style={styles.grid}>
          {WEEKDAY_INITIALS.map((d) => (
            <View key={d} style={styles.cell}>
              <Text style={styles.weekdayLabel}>{d}</Text>
            </View>
          ))}
        </View>

        {/* Day grid */}
        {loading ? (
          <View style={{ paddingVertical: 32, alignItems: 'center' }}>
            <ActivityIndicator color={colors.accent} />
          </View>
        ) : (
          <View style={[styles.grid, { marginTop: 4 }]}>
            {blanks.map((_, i) => (
              <View key={`blank-${i}`} style={styles.cell} />
            ))}
            {days.map((day) => (
              <DayCell
                key={day}
                day={day}
                status={
                  isFutureDay(viewed.year, viewed.month, day) ? undefined : statuses[day]
                }
                isToday={
                  viewed.year === now.getFullYear() &&
                  viewed.month === now.getMonth() &&
                  day === now.getDate()
                }
              />
            ))}
          </View>
        )}
      </Card>

      {/* Month-at-a-glance — the three numbers you actually care about */}
      {!loading && (
        <View style={styles.statsRow}>
          <View style={styles.statTile}>
            <Text style={[styles.statValue, { color: colors.success }]}>{stats.present}</Text>
            <AppText variant="caption">Present</AppText>
          </View>
          <View style={styles.statTile}>
            <Text style={[styles.statValue, { color: colors.danger }]}>{stats.leaves}</Text>
            <AppText variant="caption">Leaves</AppText>
          </View>
          <View style={styles.statTile}>
            <Text style={[styles.statValue, { color: colors.accentPressed }]}>
              {stats.rate}%
            </Text>
            <AppText variant="caption">Attendance</AppText>
          </View>
        </View>
      )}

      {/* Legend as soft chips */}
      <View style={styles.legend}>
        <View style={styles.legendChip}>
          <Dot color={colors.success} />
          <AppText variant="caption">Present</AppText>
        </View>
        <View style={styles.legendChip}>
          <Dot color={colors.danger} />
          <AppText variant="caption">Approved Leave</AppText>
        </View>
      </View>
    </Screen>
  );
}

function DayCell({ day, status, isToday }) {
  return (
    <View style={styles.cell}>
      <View
        style={[
          styles.dayBubble,
          status === 'PRESENT' && styles.presentBubble,
          status === 'APPROVED_LEAVE' && styles.leaveBubble,
          !status && styles.emptyBubble,
          isToday && styles.todayRing,
        ]}>
        <Text
          style={[
            styles.dayText,
            status === 'PRESENT' && styles.presentText,
            status === 'APPROVED_LEAVE' && styles.leaveText,
            !status && styles.futureDayText,
          ]}>
          {day}
        </Text>
      </View>
    </View>
  );
}

function Dot({ color }) {
  return <View style={[styles.dot, { backgroundColor: color }]} />;
}

const styles = StyleSheet.create({
  screen: {
    paddingBottom: 90, // dock clearance
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dark,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    marginTop: spacing.sm,
  },
  heroTitle: {
    color: colors.textLight, // cream on the espresso panel
  },
  heroCaption: {
    color: '#FFC96B',
    marginTop: 2,
  },
  monthPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    alignSelf: 'center',
    backgroundColor: colors.dark,
    borderRadius: radii.pill,
    paddingLeft: spacing.xs,
    paddingRight: spacing.xs,
    paddingVertical: spacing.xs,
    marginTop: spacing.md,
    marginBottom: spacing.md,
    minWidth: 210,
  },
  chevron: {
    width: 34,
    height: 34,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthLabel: {
    fontFamily: fonts.display,
    fontSize: 15,
    color: colors.textLight,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 0.85,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekdayLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.muted,
  },
  // Status now fills the whole bubble — colour carries the meaning at a glance
  dayBubble: {
    width: 30,
    height: 30,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  presentBubble: {
    backgroundColor: colors.successSoft,
  },
  leaveBubble: {
    backgroundColor: colors.dangerSoft,
  },
  emptyBubble: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  todayRing: {
    borderColor: colors.accent,
    borderWidth: 2,
  },
  dayText: {
    fontFamily: fonts.bold,
    fontSize: 12.5,
    color: colors.textDark,
  },
  presentText: {
    color: colors.success,
  },
  leaveText: {
    color: colors.danger,
  },
  futureDayText: {
    color: colors.muted,
    fontFamily: fonts.body,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radii.pill,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  legendChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  statTile: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingVertical: spacing.md + 2,
    gap: 2,
  },
  statValue: {
    fontFamily: fonts.display,
    fontSize: 24,
  },
});
