import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';

import CrowdCard from './crowd-card';
import CrowdFeedbackPrompt from './crowd-feedback-prompt';
import { useCrowdStatus } from './use-crowd-status';
import * as crowdRepository from '../data/mock-crowd-repository';
import { useProfile } from '../../profile/presentation/use-profile';
import { AppText } from '@/shared/ui';
import { colors, radii, spacing } from '@/shared/theme/tokens';
import { SHOW_SIMULATION_TOOLS } from '@/shared/lib/config';

const MASCOT = require('@/assets/images/MASKOT.png');

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

  useEffect(() => {
    if (!snap.hasActiveVisit) setPromptClosed(false);
  }, [snap.hasActiveVisit]);

  const firstName = student?.name?.split(' ')[0];

  return (
    <View style={styles.page}>
      <StatusBar style="light" />

      {/* ── Dark header: greeting + identity + mascot ── */}
      <SafeAreaView edges={['top']} style={styles.headerWrap}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <AppText style={styles.greeting}>{greetingFor(new Date().getHours())}</AppText>
            <AppText style={styles.userName} numberOfLines={1}>
              {student?.name ?? '…'}
            </AppText>
            <View style={styles.messChip}>
              <AppText style={styles.messChipText}>Mess No. {student?.messNumber ?? '—'}</AppText>
            </View>
          </View>
          <Image source={MASCOT} style={styles.mascot} resizeMode="contain" />
        </View>
      </SafeAreaView>

      {/* ── Main content ── */}
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}>
        <AppText variant="caption" style={{ marginTop: spacing.lg }}>
          Here's how the mess looks right now
        </AppText>

        <CrowdCard status={snap.status} />

        {snap.canSubmitFeedback && !snap.feedbackPending && promptClosed && (
          <PressableChip label="Answer the crowd check-in" onPress={() => setPromptClosed(false)} />
        )}

        {/* ── Simulation controls (demo builds) ── */}
        {SHOW_SIMULATION_TOOLS && (
          <View style={styles.devArea}>
            <Pressable onPress={() => setDevOpen((v) => !v)} hitSlop={8}>
              <Text style={styles.devToggle}>
                {devOpen ? '▾' : '▸'} DEV SIMULATION (not part of the app)
              </Text>
            </Pressable>
            {devOpen && <SimulationPanel snap={snap} />}
          </View>
        )}
      </ScrollView>

      {snap.feedbackPending && (
        <CrowdFeedbackPrompt
          onDismiss={() => setPromptClosed(true)}
          onSubmit={(level) => {
            crowdRepository.submitFeedback(level);
            setPromptClosed(false);
          }}
        />
      )}
    </View>
  );
}

function PressableChip({ label, onPress }) {
  return (
    <Pressable onPress={onPress} style={styles.reopenChip}>
      <Text style={styles.reopenChipText}>{label}</Text>
    </Pressable>
  );
}

function SimulationPanel({ snap }) {
  const Chip = ({ label, accent = false, onPress }) => (
    <Pressable
      onPress={onPress}
      style={[styles.chip, accent && { borderColor: colors.accentOnDark }]}>
      <Text style={[styles.chipText, accent && { color: colors.accentOnDark }]}>{label}</Text>
    </Pressable>
  );

  return (
    <View style={{ marginTop: spacing.sm, flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
      <Chip
        label={snap.hasActiveVisit ? 'Simulate exit mess' : 'Simulate enter mess'}
        onPress={() => (snap.hasActiveVisit ? crowdRepository.leaveMess() : crowdRepository.enterMess())}
      />
      <Chip label="Override LOW" onPress={() => crowdRepository.setOwnerOverride('LOW')} />
      <Chip label="Override MODERATE" onPress={() => crowdRepository.setOwnerOverride('MODERATE')} />
      <Chip label="Override HIGH" onPress={() => crowdRepository.setOwnerOverride('HIGH')} />
      <Chip label="Clear override" accent onPress={crowdRepository.clearOwnerOverride} />
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerWrap: {
    backgroundColor: colors.dark,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  headerLeft: {
    flex: 1,
    marginRight: spacing.md,
  },
  greeting: {
    fontSize: 14,
    color: colors.onDarkMuted,
    fontWeight: '500',
  },
  userName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },
  messChip: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    backgroundColor: 'rgba(251,247,242,0.12)',
    borderRadius: radii.pill,
    paddingVertical: 5,
    paddingHorizontal: spacing.md,
  },
  messChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F1E4D6',
  },
  mascot: {
    width: 92,
    height: 92,
  },
  reopenChip: {
    alignSelf: 'flex-start',
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
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
    borderRadius: radii.pill,
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
