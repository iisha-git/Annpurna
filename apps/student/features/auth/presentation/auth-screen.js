import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

import { auth } from '@/shared/lib/firebase';
import { AppText, Screen } from '@/shared/ui';
import { DoodleBowl } from '@/shared/ui/doodles/Doodles';
import { colors, fonts, radii, spacing } from '@/shared/theme/tokens';

/**
 * SIGN IN / CREATE ACCOUNT — students register with any email + password.
 * The email is just an account handle; no personal data required.
 * After success, onAuthStateChanged flips and routing takes over.
 */
export default function AuthScreen() {
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function pickMode(next) {
    return () => {
      setMode(next);
      setError('');
    };
  }

  async function handleSubmit() {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      if (mode === 'signin') {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      } else {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
      }
      // AuthProvider hears the change → routing takes over
    } catch (err) {
      setBusy(false);
      setError(friendlyError(err.code));
    }
  }

  return (
    <Screen style={styles.screen}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <DoodleBowl size={64} />
          <AppText variant="display" style={styles.title}>
            Annpurna
          </AppText>
          <AppText variant="caption">Your mess, in your pocket</AppText>

          {/* Mode toggle */}
          <View style={styles.toggle}>
            <Pressable
              style={[styles.toggleBtn, mode === 'signin' && styles.toggleOn]}
              onPress={pickMode('signin')}>
              <Text style={[styles.toggleTxt, mode === 'signin' && styles.toggleTxtOn]}>Sign in</Text>
            </Pressable>
            <Pressable
              style={[styles.toggleBtn, mode === 'signup' && styles.toggleOn]}
              onPress={pickMode('signup')}>
              <Text style={[styles.toggleTxt, mode === 'signup' && styles.toggleTxtOn]}>
                Create account
              </Text>
            </Pressable>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={colors.muted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />
          <TextInput
            style={styles.input}
            placeholder="Password (min 6 characters)"
            placeholderTextColor={colors.muted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {!!error && <Text style={styles.error}>{error}</Text>}

          <Pressable
            style={({ pressed }) => [styles.cta, pressed && { opacity: 0.85 }]}
            onPress={handleSubmit}>
            {busy ? (
              <ActivityIndicator color={colors.textDark} />
            ) : (
              <Text style={styles.ctaText}>
                {mode === 'signin' ? 'Sign in' : 'Create my account'}
              </Text>
            )}
          </Pressable>

          <Text style={styles.fine}>
            Students never edit mess data — menus & leaves come from your owner.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function friendlyError(code) {
  if (code === 'auth/invalid-credential') return 'Wrong email or password.';
  if (code === 'auth/email-already-in-use') return 'That email already has an account — sign in instead.';
  if (code === 'auth/weak-password') return 'Password needs at least 6 characters.';
  if (code === 'auth/invalid-email') return "That doesn't look like a valid email.";
  if (code === 'auth/network-request-failed') return 'No internet connection.';
  return 'Something went wrong. Try again.';
}

const styles = StyleSheet.create({
  screen: {
    justifyContent: 'center',
  },
  scroll: {
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
    gap: spacing.md,
    paddingVertical: spacing.xxl,
  },
  title: {
    marginBottom: -spacing.sm,
  },
  toggle: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radii.pill,
    padding: 4,
    marginTop: spacing.lg,
    alignSelf: 'stretch',
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: radii.pill,
    alignItems: 'center',
  },
  toggleOn: {
    backgroundColor: colors.accent,
  },
  toggleTxt: {
    fontSize: 13.5,
    fontFamily: fonts.bold,
    color: colors.muted,
  },
  toggleTxtOn: {
    color: colors.textDark,
  },
  input: {
    alignSelf: 'stretch',
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 13,
    fontSize: 15,
    color: colors.textDark,
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '600',
  },
  cta: {
    alignSelf: 'stretch',
    backgroundColor: colors.accent,
    borderRadius: radii.md,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  ctaText: {
    fontSize: 15,
    fontFamily: fonts.extra,
    color: colors.textDark,
  },
  fine: {
    fontSize: 12,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 17,
    paddingHorizontal: spacing.xl,
  },
});
