import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { initialsFor } from '../domain/profile-model';
import { useProfile } from './use-profile';
import StreakCard from '../../streak/presentation/streak-card';
import { AppText, Screen } from '@/shared/ui';
import { DoodleSparkles } from '@/shared/ui/doodles/Doodles';
import { colors, fonts, radii, spacing } from '@/shared/theme/tokens';

export default function ProfileScreen() {
  const { loading, student } = useProfile();
  const insets = useSafeAreaInsets();

  if (loading) {
    return (
      <Screen style={{ alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.accent} size="large" />
      </Screen>
    );
  }
  if (!student) return null;

  return (
    // Bottom padding = dock clearance — nothing may slide behind the droplet
    <Screen style={styles.screen}>
      {/*
        Hero: a full-bleed espresso sheet pinned to the very top of the screen
        (negative margin cancels the safe-area pad). Its bottom edge dissolves
        into the warm page via stacked opacity strips — no native gradient
        module needed.
      */}
      <View style={[styles.heroWrap, { marginTop: -insets.top }]}>
        <View style={[styles.heroSolid, { paddingTop: insets.top + spacing.lg }]}>
          <View style={styles.avatarRing}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initialsFor(student.name)}</Text>
            </View>
          </View>
          <AppText variant="h1" style={styles.nameText}>
            {student.name}
          </AppText>
          <View style={styles.messBadge}>
            <AppText style={styles.messBadgeText}>Mess No. {student.messNumber}</AppText>
          </View>
        </View>
        {/* dissolve into transparency */}
        <View style={styles.fadeA} />
        <View style={styles.fadeB} />
        <View style={styles.fadeC} />
      </View>

      {/* Quick stats — two friendly tiles instead of a table */}
      <View style={styles.statRow}>
        <StatTile icon="graduation-cap" tint={colors.accent} soft={colors.accentSoft} label="Course">
          {student.course}
        </StatTile>
        <StatTile icon="bed-double-outline" tint="#7B6CF6" soft="#EEEBFD" label="Room">
          {student.room}
        </StatTile>
      </View>

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

function StatTile({ icon, tint, soft, label, children }) {
  return (
    <View style={styles.statTile}>
      <View style={[styles.statIcon, { backgroundColor: soft }]}>
        <MaterialCommunityIcons name={icon} size={22} color={tint} />
      </View>
      <AppText variant="caption">{label}</AppText>
      <AppText numberOfLines={1} style={styles.statValue}>
        {children}
      </AppText>
    </View>
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

const styles = StyleSheet.create({
  screen: {
    paddingBottom: 90, // dock clearance
  },
  heroWrap: {
    // full-bleed: cancel the Screen's horizontal padding
    marginHorizontal: -spacing.xl,
  },
  heroSolid: {
    alignItems: 'center',
    backgroundColor: colors.dark,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  fadeA: {
    height: 14,
    backgroundColor: 'rgba(14,11,19,0.5)',
  },
  fadeB: {
    height: 10,
    backgroundColor: 'rgba(14,11,19,0.22)',
  },
  fadeC: {
    height: 7,
    backgroundColor: 'rgba(14,11,19,0.08)',
  },
  avatarRing: {
    padding: 4,
    borderRadius: radii.pill,
    borderWidth: 2.5,
    borderColor: 'rgba(255,157,0,0.45)', // amber halo on the dark panel
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: radii.pill,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: fonts.display,
    fontSize: 30,
    color: colors.accentPressed,
  },
  nameText: {
    color: colors.textLight,
    marginTop: spacing.md,
  },
  messBadge: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: 7,
    borderRadius: radii.pill,
    backgroundColor: colors.accent, // solid amber — same chip language as Home
  },
  messBadgeText: {
    fontFamily: fonts.bodyBold,
    fontSize: 12.5,
    color: colors.textDark,
  },
  statRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  statTile: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    alignItems: 'flex-start',
  },
  statIcon: {
    width: 38,
    height: 38,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  statValue: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: colors.text,
    marginTop: 1,
  },
  knowWrap: {
    marginTop: spacing.lg,
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
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  tileIcon: {
    width: 38,
    height: 38,
    borderRadius: radii.pill, // circles, not squares — softer with the new identity
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
