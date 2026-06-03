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
  size?: 'default' | 'small';
}

/**
 * Brass plaque, ink stroke, engraved Cinzel label. Presses into its hard shadow
 * like a wax seal being stamped.
 */
export const PrimaryButton = React.memo(function PrimaryButton({
  label, onPress, fullWidth, showArrow, disabled, loading, style, accessibilityLabel, size = 'default'
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
      accessibilityLabel={accessibilityLabel || label}
      accessibilityState={{ disabled: !!isDisabled, busy: !!loading }}
    >
      <View style={[styles.core, size === 'small' && styles.coreSmall]}>
        {loading ? (
          <ActivityIndicator color={Colors.SURFACE_LIGHT} size={size === 'small' ? 14 : "small"} />
        ) : (
          <>
            <Text style={[styles.label, size === 'small' && styles.labelSmall]} adjustsFontSizeToFit numberOfLines={1}>
              {label.toUpperCase()}
            </Text>
            {showArrow && (
              <View style={styles.iconZone}>
                <ArrowRight size={size === 'small' ? 14 : 18} color={Colors.SURFACE_LIGHT} weight="bold" />
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
  coreSmall: {
    paddingVertical: 8,
    paddingHorizontal: Spacing.md,
    minHeight: 36,
  },
  label: {
    ...Typography.label,
    color: Colors.SURFACE_LIGHT,
    fontSize: 14,
    letterSpacing: 1.5,
  },
  labelSmall: {
    fontSize: 12,
    letterSpacing: 1,
  },
  iconZone: { alignItems: 'center', justifyContent: 'center' },
}));
