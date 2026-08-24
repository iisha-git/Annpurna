import {
  ActivityIndicator,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { initialsFor } from '../domain/profile-model';
import { useProfile } from './use-profile';
import StreakCard from '../../streak/presentation/streak-card';
import { AppText, Screen } from '@/shared/ui';
import { DoodleSparkles } from '@/shared/ui/doodles/Doodles';
import { colors, fonts, radii, spacing } from '@/shared/theme/tokens';

// 22 micro-strips from overlay opacity down to zero — a gradient without
// expo-linear-gradient (native module not present in the current dev build)
const FADE = Array.from({ length: 22 }, (_, i) =>
  Number((0.62 * (1 - i / 21)).toFixed(3))
);

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
        Hero: a full-bleed cover IMAGE pinned to the very top of the screen
        (negative margin cancels the safe-area pad), dimmed edge-to-edge by an
        espresso overlay so the identity stays readable, then dissolving into
        the warm page via a generated micro-strip gradient (22 slices — reads
        as one continuous fade, no native gradient module needed).

        PLACEHOLDER: swap the require() below for the student's cover photo
        once the backend serves one. The two edit buttons are visual until
        upload exists.
      */}
      <View style={[styles.heroWrap, { marginTop: -insets.top }]}>
        <ImageBackground
          source={require('@/assets/images/icon.png')}
          style={styles.heroSolid}
          imageStyle={styles.heroImage}>
          <View style={[styles.heroOverlay, { paddingTop: insets.top + spacing.lg }]}>
            {/* banner edit — replaces the whole cover photo */}
            <Pressable
              onPress={() => {}}
              hitSlop={8}
              style={[styles.editBtn, { top: insets.top + spacing.sm }]}>
              <MaterialCommunityIcons name="image-edit" size={15} color={colors.textLight} />
            </Pressable>

            <View style={styles.avatarWrap}>
              <View style={styles.avatarRing}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{initialsFor(student.name)}</Text>
                </View>
              </View>
              {/* avatar edit */}
              <Pressable onPress={() => {}} hitSlop={8} style={styles.avatarEditBtn}>
                <MaterialCommunityIcons name="camera" size={13} color={colors.textDark} />
              </Pressable>
            </View>

            <AppText variant="h1" style={styles.nameText}>
              {student.name}
            </AppText>
            <View style={styles.messBadge}>
              <AppText style={styles.messBadgeText}>Mess No. {student.messNumber}</AppText>
            </View>
          </View>
        </ImageBackground>
        {/* dissolve into transparency — 22 micro-strips = smooth ramp */}
        {FADE.map((opacity, i) => (
          <View key={i} style={{ height: 3, backgroundColor: `rgba(14,11,19,${opacity})` }} />
        ))}
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

      {/* Quiet sign-off */}
      <AppText variant="caption" style={styles.versionFooter}>
        Annpurna · student v1.0.0
      </AppText>
    </Screen>
  );
}
function StatTile({ icon, tint, soft, label, children }) {
  return (
    <View style={styles.statTile}>
      <View style={[styles.statIcon, { backgroundColor: soft }]}>
        <MaterialCommunityIcons name={icon} size={18} color={tint} />
      </View>
      <View style={{ flex: 1 }}>
        <AppText variant="caption">{label}</AppText>
        <AppText numberOfLines={1} style={styles.statValue}>
          {children}
        </AppText>
      </View>
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
    backgroundColor: colors.dark, // visible while the image loads / if it fails
  },
  heroImage: {
    resizeMode: 'cover',
  },
  // covers the ENTIRE image area — including behind the status bar
  heroOverlay: {
    backgroundColor: 'rgba(14,11,19,0.72)',
    alignItems: 'center',
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  editBtn: {
    position: 'absolute',
    right: spacing.md,
    width: 32,
    height: 32,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarWrap: {
    position: 'relative', // anchor for the camera button
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
  avatarEditBtn: {
    position: 'absolute',
    right: -4,
    bottom: -2,
    width: 28,
    height: 28,
    borderRadius: radii.pill,
    backgroundColor: colors.accent, // amber — matches the badge language
    borderWidth: 2.5,
    borderColor: 'rgba(14,11,19,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingVertical: spacing.sm, // thin — icon and text share one line
    paddingHorizontal: spacing.md,
  },
  statIcon: {
    width: 34,
    height: 34,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontFamily: fonts.bodyBold,
    fontSize: 13.5,
    color: colors.text,
    marginTop: 0,
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
  versionFooter: {
    textAlign: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
});
