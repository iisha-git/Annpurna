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
    // Bottom padding = dock height + breathing room — content must never
    // slide behind the dock, or its cream droplet pops over a white card
    <Screen style={styles.screen}>
      <AppText variant="h1">Menu</AppText>
      <AppText variant="caption">What's cooking this week</AppText>

      {/* Day selector chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0 }} // without this the scroller claims spare vertical space and shoves the cards down
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
        <View style={{ marginTop: spacing.xs, gap: spacing.sm }}>
          {dayMenu.meals.map((meal) => (
            <Card key={meal.slot} style={styles.mealCard}>
              <View style={styles.mealHeader}>
                <Ionicons name={MEAL_ICONS[meal.slot]} size={20} color={colors.accent} />
                <AppText variant="title" style={{ marginLeft: spacing.sm }}>
                  {MEAL_LABELS[meal.slot]}
                </AppText>
                <AppText variant="caption" style={{ marginLeft: 'auto' }}>
                  {meal.time}
                </AppText>
              </View>
              <AppText variant="caption" numberOfLines={2} style={styles.mealItems}>
                {meal.items.join(', ')}
              </AppText>
            </Card>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingBottom: 90, // dock clearance — keeps the droplet's "hole" clean
  },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  chip: {
    width: 44, // perfect circles, not pills — day initials only
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  chipSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
  mealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mealCard: {
    paddingVertical: spacing.md, // thinner than default — all four meals stay above the dock
  },
  mealItems: {
    marginTop: spacing.xs,
    color: colors.textMuted,
  },
});
