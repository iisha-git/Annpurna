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

import { useAuthSession } from './use-auth-session';
import { AppText, Screen } from '@/shared/ui';
import { DoodleBowl } from '@/shared/ui/doodles/Doodles';
import { colors, fonts, radii, spacing } from '@/shared/theme/tokens';

/**
 * SIGN IN / CREATE ACCOUNT / FORGOT PASSWORD
 *
 * Students identify by mess number:
 * - Sign in:  mess number + password
 * - Sign up:  full name, mobile number, mess number, password, confirm
 * - Forgot:   mess number, registered mobile number, new password, confirm
 */
export default function AuthScreen() {
  const { signIn, signUp, resetPassword } = useAuthSession();
  const [mode, setMode] = useState('signup'); // 'signup' | 'signin' | 'forgot'
  const [messNo, setMessNo] = useState('');
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function pickMode(next) {
    return () => {
      setMode(next);
      setError('');
      setPassword('');
      setConfirmPassword('');
    };
  }

  function localChecks() {
    const mess = messNo.trim();
    const name = fullName.trim().replace(/\s+/g, ' ');
    const mob = mobile.trim().replace(/\D/g, '');

    if (mode === 'signup') {
      if (!mess || !name) throw 'Enter your mess number and full name.';
      if (mob.length !== 10) throw "That doesn't look like a 10-digit mobile number.";
      if (password.length < 6) throw 'Password needs at least 6 characters.';
      if (password !== confirmPassword) throw "Passwords don't match.";
      return { mess, name, mob };
    }

    if (mode === 'forgot') {
      if (!mess) throw 'Enter your mess number.';
      if (mob.length !== 10) throw 'Enter your 10-digit registered mobile number.';
      if (password.length < 6) throw 'New password needs at least 6 characters.';
      if (password !== confirmPassword) throw "Passwords don't match.";
      return { mess, mob };
    }

    if (!mess) throw 'Enter your mess number.';
    if (!password) throw 'Enter your password.';
    return { mess };
  }

  async function handleSubmit() {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const { mess, name, mob } = localChecks();
      if (mode === 'signin') {
        await signIn(mess, password);
      } else if (mode === 'signup') {
        await signUp({ messNumber: mess, name, mobile: mob, password });
      } else if (mode === 'forgot') {
        await resetPassword({ messNumber: mess, mobile: mob, newPassword: password });
      }
      // Session update routes to the tabs automatically
    } catch (err) {
      setBusy(false);
      setError(typeof err === 'string' ? err : err.message);
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

          {/* Mode toggle — visible in signin / signup */}
          {mode !== 'forgot' ? (
            <View style={styles.toggle}>
              <Pressable
                style={[styles.toggleBtn, mode === 'signup' && styles.toggleOn]}
                onPress={pickMode('signup')}>
                <Text style={[styles.toggleTxt, mode === 'signup' && styles.toggleTxtOn]}>
                  Create account
                </Text>
              </Pressable>
              <Pressable
                style={[styles.toggleBtn, mode === 'signin' && styles.toggleOn]}
                onPress={pickMode('signin')}>
                <Text style={[styles.toggleTxt, mode === 'signin' && styles.toggleTxtOn]}>Sign in</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.forgotHeader}>
              <Text style={styles.forgotHeaderTitle}>Reset Password</Text>
              <Text style={styles.forgotHeaderSubtitle}>
                Verify your mess number & registered mobile to set a new password.
              </Text>
            </View>
          )}

          {/* Full name — signup only */}
          {mode === 'signup' && (
            <TextInput
              style={styles.input}
              placeholder="Full name (as per mess records)"
              placeholderTextColor={colors.muted}
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
            />
          )}

          {/* Mess number — all modes */}
          <TextInput
            style={styles.input}
            placeholder="Mess number"
            placeholderTextColor={colors.muted}
            value={messNo}
            onChangeText={(t) => setMessNo(t.replace(/\D/g, ''))}
            keyboardType="number-pad"
          />

          {/* Mobile number — signup & forgot mode */}
          {(mode === 'signup' || mode === 'forgot') && (
            <TextInput
              style={styles.input}
              placeholder="10-digit mobile number (as per mess records)"
              placeholderTextColor={colors.muted}
              value={mobile}
              onChangeText={(t) => setMobile(t.replace(/[^0-9/]/g, ''))}
              keyboardType="phone-pad"
            />
          )}

          {/* Password field */}
          <TextInput
            style={styles.input}
            placeholder={mode === 'forgot' ? 'New password (min 6 characters)' : 'Password (min 6 characters)'}
            placeholderTextColor={colors.muted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {/* Confirm password — signup & forgot */}
          {(mode === 'signup' || mode === 'forgot') && (
            <TextInput
              style={styles.input}
              placeholder="Confirm new password"
              placeholderTextColor={colors.muted}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
          )}

          {/* Forgot password link — signin mode only */}
          {mode === 'signin' && (
            <View style={styles.forgotRow}>
              <Pressable onPress={pickMode('forgot')}>
                <Text style={styles.forgotLinkText}>Forgot password?</Text>
              </Pressable>
            </View>
          )}

          {!!error && <Text style={styles.error}>{error}</Text>}

          {/* Submit button */}
          <Pressable
            style={({ pressed }) => [styles.cta, pressed && { opacity: 0.85 }]}
            onPress={handleSubmit}>
            {busy ? (
              <ActivityIndicator color={colors.textDark} />
            ) : (
              <Text style={styles.ctaText}>
                {mode === 'signin'
                  ? 'Sign in'
                  : mode === 'signup'
                  ? 'Create my account'
                  : 'Reset & Sign in'}
              </Text>
            )}
          </Pressable>

          {/* Back button when in forgot mode */}
          {mode === 'forgot' && (
            <Pressable style={styles.backBtn} onPress={pickMode('signin')}>
              <Text style={styles.backBtnText}>← Back to Sign in</Text>
            </Pressable>
          )}

          <Text style={styles.fine}>
            {mode === 'forgot'
              ? 'Your password will be updated and you will be signed in automatically.'
              : 'Sign in with your mess number and password. Menus and attendance are managed by your mess owner.'}
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
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
  forgotHeader: {
    alignItems: 'center',
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  forgotHeaderTitle: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.textDark,
    marginBottom: 4,
  },
  forgotHeaderSubtitle: {
    fontSize: 13,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 18,
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
  forgotRow: {
    alignSelf: 'stretch',
    alignItems: 'flex-end',
    marginTop: -4,
  },
  forgotLinkText: {
    fontSize: 13,
    color: colors.accentPressed,
    fontFamily: fonts.bold,
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
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
  backBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  backBtnText: {
    fontSize: 13.5,
    color: colors.textDark,
    fontFamily: fonts.bold,
  },
  fine: {
    fontSize: 12,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 17,
    paddingHorizontal: spacing.xl,
  },
});