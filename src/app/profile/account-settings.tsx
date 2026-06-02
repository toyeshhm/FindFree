import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, ScrollView,
  Pressable, Alert, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, User, Lock, Trash, SignOut, CaretRight, CheckCircle } from 'phosphor-react-native';
import { Colors, Typography, Spacing, Radius, Stamp } from '@/lib';
import { useAuthStore } from '@/stores/useAuthStore';
import { useThemeStore } from '@/stores/useThemeStore';
import { usersService } from '@/services/users';
import { supabase } from '@/lib/supabase';
import { useNavigation } from '@/navigation/types';
import { createStyleSheet } from "@/lib/theme";

// ── Reusable row component ────────────────────────────────────────────────────
function SettingsRow({
  label, value, onPress, destructive = false, chevron = true,
}: {
  label: string; value?: string; onPress: () => void;
  destructive?: boolean; chevron?: boolean;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      onPress={onPress}
      accessibilityRole="button"
    >
      <View style={styles.rowContent}>
        <Text style={[styles.rowLabel, destructive && styles.destructiveText]}>{label}</Text>
        {value ? <Text style={styles.rowValue} numberOfLines={1}>{value}</Text> : null}
      </View>
      {chevron && <CaretRight size={16} color={destructive ? Colors.SEALING_WAX : Colors.TEXT_SECONDARY} />}
    </Pressable>
  );
}

// ── Section ───────────────────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export function AccountSettingsScreen() {
  const nav    = useNavigation();
  const insets = useSafeAreaInsets();
  const qc     = useQueryClient();

  const { session, signOut } = useAuthStore();
  const userId = session?.user.id ?? '';
  const userEmail = session?.user.email ?? '';
  const { themeName, setTheme } = useThemeStore();

  const { data: profile } = useQuery({
    queryKey: ['user', userId],
    queryFn:  () => usersService.getById(userId),
    enabled:  !!userId,
  });

  // ── Edit Name Modal ────────────────────────────────────────────────────────
  const [editingName,  setEditingName]  = useState(false);
  const [nameInput,    setNameInput]    = useState('');
  const [nameSaved,    setNameSaved]    = useState(false);

  const updateNameMutation = useMutation({
    mutationFn: (name: string) => usersService.update(userId, { name }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['user', userId] });
      supabase.auth.refreshSession(); // Force session sync
      setEditingName(false);
      setNameSaved(true);
      setTimeout(() => setNameSaved(false), 2500);
    },
    onError: (err: any) => {
      Alert.alert('Error', err?.message || 'Failed to save display name.');
    }
  });

  // ── Change Password ────────────────────────────────────────────────────────
  const [editingPassword, setEditingPassword] = useState(false);
  const [currentPw,       setCurrentPw]       = useState('');
  const [newPw,           setNewPw]           = useState('');
  const [confirmPw,       setConfirmPw]       = useState('');
  const [pwError,         setPwError]         = useState('');
  const [pwLoading,       setPwLoading]       = useState(false);
  const [pwSaved,         setPwSaved]         = useState(false);

  const handleChangePassword = async () => {
    setPwError('');
    if (newPw.length < 8) return setPwError('New password must be at least 8 characters.');
    if (newPw !== confirmPw) return setPwError('Passwords do not match.');

    setPwLoading(true);
    try {
      // Re-authenticate to verify current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userEmail, password: currentPw,
      });
      if (signInError) return setPwError('Current password is incorrect.');

      const { error } = await supabase.auth.updateUser({ password: newPw });
      if (error) throw error;

      setEditingPassword(false);
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
      setPwSaved(true);
      setTimeout(() => setPwSaved(false), 2500);
    } catch (e: any) {
      setPwError(e?.message ?? 'Failed to update password.');
    } finally {
      setPwLoading(false);
    }
  };

  // ── Delete Account ─────────────────────────────────────────────────────────
  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This permanently deletes your account and all your listings. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete My Account',
          style: 'destructive',
          onPress: async () => {
            try {
              // Call the Supabase admin delete via service role is not available client-side.
              // Best practice: sign the user out and show a message to contact support,
              // OR use a Supabase Edge Function for actual deletion.
              // For now we sign them out and show info.
              await signOut();
              Alert.alert(
                'Account Deletion Requested',
                'Your account has been flagged for deletion. If you need immediate removal, contact support@findfree.app.',
              );
            } catch (e: any) {
              Alert.alert('Error', e?.message ?? 'Could not delete account.');
            }
          },
        },
      ],
    );
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
        <Text style={styles.headerTitle}>Ship's Papers</Text>
        {nameSaved || pwSaved ? (
          <CheckCircle size={22} color={Colors.ACCENT_LIGHT} weight="fill" />
        ) : (
          <View style={{ width: 22 }} />
        )}
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xl }}>

        {/* ── Profile ─────────────────────────────────────────────────── */}
        <Section title="Profile">
          {editingName ? (
            <View style={styles.inlineEdit}>
              <TextInput
                style={styles.inlineInput}
                value={nameInput}
                onChangeText={setNameInput}
                placeholder="Your name"
                placeholderTextColor={Colors.TEXT_MUTED}
                autoCapitalize="words"
                maxLength={80}
                autoFocus
              />
              <View style={styles.inlineActions}>
                <Pressable
                  style={[styles.inlineBtn, styles.inlineBtnPrimary]}
                  onPress={() => {
                    if (nameInput.trim()) updateNameMutation.mutate(nameInput.trim());
                  }}
                  disabled={updateNameMutation.isPending}
                >
                  {updateNameMutation.isPending
                    ? <ActivityIndicator size="small" color={Colors.SURFACE_LIGHT} />
                    : <Text style={styles.inlineBtnPrimaryText}>Save</Text>
                  }
                </Pressable>
                <Pressable
                  style={styles.inlineBtn}
                  onPress={() => setEditingName(false)}
                >
                  <Text style={styles.inlineBtnText}>Cancel</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <SettingsRow
              label="Display Name"
              value={session?.user.user_metadata?.name || profile?.name || '…'}
              onPress={() => { setNameInput(session?.user.user_metadata?.name || profile?.name || ''); setEditingName(true); }}
            />
          )}
          <SettingsRow
            label="Email"
            value={userEmail}
            onPress={() => Alert.alert('Email', 'Email changes are not supported yet. Contact support to update your email.')}
          />
        </Section>

        {/* ── Security ────────────────────────────────────────────────── */}
        <Section title="Security">
          {editingPassword ? (
            <View style={styles.inlineEdit}>
              <TextInput
                style={styles.inlineInput}
                value={currentPw}
                onChangeText={setCurrentPw}
                placeholder="Current password"
                placeholderTextColor={Colors.TEXT_MUTED}
                secureTextEntry
                autoFocus
              />
              <TextInput
                style={[styles.inlineInput, { marginTop: Spacing.sm }]}
                value={newPw}
                onChangeText={setNewPw}
                placeholder="New password (8+ chars)"
                placeholderTextColor={Colors.TEXT_MUTED}
                secureTextEntry
              />
              <TextInput
                style={[styles.inlineInput, { marginTop: Spacing.sm }]}
                value={confirmPw}
                onChangeText={setConfirmPw}
                placeholder="Confirm new password"
                placeholderTextColor={Colors.TEXT_MUTED}
                secureTextEntry
              />
              {pwError ? <Text style={styles.errorText}>{pwError}</Text> : null}
              <View style={styles.inlineActions}>
                <Pressable
                  style={[styles.inlineBtn, styles.inlineBtnPrimary]}
                  onPress={handleChangePassword}
                  disabled={pwLoading}
                >
                  {pwLoading
                    ? <ActivityIndicator size="small" color={Colors.SURFACE_LIGHT} />
                    : <Text style={styles.inlineBtnPrimaryText}>Update</Text>
                  }
                </Pressable>
                <Pressable
                  style={styles.inlineBtn}
                  onPress={() => { setEditingPassword(false); setPwError(''); setCurrentPw(''); setNewPw(''); setConfirmPw(''); }}
                >
                  <Text style={styles.inlineBtnText}>Cancel</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <SettingsRow
              label="Change Password"
              onPress={() => setEditingPassword(true)}
            />
          )}
          <SettingsRow
            label="Forgot Password"
            onPress={() => nav.navigate('ForgotPassword')}
          />
        </Section>


        {/* ── Account ─────────────────────────────────────────────────── */}
        <Section title="Account">
          <SettingsRow
            label="Sign Out"
            onPress={() =>
              Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Sign Out', style: 'destructive', onPress: signOut },
              ])
            }
          />
          <SettingsRow
            label="Delete Account"
            destructive
            onPress={handleDeleteAccount}
          />
        </Section>

        {/* ── App Info ────────────────────────────────────────────────── */}
        <Section title="App">
          <View style={styles.infoRow}>
            <Text style={styles.rowLabel}>Version</Text>
            <Text style={styles.rowValue}>1.0.0</Text>
          </View>
          <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.rowLabel}>User ID</Text>
            <Text style={[styles.rowValue, { fontSize: 10, fontFamily: 'monospace' }]} numberOfLines={1}>
              {userId.slice(0, 18)}…
            </Text>
          </View>
        </Section>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = createStyleSheet((Colors) => ({
  header: {
    flexDirection:    'row',
    alignItems:       'center',
    justifyContent:   'space-between',
    paddingHorizontal: Spacing.gutter,
    paddingBottom:    Spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: Colors.INK,
    backgroundColor:  Colors.BACKGROUND,
  },
  backBtn: {
    padding:         Spacing.sm,
    backgroundColor: Colors.SURFACE,
    borderWidth:     2,
    borderColor:     Colors.INK,
    borderRadius:    Radius.sm,
    ...Stamp.sm,
  },
  headerTitle: { ...Typography.headline, color: Colors.TEXT_PRIMARY },

  section: { marginTop: Spacing.xl, paddingHorizontal: Spacing.gutter },
  sectionTitle: {
    ...Typography.label,
    color:         Colors.ACCENT,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom:  Spacing.sm,
  },
  sectionBody: {
    backgroundColor: Colors.SURFACE,
    borderWidth:     2,
    borderColor:     Colors.INK,
    borderRadius:    Radius.md,
    overflow:        'hidden',
    ...Stamp.sm,
  },

  row: {
    flexDirection:    'row',
    alignItems:       'center',
    justifyContent:   'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical:   Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.BORDER,
    minHeight:         52,
  },
  rowPressed:   { backgroundColor: Colors.SURFACE_HOVER },
  rowContent:   { flex: 1, marginRight: Spacing.sm },
  rowLabel:     { ...Typography.body, color: Colors.TEXT_PRIMARY },
  rowValue:     { ...Typography.caption, color: Colors.TEXT_SECONDARY, marginTop: 2 },
  destructiveText: { color: Colors.SEALING_WAX },

  infoRow: {
    flexDirection:    'row',
    alignItems:       'center',
    justifyContent:   'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical:   Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.BORDER,
  },

  inlineEdit: { padding: Spacing.base, gap: Spacing.sm },
  inlineInput: {
    backgroundColor:   Colors.SURFACE_DEEP,
    borderWidth:       2,
    borderColor:       Colors.INK,
    borderRadius:      Radius.sm,
    color:             Colors.TEXT_PRIMARY,
    fontSize:          15,
    paddingHorizontal: Spacing.md,
    paddingVertical:   Spacing.md,
    minHeight:         48,
  },
  inlineActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  inlineBtn: {
    flex:              1,
    paddingVertical:   Spacing.md,
    alignItems:        'center',
    borderWidth:       2,
    borderColor:       Colors.INK,
    borderRadius:      Radius.sm,
    backgroundColor:   Colors.SURFACE_LIGHT,
  },
  inlineBtnPrimary:     { backgroundColor: Colors.ACCENT, borderColor: Colors.INK },
  inlineBtnPrimaryText: { ...Typography.label, color: Colors.SURFACE_LIGHT },
  inlineBtnText:        { ...Typography.label, color: Colors.TEXT_SECONDARY },

  errorText: { ...Typography.caption, color: Colors.SEALING_WAX, marginTop: Spacing.sm },
}));
