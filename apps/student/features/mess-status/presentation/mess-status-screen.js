import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import {
  isFutureDay,
  leadingBlanks,
  MONTH_NAMES,
  WEEKDAY_INITIALS,
} from '../domain/mess-status-model';
import { useMonthlyStatus } from './use-monthly-status';
import { AppText, Card, Screen } from '@/shared/ui';
import { colors, radii, spacing } from '@/shared/theme/tokens';

export default function MessStatusScreen() {
  const now = new Date();
  const [viewed, setViewed] = useState({ year: now.getFullYear(), month: now.getMonth() });
  const { loading, statuses } = useMonthlyStatus(viewed.year, viewed.month);

  const atCurrentMonth =
    viewed.year === now.getFullYear() && viewed.month === now.getMonth();

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
    <Screen>
      <AppText variant="h1">Mess Status</AppText>
      <AppText variant="caption">Your month, as the mess recorded it</AppText>

      <Card style={{ marginTop: 16 }}>
        {/* Month navigation */}
        <View style={styles.monthRow}>
          <Pressable onPress={goPrev} hitSlop={12}>
            <Ionicons name="chevron-back" size={22} color={colors.accent} />
          </Pressable>
          <AppText variant="title">
            {MONTH_NAMES[viewed.month]} {viewed.year}
          </AppText>
          <Pressable onPress={goNext} hitSlop={12} disabled={atCurrentMonth}>
            <Ionicons
              name="chevron-forward"
              size={22}
              color={atCurrentMonth ? colors.border : colors.accent}
            />
          </Pressable>
        </View>

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

      {/* Legend */}
      <View style={styles.legend}>
        <Dot color={colors.success} />
        <AppText variant="caption">Present</AppText>
        <Dot color={colors.danger} style={{ marginLeft: 20 }} />
        <AppText variant="caption">Approved Leave</AppText>
      </View>
    </Screen>
  );
}

function DayCell({ day, status, isToday }) {
  const dotColor =
    status === 'PRESENT' ? colors.success : status === 'APPROVED_LEAVE' ? colors.danger : colors.border;

  return (
    <View style={styles.cell}>
      <View style={[styles.dayNumber, isToday && styles.todayRing]}>
        <Text style={[styles.dayText, !status && styles.futureDayText]}>{day}</Text>
      </View>
      <Dot color={dotColor} />
    </View>
  );
}

function Dot({ color, style }) {
  return <View style={[styles.dot, { backgroundColor: color }, style]} />;
}

const styles = StyleSheet.create({
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
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
    fontWeight: '600',
    color: colors.textMuted,
  },
  dayNumber: {
    width: 26,
    height: 26,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  todayRing: {
    borderColor: colors.accent,
  },
  dayText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text,
  },
  futureDayText: {
    color: colors.textMuted,
    fontWeight: '400',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: radii.pill,
    marginTop: 4,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
    paddingLeft: spacing.xs,
  },
});
