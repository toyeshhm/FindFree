import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet,
  KeyboardAvoidingView, Platform, Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from 'phosphor-react-native';
import { Colors, Typography, Spacing, Radius } from '@/lib';
import { PrimaryButton } from '@/components/PrimaryButton';
import { RopeDivider } from '@/components/motifs/RopeDivider';
import { WaxSeal } from '@/components/motifs/WaxSeal';
import { supabase } from '@/lib/supabase';
import { useNavigation } from '@/navigation/types';
import { createStyleSheet } from "@/lib/theme";

export function ForgotPasswordScreen() {
  const nav    = useNavigation();
  const insets = useSafeAreaInsets();

  const [email,   setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [sent,    setSent]    = useState(false);
  const [focused, setFocused] = useState(false);

  const handleSend = async () => {
    setError('');
    if (!email.includes('@')) return setError('Enter a valid email address.');

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: 'findfree://reset-password',
      });
      if (error) throw error;
      setSent(true);
    } catch (e: any) {
      setError(e?.message ?? 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.BACKGROUND }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <Pressable
          onPress={() => nav.goBack()}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <ArrowLeft size={22} color={Colors.TEXT_PRIMARY} />
        </Pressable>
        <Text style={styles.headerTitle}>Recover Password</Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={[styles.container, { paddingBottom: insets.bottom + Spacing.xl }]}>

        {sent ? (
          /* ── Success state ── */
          <View style={styles.successBox}>
            <WaxSeal label="SENT" size={88} />
            <Text style={styles.successTitle}>Check Your Inbox</Text>
            <Text style={styles.successBody}>
              We dispatched a reset link to{'\n'}
              <Text style={styles.emailHighlight}>{email}</Text>
              {'\n\n'}
              Follow the link to set a new password. Search your spam folder if it hasn't surfaced.
            </Text>
            <Pressable
              onPress={() => { setSent(false); setEmail(''); }}
              style={({ pressed }) => [styles.resendBtn, pressed && { opacity: 0.6 }]}
            >
              <Text style={styles.resendText}>Send to a different email</Text>
            </Pressable>
          </View>
        ) : (
          /* ── Form state ── */
          <>
            <View style={styles.intro}>
              <Text style={styles.title}>Lost Your Password?</Text>
              <Text style={styles.flavor}>
                Mark your account email below and we'll chart you a course back in.
              </Text>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Email address</Text>
              <TextInput
                style={[styles.input, focused && styles.inputFocused]}
                value={email}
                onChangeText={setEmail}
                placeholder="ada@example.com"
                placeholderTextColor={Colors.TEXT_MUTED}
                keyboardType="email-address"
                autoCapitalize="none"
                autoFocus
                returnKeyType="send"
                onSubmitEditing={handleSend}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
              />
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <RopeDivider style={styles.rope} />

            <PrimaryButton
              label="Send Reset Link"
              onPress={handleSend}
              fullWidth
              showArrow
              loading={loading}
              disabled={loading}
            />
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = createStyleSheet((Colors) => ({
  header: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: Spacing.gutter,
    paddingBottom:     Spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: Colors.INK,
    backgroundColor:   Colors.BACKGROUND,
  },
  backBtn:     { padding: Spacing.sm, margin: -Spacing.sm },
  headerTitle: { ...Typography.headline, color: Colors.TEXT_PRIMARY },

  container: {
    flex:              1,
    paddingHorizontal: Spacing.gutter,
    paddingTop:        Spacing.xl,
    gap:               Spacing.xl,
  },
  intro:  { gap: Spacing.sm },
  title:  { ...Typography.displayHead, color: Colors.TEXT_PRIMARY },
  flavor: { ...Typography.flavor, color: Colors.TEXT_SECONDARY },

  field:  { gap: Spacing.sm },
  label:  { ...Typography.label, color: Colors.TEXT_PRIMARY },
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
  error:        { ...Typography.caption, color: Colors.SEALING_WAX },
  rope:         { marginVertical: Spacing.xs },

  successBox: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    gap:            Spacing.xl,
    paddingHorizontal: Spacing.md,
  },
  successTitle:   { ...Typography.displayHead, color: Colors.TEXT_PRIMARY, textAlign: 'center' },
  successBody:    { ...Typography.body, color: Colors.TEXT_SECONDARY, textAlign: 'center', lineHeight: 22 },
  emailHighlight: { color: Colors.TEXT_PRIMARY, fontWeight: '700' },
  resendBtn:      { paddingVertical: Spacing.sm },
  resendText:     { ...Typography.caption, color: Colors.SEA, textDecorationLine: 'underline' },
}));
