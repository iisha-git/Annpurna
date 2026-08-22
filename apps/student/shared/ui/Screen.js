import { SafeAreaView, StyleSheet } from 'react-native-safe-area-context';

import { colors, spacing } from '@/shared/theme/tokens';

/**
 * Standard page container: warm background + safe-area padding.
 * Every tab screen renders inside one of these.
 */
export default function Screen({ children, padded = true, edges = ['top'], style }) {
  return (
    <SafeAreaView edges={edges} style={[styles.screen, padded && styles.padded, style]}>
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  padded: {
    paddingHorizontal: spacing.xl,
  },
});
