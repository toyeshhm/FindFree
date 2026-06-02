import React from 'react';
import { Text, StyleSheet, type ViewStyle } from 'react-native';
import { PressableScale } from './PressableScale';
import { HapticFeedback } from '@/lib/haptics';
import { Colors, Typography, Spacing, Stamp, Radius } from '@/lib';
import { createStyleSheet } from "@/lib/theme";

interface SecondaryButtonProps {
  label: string;
  onPress: () => void;
  fullWidth?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

/** Parchment plaque with ink stroke — the quieter sibling to PrimaryButton. */
export const SecondaryButton = React.memo(function SecondaryButton({
  label, onPress, fullWidth, disabled, style,
}: SecondaryButtonProps) {
  return (
    <PressableScale
      onPress={() => { HapticFeedback.tap(); onPress(); }}
      disabled={disabled}
      variant="stamp"
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

const styles = createStyleSheet((Colors) => ({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.SURFACE,
    borderWidth: 2,
    borderColor: Colors.INK,
    borderRadius: Radius.md,
    paddingVertical: 14,
    paddingHorizontal: Spacing.base,
    minHeight: 54,
    ...Stamp.md,
  },
  fullWidth: { width: '100%' },
  disabled: { opacity: 0.45 },
  label: {
    ...Typography.label,
    color: Colors.INK,
    fontSize: 13,
    letterSpacing: 1.5,
  },
}));
