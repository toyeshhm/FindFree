import React from 'react';
import { Text, StyleSheet, View, ActivityIndicator, type ViewStyle } from 'react-native';
import { ArrowRight } from 'phosphor-react-native';
import { PressableScale } from './PressableScale';
import { HapticFeedback } from '@/lib/haptics';
import { Colors, Typography, Spacing, Stamp, Radius } from '@/lib';
import { createStyleSheet } from "@/lib/theme";

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  fullWidth?: boolean;
  showArrow?: boolean;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  accessibilityLabel?: string;
}

/**
 * Brass plaque, ink stroke, engraved Cinzel label. Presses into its hard shadow
 * like a wax seal being stamped.
 */
export const PrimaryButton = React.memo(function PrimaryButton({
  label, onPress, fullWidth, showArrow, disabled, loading, style, accessibilityLabel,
}: PrimaryButtonProps) {
  const handlePress = () => {
    HapticFeedback.impact();
    onPress();
  };

  const isDisabled = disabled || loading;

  return (
    <PressableScale
      onPress={handlePress}
      disabled={isDisabled}
      variant="stamp"
      style={[styles.shell, fullWidth && styles.fullWidth, isDisabled && styles.disabled, style]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: !!isDisabled, busy: !!loading }}
    >
      <View style={styles.core}>
        {loading ? (
          <ActivityIndicator size="small" color={Colors.SURFACE_LIGHT} />
        ) : (
          <>
            <Text style={styles.label} numberOfLines={1} accessible={false}>
              {label.toUpperCase()}
            </Text>
            {showArrow && (
              <View style={styles.iconZone} accessible={false}>
                <ArrowRight size={15} color={Colors.SURFACE_LIGHT} weight="bold" />
              </View>
            )}
          </>
        )}
      </View>
    </PressableScale>
  );
});

const styles = createStyleSheet((Colors) => ({
  shell: {
    backgroundColor: Colors.ACCENT,
    borderRadius: Radius.md,
    borderWidth: 2,
    borderColor: Colors.INK,
    alignSelf: 'flex-start',
    ...Stamp.md,
  },
  fullWidth: { alignSelf: 'stretch', width: '100%' },
  disabled: { opacity: 0.45 },
  core: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: Spacing.xl,
    minHeight: 54,
    gap: Spacing.sm,
  },
  label: {
    ...Typography.label,
    color: Colors.SURFACE_LIGHT,
    fontSize: 14,
    letterSpacing: 1.5,
  },
  iconZone: { alignItems: 'center', justifyContent: 'center' },
}));
