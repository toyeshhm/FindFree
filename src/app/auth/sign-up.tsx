import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing } from '@/lib';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SecondaryButton } from '@/components/SecondaryButton';
import { authService } from '@/services/auth';
import { useNavigation } from '@/navigation/types';

export function SignUpScreen() {
  const nav    = useNavigation();
  const insets = useSafeAreaInsets();

  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const handleSubmit = async () => {
    setError('');
    if (!name.trim())          return setError('Add your name so people know who you are.');
    if (!email.includes('@'))  return setError('Enter a valid email address.');
    if (password.length < 8)   return setError('Use at least 8 characters.');

    setLoading(true);
    try {
      await authService.signUp(email.trim(), password, name.trim());
      // Session listener in _layout.tsx auto-navigates to Main
    } catch (e: any) {
      const msg = e?.message ?? '';
      if (msg.includes('already registered')) {
        setError('That email is already registered. Sign in instead?');
      } else if (msg.includes('network') || msg.includes('fetch')) {
        setError("Couldn't connect. Check your connection and try again.");
      } else {
        setError('Something went wrong. Try again in a moment.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.CHARCOAL }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: insets.top + Spacing.hero, paddingBottom: insets.bottom + Spacing.xl }]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Create Account</Text>

        <View style={styles.fields}>
          <View style={styles.field}>
            <Text style={styles.label}>Your name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Ada Lovelace"
              placeholderTextColor={Colors.DISABLED_GRAY}
              autoCapitalize="words"
              returnKeyType="next"
              maxLength={80}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="ada@example.com"
              placeholderTextColor={Colors.DISABLED_GRAY}
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="next"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="At least 8 characters"
              placeholderTextColor={Colors.DISABLED_GRAY}
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
            />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>

        <PrimaryButton
          label={loading ? 'Creating account…' : 'Create Account'}
          onPress={handleSubmit}
          fullWidth
          showArrow
          disabled={loading}
        />

        <SecondaryButton
          label="Already have an account? Sign in"
          onPress={() => nav.navigate('Auth', { screen: 'SignIn' })}
          fullWidth
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:  { flexGrow: 1, paddingHorizontal: Spacing.gutter, gap: Spacing.xl },
  title:      { ...Typography.sectionTitle, color: Colors.CREAM },
  fields:     { gap: Spacing.md },
  field:      { gap: Spacing.sm },
  label:      { ...Typography.label, color: Colors.CREAM },
  input: {
    backgroundColor:   Colors.MID_CHARCOAL,
    borderWidth:       2,
    borderColor:       Colors.RUST,
    color:             Colors.CREAM,
    fontSize:          14,
    paddingHorizontal: Spacing.md,
    paddingVertical:   Spacing.md,
    minHeight:         48,
  },
  error: { ...Typography.caption, color: Colors.RUST_LIGHT },
});
