import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { weekdayKeyFor, WEEKDAYS, MEAL_LABELS } from '../domain/menu-model';
import { formatStartsIn, mealMomentFor } from '../domain/meal-schedule';
import { useWeeklyMenu } from './use-weekly-menu';
import { DoodleBowl } from '@/shared/ui/doodles/Doodles';
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
  const todayKey = weekdayKeyFor(new Date());
  const [selectedDay, setSelectedDay] = useState(todayKey);

  // One snapshot of where we are in today's serving schedule
  const moment = useMemo(() => mealMomentFor(new Date()), []);

  const dayMenu = week ? week[selectedDay] : null;
  const viewingToday = selectedDay === todayKey;

  /** Badge for a meal slot — only exists while browsing TODAY's menu */
  const liveTag = (slot) => {
    if (!viewingToday || slot !== moment.slot) return null;
    return moment.status === 'SERVING'
      ? { text: 'Serving now', live: true }
      : { text: formatStartsIn(moment.minutesUntil), live: false };
  };

  return (
    // Bottom padding = dock height + the popped-out circle's headroom
    <Screen style={styles.screen}>
      <View style={styles.headerRow}>
        <DoodleBowl size={36} />
        <View style={{ flex: 1 }}>
          <AppText variant="h1">Menu</AppText>
          <AppText variant="caption">What's cooking this week</AppText>
        </View>
      </View>

      {/* Day selector chips — circles with a today-marker dot underneath */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0 }} // without this the scroller claims spare vertical space and shoves the cards down
        contentContainerStyle={styles.chipRow}>
        {WEEKDAYS.map((day) => {
          const selected = day === selectedDay;
          const isToday = day === todayKey;
          return (
            <Pressable key={day} onPress={() => setSelectedDay(day)} style={styles.chipWrap}>
              <View style={[styles.chip, selected && styles.chipSelected]}>
                <AppText style={[styles.chipText, selected && styles.chipTextSelected]}>
                  {day}
                </AppText>
              </View>
              <View
                style={[
                  styles.todayDot,
                  isToday && { backgroundColor: selected ? '#FFFFFF' : colors.accent },
                ]}
              />
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
        <View style={{ marginTop: spacing.sm, gap: spacing.sm }}>
          {dayMenu.meals.map((meal) => {
            const tag = liveTag(meal.slot);
            return (
              <Card key={meal.slot} style={[styles.mealCard, tag?.live && styles.mealCardLive]}>
                <View style={styles.mealHeader}>
                  <View style={styles.disc}>
                    <Ionicons name={MEAL_ICONS[meal.slot]} size={20} color={colors.accentPressed} />
                  </View>
                  <View style={styles.titles}>
                    <AppText variant="title">{MEAL_LABELS[meal.slot]}</AppText>
                    <AppText variant="caption">{meal.time}</AppText>
                  </View>
                  {tag && (
                    <View style={[styles.badge, tag.live ? styles.badgeLive : styles.badgeNext]}>
                      <Text style={[styles.badgeText, tag.live && styles.badgeTextLive]}>
                        {tag.text}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Dishes as soft chips — aligned under the title column */}
                <View style={styles.itemsRow}>
                  {meal.items.map((item) => (
                    <View key={item} style={styles.itemChip}>
                      <Text style={styles.itemChipText}>{item}</Text>
                    </View>
                  ))}
                </View>
              </Card>
            );
          })}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingBottom: 110, // dock clearance — the active tab's circle floats ~34px above it
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xs,
  },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  chipWrap: {
    alignItems: 'center',
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
    color: colors.muted,
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
  todayDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginTop: 5,
    backgroundColor: 'transparent',
  },
  mealCard: {
    paddingVertical: spacing.md, // thinner than default — all four meals stay above the dock
  },
  mealCardLive: {
    borderColor: colors.accent,
    borderWidth: 1.4, // the kitchen-is-open glow
  },
  mealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
  },
  disc: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titles: {
    flex: 1,
    gap: 1,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.pill,
  },
  badgeLive: {
    backgroundColor: colors.accent,
  },
  badgeNext: {
    backgroundColor: colors.accentSoft,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.accentPressed,
  },
  badgeTextLive: {
    color: '#FFFFFF',
  },
  itemsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: spacing.sm + 2,
    marginLeft: 48, // lines up with the title column (38px disc + gap)
  },
  itemChip: {
    backgroundColor: colors.background,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radii.pill,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  itemChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textDark,
  },
});
