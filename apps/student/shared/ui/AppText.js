import { StyleSheet, Text } from 'react-native';

import { typography } from '@/shared/theme/tokens';

/**
 * Token-driven Text. Usage: <AppText variant="h1">Hello</AppText>
 * Variants: display | h1 | title | body | caption
 */
export default function AppText({ variant = 'body', color, style, children, ...rest }) {
  return (
    <Text style={[typography[variant], color ? { color } : null, style]} {...rest}>
      {children}
    </Text>
  );
}

export const textVariants = Object.keys(typography);
