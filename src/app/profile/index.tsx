import React from 'react';
import { View, Text, Pressable, Alert, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import {
  Gear, MapPin, Link, Info, SignOut, CaretRight, Palette, BellRinging
} from 'phosphor-react-native';
import { Colors, Typography, Spacing, Radius } from '@/lib';
import { ProfileHeader } from '@/features/profile/ProfileHeader';
import { EmptyState } from '@/components/EmptyState';
import { ParchmentOverlay } from '@/components/motifs/ParchmentOverlay';
import { useAuthStore } from '@/stores/useAuthStore';
import { usersService } from '@/services/users';
import { useSavedItems } from '@/hooks/useSavedItems';
import { useNavigation } from '@/navigation/types';
import { useThemeStore } from '@/stores/useThemeStore';
import { createStyleSheet } from "@/lib/theme";

export function ProfileScreen() {
  const nav    = useNavigation();
  const insets = useSafeAreaInsets();

  const { session, signOut } = useAuthStore();
  const { themeName, setTheme } = useThemeStore();

  const { data: user } = useQuery({
    queryKey: ['user', session?.user.id],
    queryFn:  () => usersService.getById(session!.user.id),
    enabled:  !!session,
  });

  const { data: savedItems = [] } = useSavedItems(session?.user.id);

  const savedCount   = savedItems.length;
  const claimedCount = 0;
  const dollarSaved  = 0;

  if (!session) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <EmptyState
          message="Sign aboard to view your papers."
          secondary="Join the crew to log caches and keep your stash."
          actionLabel="Join the Crew"
          onAction={() => nav.navigate('Auth', { screen: 'SignUp' })}
        />
        <ParchmentOverlay />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {user && <ProfileHeader user={{...user, name: session?.user.user_metadata?.name || user.name}} />}

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={[styles.statCell, styles.statCellDivided]}>
            <Text style={styles.statNumber}>
              {savedCount > 0 ? savedCount : '—'}
            </Text>
            <Text style={styles.statLabel}>Deals Saved</Text>
          </View>
          <View style={[styles.statCell, styles.statCellDivided]}>
            <Text style={styles.statNumber}>
              {claimedCount > 0 ? claimedCount : '—'}
            </Text>
            <Text style={styles.statLabel}>Deals Claimed</Text>
          </View>
          <View style={styles.statCell}>
            <Text style={styles.statNumber}>
              {dollarSaved > 0 ? `$${dollarSaved}` : '—'}
            </Text>
            <Text style={styles.statLabel}>$ Saved</Text>
          </View>
        </View>

        <Text style={styles.settingsSectionTitle}>SETTINGS</Text>
        <View style={styles.settingsList}>
          <SettingsRow
            icon={<Gear size={18} color={Colors.ACCENT} />}
            label="Account Settings"
            onPress={() => nav.navigate('AccountSettings')}
            showCaret
            divided
          />
          <SettingsRow
            icon={<BellRinging size={18} color={Colors.ACCENT} />}
            label="Notification Settings"
            onPress={() => nav.navigate('NotificationSettings')}
            showCaret
            divided
          />
          <SettingsRow
            icon={<Palette size={18} color={Colors.ACCENT} />}
            label={`Theme: ${themeName === 'dark' ? 'Midnight' : themeName.charAt(0).toUpperCase() + themeName.slice(1)}`}
            onPress={() => nav.navigate('ThemeSettings')}
            showCaret
            divided
          />
          <SettingsRow
            icon={<Info size={18} color={Colors.ACCENT} />}
            label="About FindFree"
            onPress={() => Alert.alert('FindFree v1.0', 'Aggregating free deals near you.')}
            showCaret
            divided
          />
          <SettingsRow
            icon={<SignOut size={18} color={Colors.SEALING_WAX} />}
            label="Sign Out"
            labelStyle={styles.signOutLabel}
            onPress={signOut}
            showCaret={false}
            divided
          />
        </View>
      </ScrollView>
      <ParchmentOverlay />
    </View>
  );
}

interface SettingsRowProps {
  icon: React.ReactNode;
  label: string;
  labelStyle?: object;
  onPress: () => void;
  showCaret: boolean;
  divided?: boolean;
}

function SettingsRow({ icon, label, labelStyle, onPress, showCaret, divided }: SettingsRowProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.settingsRow,
        divided && styles.settingsRowDivided,
        pressed && styles.settingsRowPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={styles.settingsRowLeft}>
        {icon}
        <Text style={[styles.settingsRowLabel, labelStyle]}>{label}</Text>
      </View>
      {showCaret && <CaretRight size={14} color={Colors.TEXT_MUTED} />}
    </Pressable>
  );
}

const styles = createStyleSheet((Colors) => ({
  container:     { flex: 1, backgroundColor: Colors.BACKGROUND },
  scrollContent: { paddingBottom: 120 },

  // Stats
  statsRow: {
    flexDirection:   'row',
    marginHorizontal: Spacing.base,
    marginVertical:   Spacing.md,
    backgroundColor:  Colors.SURFACE,
    borderWidth:      2,
    borderColor:      Colors.INK,
    borderRadius:     Radius.md,
    overflow:         'hidden',
  },
  statCell: {
    flex:        1,
    padding:     14,
    alignItems:  'center',
  },
  statCellDivided: {
    borderRightWidth: 2,
    borderRightColor: Colors.INK,
  },
  statNumber: {
    ...Typography.sectionTitle,
    color:        Colors.ACCENT,
    marginBottom: 2,
  },
  statLabel: {
    ...Typography.caption,
    color:     Colors.TEXT_MUTED,
    textAlign: 'center',
  },

  // Settings
  settingsSectionTitle: {
    ...Typography.tinyLabel,
    color:        Colors.TEXT_MUTED,
    marginLeft:   Spacing.base,
    marginBottom: 4,
    marginTop:    20,
  },
  settingsList: {
    backgroundColor: Colors.SURFACE,
    borderWidth:     2,
    borderColor:     Colors.INK,
    borderRadius:    Radius.md,
    marginHorizontal: Spacing.base,
    overflow:        'hidden',
  },
  settingsRow: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical:   14,
    minHeight:         52,
  },
  settingsRowDivided: {
    borderTopWidth: 1,
    borderTopColor: Colors.BORDER,
  },
  settingsRowPressed: { backgroundColor: Colors.SURFACE_HOVER },
  settingsRowLeft: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           12,
  },
  settingsRowLabel: {
    ...Typography.body,
    color: Colors.TEXT_PRIMARY,
  },
  signOutLabel: {
    color: Colors.SEALING_WAX,
  },
}));
