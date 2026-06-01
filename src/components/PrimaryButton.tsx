import React from 'react';
import { Text, StyleSheet, View, type ViewStyle } from 'react-native';
import { ArrowRight } from 'phosphor-react-native';
import { PressableScale } from './PressableScale';
import { HapticFeedback } from '@/lib/haptics';
import { Colors, Typography, Spacing } from '@/lib';

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  fullWidth?: boolean;
  showArrow?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  accessibilityLabel?: string;
}

export const PrimaryButton = React.memo(function PrimaryButton({
  label, onPress, fullWidth, showArrow, disabled, style, accessibilityLabel,
}: PrimaryButtonProps) {
  const handlePress = () => {
    HapticFeedback.tap();
    onPress();
  };

  return (
    <PressableScale
      onPress={handlePress}
      disabled={disabled}
      style={[styles.container, fullWidth && styles.fullWidth, disabled && styles.disabled, style]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: !!disabled }}
    >
      <Text style={styles.label} numberOfLines={1} accessible={false}>
        {label.toUpperCase()}
      </Text>
      {showArrow && (
        <View style={styles.iconZone} accessible={false}>
          <ArrowRight size={16} color={Colors.CREAM} weight="bold" />
        </View>
      )}
    </PressableScale>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems:    'center',
    backgroundColor: Colors.RUST,
    borderWidth:   2,
    borderColor:   Colors.RUST,
    paddingVertical: 14,
    paddingLeft:   Spacing.base,
    paddingRight:  4,
    minHeight:     48,
  },
  fullWidth:  { width: '100%' },
  disabled:   { opacity: 0.5 },
  label: {
    ...Typography.label,
    color:         Colors.CREAM,
    textTransform: 'uppercase',
    letterSpacing: 1,
    flex:          1,
  },
  iconZone: {
    width:  32,
    height: 32,
    backgroundColor:  'rgba(61, 61, 57, 0.3)',
    borderLeftWidth:  1,
    borderLeftColor:  'rgba(61, 61, 57, 0.3)',
    alignItems:       'center',
    justifyContent:   'center',
    marginLeft:       Spacing.sm,
  },
});
