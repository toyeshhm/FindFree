import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, CheckCircle } from 'phosphor-react-native';
import { Colors, Typography, Spacing, Radius, Stamp } from '@/lib';
import { useNavigation } from '@/navigation/types';
import { useThemeStore } from '@/stores/useThemeStore';
import { createStyleSheet } from '@/lib/theme';

export function ThemeSettingsScreen() {
  const nav = useNavigation();
  const insets = useSafeAreaInsets();
  const { themeName, setTheme } = useThemeStore();

  return (
    <View style={styles.container}>
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
        <Text style={styles.headerTitle}>Theme</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xl }}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>APPEARANCE</Text>
          <View style={styles.sectionBody}>
            
            <Pressable
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
              onPress={() => setTheme('parchment')}
            >
              <Text style={styles.rowLabel}>Parchment (Default)</Text>
              {themeName === 'parchment' && <CheckCircle size={20} color={Colors.ACCENT} weight="fill" />}
            </Pressable>

            <View style={styles.divider} />

            <Pressable
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
              onPress={() => setTheme('dark')}
            >
              <Text style={styles.rowLabel}>Midnight</Text>
              {themeName === 'dark' && <CheckCircle size={20} color={Colors.ACCENT} weight="fill" />}
            </Pressable>

            <View style={styles.divider} />

            <Pressable
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
              onPress={() => setTheme('ocean')}
            >
              <Text style={styles.rowLabel}>Ocean</Text>
              {themeName === 'ocean' && <CheckCircle size={20} color={Colors.ACCENT} weight="fill" />}
            </Pressable>

            <View style={styles.divider} />

            <Pressable
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
              onPress={() => setTheme('forest')}
            >
              <Text style={styles.rowLabel}>Forest</Text>
              {themeName === 'forest' && <CheckCircle size={20} color={Colors.ACCENT} weight="fill" />}
            </Pressable>

            <View style={styles.divider} />

            <Pressable
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
              onPress={() => setTheme('sunset')}
            >
              <Text style={styles.rowLabel}>Sunset</Text>
              {themeName === 'sunset' && <CheckCircle size={20} color={Colors.ACCENT} weight="fill" />}
            </Pressable>

          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = createStyleSheet((Colors) => ({
  container: {
    flex: 1,
    backgroundColor: Colors.BACKGROUND,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.gutter,
    paddingBottom: Spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: Colors.INK,
    backgroundColor: Colors.BACKGROUND,
  },
  backBtn: {
    padding: Spacing.sm,
    backgroundColor: Colors.SURFACE,
    borderWidth: 2,
    borderColor: Colors.INK,
    borderRadius: Radius.sm,
    ...Stamp.sm,
  },
  headerTitle: {
    ...Typography.headline,
    color: Colors.TEXT_PRIMARY,
  },
  section: {
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.gutter,
  },
  sectionTitle: {
    ...Typography.tinyLabel,
    color: Colors.TEXT_MUTED,
    marginLeft: Spacing.base,
    marginBottom: 4,
  },
  sectionBody: {
    backgroundColor: Colors.SURFACE,
    borderWidth: 2,
    borderColor: Colors.INK,
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: 14,
    minHeight: 52,
  },
  rowPressed: {
    backgroundColor: Colors.SURFACE_HOVER,
  },
  rowLabel: {
    ...Typography.body,
    color: Colors.TEXT_PRIMARY,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.BORDER,
  },
}));
