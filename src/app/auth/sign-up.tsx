import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius } from '@/lib';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SecondaryButton } from '@/components/SecondaryButton';
import { RopeDivider } from '@/components/motifs/RopeDivider';
import { WaxSeal } from '@/components/motifs/WaxSeal';
import { authService } from '@/services/auth';
import { useNavigation } from '@/navigation/types';
import { createStyleSheet } from "@/lib/theme";

export function SignUpScreen() {
  const nav    = useNavigation();
  const insets = useSafeAreaInsets();

  const [name,          setName]          = useState('');
  const [email,         setEmail]         = useState('');
  const [password,      setPassword]      = useState('');
  const [loading,       setLoading]       = useState(false);

  const [error,         setError]         = useState('');
  const [confirmed,     setConfirmed]     = useState(false); // true = awaiting email confirm
  const [resendCooldown, setResendCooldown] = useState(false);
  const [focused,       setFocused]       = useState<string | null>(null);

  const handleSubmit = async () => {
    setError('');
    if (!name.trim())          return setError('Add your name so people know who you are.');
    if (!email.includes('@'))  return setError('Enter a valid email address.');
    if (password.length < 8)   return setError('Use at least 8 characters.');

    setLoading(true);
    try {
      const result = await authService.signUp(email.trim(), password, name.trim());
      // If Supabase returns a session immediately, _layout.tsx handles navigation.
      // If not (email confirmation required), show the confirm screen.
      if (!result?.session) {
        setConfirmed(true);
      }
    } catch (e: any) {
      const msg = e?.message ?? '';
      if (msg.includes('already registered') || msg.includes('already been registered')) {
        setError('That email is already registered. Try signing in instead.');
      } else if (msg.includes('Password should') || msg.includes('password')) {
        setError('Password must be at least 8 characters.');
      } else if (msg.includes('network') || msg.includes('fetch') || msg.includes('Failed')) {
        setError("Couldn't connect. Check your connection and try again.");
      } else if (msg.includes('valid email') || msg.includes('email address')) {
        setError('Please enter a valid email address.');
      } else {
        setError(msg || 'Something went wrong. Try again in a moment.');
      }
    } finally {
      setLoading(false);
    }
  };


  // ── Email confirmation waiting screen ────────────────────────────────────
  if (confirmed) {
    return (
      <View style={[styles.confirmContainer, { paddingTop: insets.top + Spacing.hero, paddingBottom: insets.bottom + Spacing.xl }]}>
        <WaxSeal label="SENT" size={88} />
        <Text style={styles.title}>Check Your Inbox</Text>
        <Text style={styles.confirmBody}>
          We dispatched a confirmation link to{`\n`}
          <Text style={styles.confirmEmail}>{email}</Text>
          {`\n\n`}Follow the link to seal your account, then return here to sign aboard.
        </Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          onPress={async () => {
            if (resendCooldown) return;
            setError('');
            try {
              await authService.signUp(email.trim(), password, name.trim());
              setResendCooldown(true);
              setTimeout(() => setResendCooldown(false), 60000);
            } catch (e: any) {
              setError('Could not resend. Try again in a moment.');
            }
          }}
          style={({ pressed }) => [styles.resendBtn, pressed && { opacity: 0.6 }]}
          disabled={resendCooldown}
        >
          <Text style={[styles.resendText, resendCooldown && { color: Colors.TEXT_MUTED }]}>
            {resendCooldown ? 'Email sent — check your spam folder' : 'Resend confirmation email'}
          </Text>
        </Pressable>

        <SecondaryButton
          label="Back to Sign In"
          onPress={() => nav.navigate('Auth', { screen: 'SignIn' })}
          fullWidth
        />
      </View>
    );
  }

  // ── Sign-up form ─────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.BACKGROUND }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: insets.top + Spacing.hero, paddingBottom: insets.bottom + Spacing.xl }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.heading}>
          <Text style={styles.title}>Join the Crew</Text>
          <Text style={styles.flavor}>Sign on to the manifest and start the hunt.</Text>
        </View>

        <View style={styles.fields}>
          <View style={styles.field}>
            <Text style={styles.label}>Your name</Text>
            <TextInput
              style={[styles.input, focused === 'name' && styles.inputFocused]}
              value={name}
              onChangeText={setName}
              placeholder="Ada Lovelace"
              placeholderTextColor={Colors.TEXT_MUTED}
              autoCapitalize="words"
              returnKeyType="next"
              maxLength={80}
              onFocus={() => setFocused('name')}
              onBlur={() => setFocused(null)}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, focused === 'email' && styles.inputFocused]}
              value={email}
              onChangeText={setEmail}
              placeholder="ada@example.com"
              placeholderTextColor={Colors.TEXT_MUTED}
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="next"
              onFocus={() => setFocused('email')}
              onBlur={() => setFocused(null)}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={[styles.input, focused === 'password' && styles.inputFocused]}
              value={password}
              onChangeText={setPassword}
              placeholder="At least 8 characters"
              placeholderTextColor={Colors.TEXT_MUTED}
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
              onFocus={() => setFocused('password')}
              onBlur={() => setFocused(null)}
            />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>

        <PrimaryButton
          label="Create Account"
          onPress={handleSubmit}
          fullWidth
          showArrow
          loading={loading}
          disabled={loading}
        />

        <RopeDivider style={styles.rope} />

        <SecondaryButton
          label="Already have an account? Sign in"
          onPress={() => nav.navigate('Auth', { screen: 'SignIn' })}
          fullWidth
          disabled={loading}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = createStyleSheet((Colors) => ({
  container:        { flexGrow: 1, paddingHorizontal: Spacing.gutter, gap: Spacing.xl },
  confirmContainer: { flex: 1, paddingHorizontal: Spacing.gutter, gap: Spacing.xl, backgroundColor: Colors.BACKGROUND, alignItems: 'center', justifyContent: 'center' },
  confirmBody:      { ...Typography.body, color: Colors.TEXT_SECONDARY, textAlign: 'center', lineHeight: 22 },
  confirmEmail:     { color: Colors.TEXT_PRIMARY, fontWeight: '700' },
  resendBtn:        { paddingVertical: Spacing.sm },
  resendText:       { ...Typography.caption, color: Colors.SEA, textDecorationLine: 'underline', textAlign: 'center' },
  heading:          { gap: Spacing.sm },
  title:            { ...Typography.displayHead, color: Colors.TEXT_PRIMARY },
  flavor:           { ...Typography.flavor, color: Colors.TEXT_SECONDARY },
  fields:           { gap: Spacing.md },
  field:            { gap: Spacing.sm },
  label:            { ...Typography.label, color: Colors.TEXT_PRIMARY },
  input: {
    ...Typography.body,
    backgroundColor:   Colors.SURFACE_DEEP,
    borderWidth:       2,
    borderColor:       Colors.INK,
    borderRadius:      Radius.md,
    color:             Colors.TEXT_PRIMARY,
    paddingHorizontal: Spacing.base,
    paddingVertical:   Spacing.md,
    minHeight:         48,
  },
  inputFocused:     { borderColor: Colors.ACCENT },
  error:            { ...Typography.caption, color: Colors.SEALING_WAX },
  rope:             { marginVertical: Spacing.xs },
}));
