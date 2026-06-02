import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius } from '@/lib';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SecondaryButton } from '@/components/SecondaryButton';
import { RopeDivider } from '@/components/motifs/RopeDivider';
import { authService } from '@/services/auth';
import { useNavigation } from '@/navigation/types';
import { createStyleSheet } from "@/lib/theme";

export function SignInScreen() {
  const nav    = useNavigation();
  const insets = useSafeAreaInsets();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);

  const [error,    setError]    = useState('');
  const [focused,  setFocused]  = useState<string | null>(null);

  const handleSubmit = async () => {
    setError('');
    if (!email.includes('@'))  return setError('Enter a valid email address.');
    if (password.length < 1)   return setError('Enter your password.');

    setLoading(true);
    try {
      await authService.signIn(email.trim(), password);
      // Session listener in _layout.tsx auto-navigates to Main
    } catch (e: any) {
      const msg = e?.message ?? '';
      if (msg.includes('Invalid login') || msg.includes('invalid_credentials')) {
        setError('Incorrect email or password. Try again.');
      } else if (msg.includes('Email not confirmed')) {
        setError('Please confirm your email first. Check your inbox for the confirmation link.');
      } else if (msg.includes('network') || msg.includes('fetch') || msg.includes('Failed')) {
        setError("Couldn't connect. Check your connection and try again.");
      } else {
        setError(msg || 'Something went wrong. Try again in a moment.');
      }
    } finally {
      setLoading(false);
    }
  };


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
          <Text style={styles.title}>Sign Aboard</Text>
          <Text style={styles.flavor}>Sign the manifest to rejoin the hunt.</Text>
        </View>

        <View style={styles.fields}>
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
              placeholder="Your password"
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
          label="Sign In"
          onPress={handleSubmit}
          fullWidth
          showArrow
          loading={loading}
          disabled={loading}
        />

        <Pressable
          onPress={() => nav.navigate('ForgotPassword')}
          style={({ pressed }) => [styles.forgotBtn, pressed && { opacity: 0.6 }]}
          accessibilityRole="button"
        >
          <Text style={styles.forgotText}>Forgot your password?</Text>
        </Pressable>

        <RopeDivider style={styles.rope} />

        <SecondaryButton
          label="Create an account instead"
          onPress={() => nav.navigate('Auth', { screen: 'SignUp' })}
          fullWidth
          disabled={loading}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = createStyleSheet((Colors) => ({
  container:  { flexGrow: 1, paddingHorizontal: Spacing.gutter, gap: Spacing.xl },
  heading:    { gap: Spacing.sm },
  title:      { ...Typography.displayHead, color: Colors.TEXT_PRIMARY },
  flavor:     { ...Typography.flavor, color: Colors.TEXT_SECONDARY },
  fields:     { gap: Spacing.md },
  field:      { gap: Spacing.sm },
  label:      { ...Typography.label, color: Colors.TEXT_PRIMARY },
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
  inputFocused: { borderColor: Colors.ACCENT },
  error:      { ...Typography.caption, color: Colors.SEALING_WAX },
  forgotBtn:  { alignItems: 'center', paddingVertical: Spacing.sm },
  forgotText: { ...Typography.caption, color: Colors.SEA, textDecorationLine: 'underline' },
  rope:       { marginVertical: Spacing.xs },
}));
