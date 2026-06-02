import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from 'phosphor-react-native';
import { Colors, Typography, Spacing, Radius, Stamp } from '@/lib';
import { useNavigation } from '@/navigation/types';
import { createStyleSheet } from '@/lib/theme';

export function NotificationSettingsScreen() {
  const nav = useNavigation();
  const insets = useSafeAreaInsets();

  const [pushEnabled, setPushEnabled] = useState(true);
  const [inAppEnabled, setInAppEnabled] = useState(true);
  const [newDealsEnabled, setNewDealsEnabled] = useState(true);
  const [communityEnabled, setCommunityEnabled] = useState(true);
  const [updatesEnabled, setUpdatesEnabled] = useState(false);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <Pressable
          onPress={() => nav.goBack()}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <ArrowLeft size={22} color={Colors.TEXT_PRIMARY} />
        </Pressable>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xl }}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DELIVERY METHODS</Text>
          <View style={styles.sectionBody}>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Push Notifications</Text>
              <Switch
                value={pushEnabled}
                onValueChange={setPushEnabled}
                trackColor={{ false: Colors.BORDER, true: Colors.ACCENT }}
                thumbColor={pushEnabled ? Colors.WHITE : Colors.TEXT_MUTED}
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.row}>
              <Text style={styles.rowLabel}>In-App Notifications</Text>
              <Switch
                value={inAppEnabled}
                onValueChange={setInAppEnabled}
                trackColor={{ false: Colors.BORDER, true: Colors.ACCENT }}
                thumbColor={inAppEnabled ? Colors.WHITE : Colors.TEXT_MUTED}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>NOTIFICATION TYPES</Text>
          <View style={styles.sectionBody}>
            <View style={styles.row}>
              <View>
                <Text style={styles.rowLabel}>New Free Deals</Text>
                <Text style={styles.rowSubLabel}>When items match your radius</Text>
              </View>
              <Switch
                value={newDealsEnabled}
                onValueChange={setNewDealsEnabled}
                trackColor={{ false: Colors.BORDER, true: Colors.ACCENT }}
                thumbColor={newDealsEnabled ? Colors.WHITE : Colors.TEXT_MUTED}
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.row}>
              <View>
                <Text style={styles.rowLabel}>Community Messages</Text>
                <Text style={styles.rowSubLabel}>Hails and replies</Text>
              </View>
              <Switch
                value={communityEnabled}
                onValueChange={setCommunityEnabled}
                trackColor={{ false: Colors.BORDER, true: Colors.ACCENT }}
                thumbColor={communityEnabled ? Colors.WHITE : Colors.TEXT_MUTED}
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.row}>
              <View>
                <Text style={styles.rowLabel}>App Updates</Text>
                <Text style={styles.rowSubLabel}>News and features</Text>
              </View>
              <Switch
                value={updatesEnabled}
                onValueChange={setUpdatesEnabled}
                trackColor={{ false: Colors.BORDER, true: Colors.ACCENT }}
                thumbColor={updatesEnabled ? Colors.WHITE : Colors.TEXT_MUTED}
              />
            </View>
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
  rowLabel: {
    ...Typography.body,
    color: Colors.TEXT_PRIMARY,
  },
  rowSubLabel: {
    ...Typography.caption,
    color: Colors.TEXT_MUTED,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.BORDER,
  },
}));
