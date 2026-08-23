import { StyleSheet, View } from 'react-native';

import { RECOMMENDATIONS, WAIT_ESTIMATES } from '../domain/crowd-rules';
import { AppText, Card } from '@/shared/ui';
import { colors } from '@/shared/theme/tokens';

const LEVEL_STYLE = {
  LOW: { label: 'Low', color: colors.crowdLow },
  MODERATE: { label: 'Moderate', color: colors.crowdModerate },
  HIGH: { label: 'High', color: colors.crowdHigh },
  NONE: { label: 'Not enough feedback yet', color: colors.textMuted },
};

/**
 * The hero card of Annpurna — current mess crowding.
 * Consumes ONLY the resolved CrowdStatus; blind to GPS/reports/overrides.
 */
export default function CrowdCard({ status }) {
  const meta = status?.level ? LEVEL_STYLE[status.level] : LEVEL_STYLE.NONE;

  return (
    <Card style={{ marginTop: 16 }}>
      <View style={styles.headerRow}>
        <AppText variant="title">Mess Crowd</AppText>
        {status?.origin === 'OWNER_OVERRIDE' && (
          <AppText variant="caption" color={colors.accent}>
            set by manager
          </AppText>
        )}
      </View>

      <View style={[styles.pill, { borderColor: meta.color }]}>
        <View style={[styles.dot, { backgroundColor: meta.color }]} />
        <AppText style={{ color: meta.color, fontWeight: '700', fontSize: 18 }}>
          {meta.label}
        </AppText>
      </View>

      <AppText style={{ marginTop: 14 }}>{RECOMMENDATIONS[status?.level] ?? 'Open the app again in a few minutes'}</AppText>

      {WAIT_ESTIMATES[status?.level] && (
        <AppText variant="caption" style={{ marginTop: 4 }}>
          Estimated wait: {WAIT_ESTIMATES[status.level]}
        </AppText>
      )}

      <AppText variant="caption" style={{ marginTop: 10 }}>
        Based on {status?.responseCount ?? 0} responses from students at the mess
      </AppText>
    </Card>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    alignSelf: 'flex-start',
    borderWidth: 2,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 12,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
