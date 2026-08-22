import { Platform, StyleSheet, View } from 'react-native';

import { colors, radii, spacing } from '@/shared/theme/tokens';

export default function Card({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.lg,

    // Soft elevation — subtle, not glassy
    ...Platform.select({
      ios: {
        shadowColor: '#2B2118',
        shadowOpacity: 0.05,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
      },
      android: { elevation: 1 },
    }),
  },
});
