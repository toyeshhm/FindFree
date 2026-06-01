import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing } from '@/lib';

interface BadgeProps {
  label: string;
  accessibilityHidden?: boolean;
}

export function Badge({ label, accessibilityHidden }: BadgeProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.text} accessible={!accessibilityHidden}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.RUST,
    paddingVertical:   2,
    paddingHorizontal: Spacing.sm - 2,
  },
  text: {
    ...Typography.tinyLabel,
    color:         Colors.CREAM,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
});
