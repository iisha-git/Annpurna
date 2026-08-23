import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { weekdayKeyFor, WEEKDAYS, MEAL_LABELS } from '../domain/menu-model';
import { useWeeklyMenu } from './use-weekly-menu';
import { AppText, Card, Screen } from '@/shared/ui';
import { colors, radii, spacing } from '@/shared/theme/tokens';

const MEAL_ICONS = {
  BREAKFAST: 'sunny-outline',
  LUNCH: 'restaurant-outline',
  SNACKS: 'cafe-outline',
  DINNER: 'moon-outline',
};

export default function MenuScreen() {
  const { loading, week, error } = useWeeklyMenu();
  const [selectedDay, setSelectedDay] = useState(weekdayKeyFor(new Date()));

  const dayMenu = week ? week[selectedDay] : null;

  return (
    <Screen>
      <AppText variant="h1">Menu</AppText>
      <AppText variant="caption">What's cooking this week</AppText>

      {/* Day selector chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}>
        {WEEKDAYS.map((day) => {
          const selected = day === selectedDay;
          return (
            <Pressable
              key={day}
              onPress={() => setSelectedDay(day)}
              style={[styles.chip, selected && styles.chipSelected]}>
              <AppText style={[styles.chipText, selected && styles.chipTextSelected]}>
                {day}
              </AppText>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Body: loading / error / menu */}
      {loading ? (
        <ActivityIndicator style={{ marginTop: spacing.xxl }} color={colors.accent} size="large" />
      ) : error ? (
        <Card style={{ marginTop: spacing.lg }}>
          <AppText>Couldn't load the menu. Pull to retry later.</AppText>
        </Card>
      ) : (
        <View style={{ marginTop: spacing.lg, gap: spacing.md }}>
          {dayMenu.meals.map((meal) => (
            <Card key={meal.slot}>
              <View style={styles.mealHeader}>
                <Ionicons name={MEAL_ICONS[meal.slot]} size={20} color={colors.accent} />
                <AppText variant="title" style={{ marginLeft: spacing.sm }}>
                  {MEAL_LABELS[meal.slot]}
                </AppText>
                <AppText variant="caption" style={{ marginLeft: 'auto' }}>
                  {meal.time}
                </AppText>
              </View>
              <View style={{ marginTop: spacing.sm, gap: spacing.xs }}>
                {meal.items.map((item) => (
                  <AppText key={item} color={colors.text}>
                    •  {item}
                  </AppText>
                ))}
              </View>
            </Card>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  chipRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs + 4,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  chipSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
  mealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
