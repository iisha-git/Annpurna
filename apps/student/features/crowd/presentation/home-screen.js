import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import CrowdCard from './crowd-card';
import CrowdFeedbackPrompt from './crowd-feedback-prompt';
import { useCrowdStatus } from './use-crowd-status';
import * as crowdRepository from '../data/mock-crowd-repository';
import { useProfile } from '../../profile/presentation/use-profile';

// ⚠️ cross-feature import kept one-way (crowd → profile), never circular
import { AppText, Button, Screen } from '@/shared/ui';
import { colors, spacing } from '@/shared/theme/tokens';

export default function HomeScreen() {
  const snap = useCrowdStatus();
  const { student } = useProfile();
  const [promptClosed, setPromptClosed] = useState(false);

  // Re-arm the prompt for each new visit
  useEffect(() => {
    if (!snap.hasActiveVisit) setPromptClosed(false);
  }, [snap.hasActiveVisit]);

  const firstName = student?.name?.split(' ')[0] ?? 'there';

  return (
    <Screen>
      <AppText variant="h1">Hi, {firstName}</AppText>
      <AppText variant="caption">Here's how the mess looks right now</AppText>

      <CrowdCard status={snap.status} />

      {snap.canSubmitFeedback && !snap.feedbackPending && promptClosed && (
        <Pressable onPress={() => setPromptClosed(false)} style={styles.reopenChip}>
          <AppText style={{ color: colors.accent, fontWeight: '600' }}>
            Answer the crowd check-in
          </AppText>
        </Pressable>
      )}

      {__DEV__ && <SimulationPanel snap={snap} />}

      {snap.feedbackPending && (
        <CrowdFeedbackPrompt
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
 * Dev-only controls standing in for GPS + owner panel.
 * __DEV__ is a React Native global — true in dev builds, false in production.
 */
function SimulationPanel({ snap }) {
  return (
    <View style={styles.devBox}>
      <AppText variant="caption">SIMULATION TOOLS (dev builds only)</AppText>
      <View style={{ marginTop: spacing.sm, gap: spacing.sm }}>
        <Button
          label={snap.hasActiveVisit ? 'Leave mess (simulate exit)' : 'Enter mess (simulate GPS)'}
          variant="soft"
          onPress={() => (snap.hasActiveVisit ? crowdRepository.leaveMess() : crowdRepository.enterMess())}
        />
        <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
          {['LOW', 'MODERATE', 'HIGH'].map((lvl) => (
            <Pressable key={lvl} style={styles.chip} onPress={() => crowdRepository.setOwnerOverride(lvl)}>
              <Text style={styles.chipText}>Override {lvl}</Text>
            </Pressable>
          ))}
          <Pressable style={[styles.chip, { borderColor: colors.accent }]} onPress={crowdRepository.clearOwnerOverride}>
            <Text style={[styles.chipText, { color: colors.accent }]}>Clear override</Text>
          </Pressable>
        </View>
      </View>
    </View>
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
  devBox: {
    marginTop: spacing.xl,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderRadius: 16,
    padding: spacing.lg,
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
