import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { initialsFor } from '../domain/profile-model';
import { useProfile } from './use-profile';
import StreakCard from '../../streak/presentation/streak-card';
import { AppText, Card, Screen } from '@/shared/ui';
import { colors, radii, spacing } from '@/shared/theme/tokens';

export default function ProfileScreen() {
  const { loading, student } = useProfile();

  if (loading) {
    return (
      <Screen style={{ alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.accent} size="large" />
      </Screen>
    );
  }
  if (!student) return null;

  return (
    <Screen>
      {/* Identity block */}
      <View style={styles.identity}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initialsFor(student.name)}</Text>
        </View>
        <AppText variant="h1" style={{ marginTop: spacing.md }}>
          {student.name}
        </AppText>
        <View style={styles.messBadge}>
          <AppText style={styles.messBadgeText}>Mess No. {student.messNumber}</AppText>
        </View>
      </View>

      {/* Details */}
      <Card style={{ marginTop: spacing.xl }}>
        <DetailRow label="Course" value={student.course} />
        <DetailRow label="Room" value={student.room} last />
      </Card>

      {/* Crowd check-in streak */}
      <StreakCard />

      <Card style={{ marginTop: spacing.md }}>
        <AppText variant="caption">
          Your mess number and monthly status are managed by the mess owner.
          Leave requests are not made through this app.
        </AppText>
      </Card>
    </Screen>
  );
}

function DetailRow({ label, value, last = false }) {
  return (
    <View style={[styles.row, !last && styles.rowBordered]}>
      <AppText color={colors.textMuted}>{label}</AppText>
      <AppText>{value}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  identity: {
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: radii.pill,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 34,
    fontWeight: '700',
    color: colors.accent,
  },
  messBadge: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: 6,
    borderRadius: radii.pill,
    backgroundColor: colors.accentSoft,
  },
  messBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.accent,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  rowBordered: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
});
