import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, fonts, radii, spacing } from '@/shared/theme/tokens';

/**
 * Primary action button.
 * variant: 'primary' (terracotta) | 'soft' (pale accent)
 */
export default function Button({ label, onPress, variant = 'primary', disabled = false, style }) {
  const isPrimary = variant === 'primary';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        isPrimary ? styles.primary : styles.soft,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}>
      {/* Amber background needs dark ink for readable contrast */}
      <Text style={[styles.label, isPrimary ? { color: colors.text } : { color: colors.accentPressed }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  primary: {
    backgroundColor: colors.accent,
  },
  soft: {
    backgroundColor: colors.accentSoft,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.4,
  },
  label: {
    fontSize: 16,
    fontFamily: fonts.bold,
  },
});
