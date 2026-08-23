import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { initialsFor } from '../domain/profile-model';
import { useProfile } from './use-profile';
import StreakCard from '../../streak/presentation/streak-card';
import { AppText, Card, Screen } from '@/shared/ui';
import { DoodleSparkles } from '@/shared/ui/doodles/Doodles';
import { colors, fonts, radii, spacing } from '@/shared/theme/tokens';

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

      {/* Good to know — scannable tiles instead of a wall of text */}
      <View style={styles.knowWrap}>
        <View style={styles.knowTitle}>
          <DoodleSparkles size={20} color={colors.accent} />
          <AppText variant="title">Good to know</AppText>
        </View>
        <KnowTile icon="food-croissant" tint={colors.accent} soft={colors.accentSoft}>
          Meals & menu are curated by your mess owner
        </KnowTile>
        <KnowTile icon="calendar-check" tint={colors.success} soft={colors.successSoft}>
          Leave days are arranged through your mess owner
        </KnowTile>
        <KnowTile icon="shield-lock" tint="#7B6CF6" soft="#EEEBFD">
          Mess number & status are view-only — always in sync
        </KnowTile>
      </View>
    </Screen>
  );
}

function KnowTile({ icon, tint, soft, children }) {
  return (
    <View style={styles.tile}>
      <View style={[styles.tileIcon, { backgroundColor: soft }]}>
        <MaterialCommunityIcons name={icon} size={20} color={tint} />
      </View>
      <AppText style={styles.tileText}>{children}</AppText>
    </View>
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
  knowWrap: {
    marginTop: spacing.md,
  },
  knowTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  tile: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  tileIcon: {
    width: 38,
    height: 38,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  tileText: {
    flex: 1,
    fontSize: 13.5,
    fontFamily: fonts.bodySemi,
    color: colors.textMuted,
    lineHeight: 19,
  },
});
