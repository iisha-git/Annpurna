import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';

import CrowdCard from './crowd-card';
import CrowdFeedbackPrompt from './crowd-feedback-prompt';
import HeaderDoodles from './header-doodles';
import { useCrowdStatus } from './use-crowd-status';
import TodayFoodCard from '../../menu/presentation/today-food-card';
import { useStreak } from '../../streak/presentation/use-streak';
import * as crowdRepository from '../data/mock-crowd-repository';
import { useProfile } from '../../profile/presentation/use-profile';
import { AppText } from '@/shared/ui';
import { DoodleBowl, DoodleFlame } from '@/shared/ui/doodles/Doodles';
import { colors, fonts, radii, spacing } from '@/shared/theme/tokens';
import { SHOW_SIMULATION_TOOLS } from '@/shared/lib/config';

const MASCOT = require('@/assets/images/moscot.png');

function greetingFor(hour) {
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeScreen() {
  const snap = useCrowdStatus();
  const { student } = useProfile();
  const { streak } = useStreak();
  const insets = useSafeAreaInsets(); // absolute children ignore SafeArea padding
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
        <HeaderDoodles />

        {/* Streak lives in the corner — flame up top, day count under it */}
        <View style={[styles.streakCorner, { top: insets.top + 10 }]} pointerEvents="none">
          <DoodleFlame
            size={34}
            color={streak > 0 ? '#FFB13D' : 'rgba(255,246,232,0.30)'}
            strokeWidth={3}
          />
          <AppText style={[styles.streakCount, streak === 0 && styles.streakCountEmpty]}>
            {streak}
          </AppText>
        </View>

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
        <View style={styles.sectionCaption}>
          <DoodleBowl size={22} color={colors.accent} />
          <AppText variant="caption" style={{ flex: 1 }}>
            Before you walk in…
          </AppText>
        </View>

        <CrowdCard status={snap.status} />

        <TodayFoodCard />

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
    alignItems: 'flex-end', // mascot plants itself on the header's bottom edge
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl + 24,
  },
  headerLeft: {
    flex: 1,
    marginRight: spacing.md,
    paddingBottom: spacing.lg, // text floats; only the mascot touches the floor
  },
  greeting: {
    fontSize: 15,
    color: '#FFC96B', // soft amber — echoes the doodles & brand
    fontFamily: fonts.bodySemi,
    letterSpacing: 0.3,
  },
  userName: {
    fontSize: 32,
    color: '#FFF6E8', // warm cream instead of clinical pure white
    fontFamily: fonts.display,
    marginTop: 4,
  },
  streakCorner: {
    position: 'absolute',
    right: spacing.xl,
    alignItems: 'center',
  },
  streakCount: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: '#FFF6E8',
    marginTop: 2,
  },
  streakCountEmpty: {
    color: 'rgba(255,246,232,0.4)',
  },
  messChip: {
    alignSelf: 'flex-start',
    marginTop: spacing.md,
    backgroundColor: colors.accent, // solid amber — pops off the dark card
    borderRadius: radii.pill,
    paddingVertical: 7,
    paddingHorizontal: spacing.lg,
  },
  messChipText: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: '#17141A', // dark ink on amber for max contrast
  },
  mascot: {
    width: 152,
    height: 152,
  },
  sectionCaption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xl,
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
    color: colors.accentPressed,
    fontFamily: fonts.bold,
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
