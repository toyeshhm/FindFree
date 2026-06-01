import React from 'react';
import { Text, StyleSheet, type ViewStyle } from 'react-native';
import { PressableScale } from './PressableScale';
import { HapticFeedback } from '@/lib/haptics';
import { Colors, Typography, Spacing } from '@/lib';

interface SecondaryButtonProps {
  label: string;
  onPress: () => void;
  fullWidth?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export const SecondaryButton = React.memo(function SecondaryButton({
  label, onPress, fullWidth, disabled, style,
}: SecondaryButtonProps) {
  return (
    <PressableScale
      onPress={() => { HapticFeedback.tap(); onPress(); }}
      disabled={disabled}
      style={[styles.container, fullWidth && styles.fullWidth, disabled && styles.disabled, style]}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
    >
      <Text style={styles.label} numberOfLines={1}>
        {label.toUpperCase()}
      </Text>
    </PressableScale>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems:      'center',
    justifyContent:  'center',
    backgroundColor: 'transparent',
    borderWidth:     2,
    borderColor:     Colors.RUST,
    paddingVertical: 14,
    paddingHorizontal: Spacing.base,
    minHeight:       48,
  },
  fullWidth: { width: '100%' },
  disabled:  { opacity: 0.5 },
  label: {
    ...Typography.label,
    color:         Colors.CREAM,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
