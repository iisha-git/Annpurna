import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { CROWD_LEVELS } from '../domain/crowd-model';
import { AppText } from '@/shared/ui';
import { colors, radii, spacing } from '@/shared/theme/tokens';

/**
 * In-app stand-in for the future PUSH NOTIFICATION.
 * Real version: one-tap actions directly on a system notification,
 * no app open needed. The interaction contract is identical —
 * same copy, same three answers — so nothing else changes later.
 */

const OPTIONS = [
  { level: CROWD_LEVELS.LOW, emoji: '🟢', label: 'Not crowded', bg: colors.successSoft, fg: colors.success },
  { level: CROWD_LEVELS.MODERATE, emoji: '🟠', label: 'Moderately crowded', bg: '#FDF1DC', fg: colors.crowdModerate },
  { level: CROWD_LEVELS.HIGH, emoji: '🔴', label: 'Very crowded', bg: colors.dangerSoft, fg: colors.danger },
];

export default function CrowdFeedbackPrompt({ onSubmit }) {
  return (
    <Modal transparent animationType="fade" statusBarTranslucent>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.pushHeader}>
            <View style={styles.appDot} />
            <AppText variant="caption">Annpurna · now</AppText>
          </View>

          <Text style={styles.title}>Help your friends!</Text>
          <Text style={styles.body}>How crowded is the mess right now?</Text>

          <View style={{ marginTop: spacing.lg, gap: spacing.sm }}>
            {OPTIONS.map((opt) => (
              <Pressable
                key={opt.level}
                onPress={() => onSubmit(opt.level)}
                style={({ pressed }) => [
                  styles.option,
                  { backgroundColor: opt.bg },
                  pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
                ]}>
                <Text style={{ fontSize: 16 }}>{opt.emoji}</Text>
                <Text style={[styles.optionLabel, { color: opt.fg }]}>{opt.label}</Text>
              </Pressable>
            ))}
          </View>

          <AppText variant="caption" style={{ marginTop: spacing.md }}>
            Your answer stays anonymous — friends only see the combined result.
          </AppText>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(43,33,24,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.xl,
  },
  pushHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  appDot: {
    width: 10,
    height: 10,
    borderRadius: radii.pill,
    backgroundColor: colors.accent,
  },
  title: {
    marginTop: spacing.md,
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  body: {
    marginTop: spacing.xs,
    fontSize: 15,
    color: colors.textMuted,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radii.md,
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
});
