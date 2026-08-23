import { StyleSheet, View } from 'react-native';

import { useStreak } from './use-streak';
import { DoodleFlame } from '@/shared/ui/doodles/Doodles';
import { AppText, Card } from '@/shared/ui';
import { colors, fonts, radii, spacing } from '@/shared/theme/tokens';

/**
 * Flame counter for the Profile tab.
 * Shows the current streak plus one of three states:
 *   1. never checked in        → invitation
 *   2. streak alive, not today → gentle nudge ("keep it")
 *   3. checked in today        → confirmation (done)
 */
export default function StreakCard() {
  const { streak, checkedInToday } = useStreak();

  const caption = !streak && !checkedInToday
    ? 'Answer a crowd check-in to start your streak'
    : checkedInToday
      ? `day streak · today's check-in done`
      : `day streak · check in today to keep it`;

  const flameColor = streak > 0 ? colors.accent : colors.border;

  return (
    <Card style={styles.card}>
      <View style={styles.flameWrap}>
        <DoodleFlame size={32} color={flameColor} />
      </View>
      <View style={{ flex: 1 }}>
        <AppText variant="h1" style={styles.count}>
          {streak}
          <AppText style={styles.unit}> day{streak === 1 ? '' : 's'}</AppText>
        </AppText>
        <AppText variant="caption" style={styles.caption}>
          {caption}
        </AppText>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  flameWrap: {
    width: 56,
    height: 56,
    borderRadius: radii.pill,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.lg,
  },
  count: {
    lineHeight: 32,
  },
  unit: {
    fontFamily: fonts.displayRegular,
    fontSize: 15,
    color: colors.textMuted,
  },
  caption: {
    marginTop: 2,
  },
});
