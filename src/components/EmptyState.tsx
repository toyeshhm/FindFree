import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SecondaryButton } from './SecondaryButton';
import { Colors, Typography, Spacing } from '@/lib';

interface EmptyStateProps {
  message: string;
  secondary?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ message, secondary, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.message}>{message}</Text>
      {secondary && <Text style={styles.secondary}>{secondary}</Text>}
      {actionLabel && onAction && (
        <SecondaryButton label={actionLabel} onPress={onAction} style={styles.action} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    padding:        Spacing.hero,
    gap:            Spacing.md,
  },
  message: {
    ...Typography.subheading,
    color:     Colors.CREAM,
    textAlign: 'center',
  },
  secondary: {
    ...Typography.body,
    color:     Colors.MUTED_ASH,
    textAlign: 'center',
  },
  action: { marginTop: Spacing.sm },
});
