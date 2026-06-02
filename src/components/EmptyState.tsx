import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SecondaryButton } from './SecondaryButton';
import { CompassRose } from './motifs/CompassRose';
import { Colors, Typography, Spacing } from '@/lib';
import { createStyleSheet } from "@/lib/theme";

interface EmptyStateProps {
  message: string;
  secondary?: string;
  actionLabel?: string;
  onAction?: () => void;
  /** show the compass motif above the message (default true) */
  icon?: boolean;
}

/**
 * Empty states guide rather than abandon. A settling compass over an
 * aged-ledger line of copy, with an optional way forward.
 */
export function EmptyState({ message, secondary, actionLabel, onAction, icon = true }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      {icon && <CompassRose size={88} settle />}
      <Text style={styles.message}>{message}</Text>
      {secondary && <Text style={styles.secondary}>{secondary}</Text>}
      {actionLabel && onAction && (
        <SecondaryButton label={actionLabel} onPress={onAction} style={styles.action} />
      )}
    </View>
  );
}

const styles = createStyleSheet((Colors) => ({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.hero,
    paddingVertical: Spacing.xxl,
    gap: Spacing.md,
  },
  message: {
    ...Typography.headline,
    color: Colors.TEXT_PRIMARY,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  secondary: {
    ...Typography.flavorSmall,
    color: Colors.TEXT_SECONDARY,
    textAlign: 'center',
  },
  action: { marginTop: Spacing.base },
}));
