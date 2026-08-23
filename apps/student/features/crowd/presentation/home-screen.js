import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import CrowdCard from './crowd-card';
import CrowdFeedbackPrompt from './crowd-feedback-prompt';
import { useCrowdStatus } from './use-crowd-status';
import * as crowdRepository from '../data/mock-crowd-repository';
import { useProfile } from '../../profile/presentation/use-profile';
import { AppText, Screen } from '@/shared/ui';
import { colors, spacing } from '@/shared/theme/tokens';

function greetingFor(hour) {
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeScreen() {
  const snap = useCrowdStatus();
  const { student } = useProfile();
  const [promptClosed, setPromptClosed] = useState(false);
  const [devOpen, setDevOpen] = useState(false);

  // Re-arm the prompt for each new visit
  useEffect(() => {
    if (!snap.hasActiveVisit) setPromptClosed(false);
  }, [snap.hasActiveVisit]);

  const firstName = student?.name?.split(' ')[0] ?? '';

  return (
    <Screen>
      <AppText variant="h1">
        {greetingFor(new Date().getHours())}
        {firstName ? `, ${firstName}` : ''}
      </AppText>
      <AppText variant="caption">Here's how the mess looks right now</AppText>

      <CrowdCard status={snap.status} />

      {snap.canSubmitFeedback && !snap.feedbackPending && promptClosed && (
        <Pressable onPress={() => setPromptClosed(false)} style={styles.reopenChip}>
          <Text style={styles.reopenChipText}>Answer the crowd check-in</Text>
        </Pressable>
      )}

      {/* ── Dev-only simulation. Stripped automatically from release builds. ── */}
      {__DEV__ && (
        <View style={styles.devArea}>
          <Pressable onPress={() => setDevOpen((v) => !v)} hitSlop={8}>
            <Text style={styles.devToggle}>{devOpen ? '▾' : '▸'} DEV SIMULATION (not part of the app)</Text>
          </Pressable>
          {devOpen && <SimulationPanel snap={snap} />}
        </View>
      )}

      {snap.feedbackPending && (
        <CrowdFeedbackPrompt
          onDismiss={() => setPromptClosed(true)}
          onSubmit={(level) => {
            crowdRepository.submitFeedback(level);
            setPromptClosed(false);
          }}
        />
      )}
    </Screen>
  );
}

/**
 * Stands in for two things that don't exist yet:
 * - GPS geofencing  → "Enter/leave mess"
 * - Owner panel     → "Override" buttons
 * In the shipped app, GPS triggers everything automatically and __DEV__
 * strips this whole panel out — students never see any of it.
 */
function SimulationPanel({ snap }) {
  return (
    <View style={{ marginTop: spacing.sm, gap: spacing.sm }}>
      <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
        <Chip label={snap.hasActiveVisit ? 'Simulate exit mess' : 'Simulate enter mess'} onPress={() => (snap.hasActiveVisit ? crowdRepository.leaveMess() : crowdRepository.enterMess())} />
        <Chip label="Override LOW" onPress={() => crowdRepository.setOwnerOverride('LOW')} />
        <Chip label="Override MODERATE" onPress={() => crowdRepository.setOwnerOverride('MODERATE')} />
        <Chip label="Override HIGH" onPress={() => crowdRepository.setOwnerOverride('HIGH')} />
        <Chip label="Clear override" accent onPress={crowdRepository.clearOwnerOverride} />
      </View>
    </View>
  );
}

function Chip({ label, onPress, accent = false }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, accent && { borderColor: colors.accent }]}>
      <Text style={[styles.chipText, accent && { color: colors.accent }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  reopenChip: {
    alignSelf: 'flex-start',
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    backgroundColor: colors.accentSoft,
  },
  reopenChipText: {
    color: colors.accent,
    fontWeight: '600',
    fontSize: 14,
  },
  devArea: {
    marginTop: spacing.xl,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderRadius: 16,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  devToggle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: colors.textMuted,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    backgroundColor: colors.surface,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
});
