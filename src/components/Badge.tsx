import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, Radius } from '@/lib';

type BadgeTone = 'wax' | 'brass' | 'parchment';

interface BadgeProps {
  label: string;
  tone?: BadgeTone;
  accessibilityHidden?: boolean;
}

const TONES: Record<BadgeTone, { bg: string; fg: string; border: string }> = {
  wax:       { bg: Colors.SEALING_WAX, fg: Colors.SURFACE_LIGHT, border: Colors.INK },
  brass:     { bg: Colors.ACCENT,      fg: Colors.SURFACE_LIGHT, border: Colors.INK },
  parchment: { bg: Colors.SURFACE_LIGHT, fg: Colors.INK,         border: Colors.INK },
};

/** A small engraved chip. `wax` reads as the FREE stamp; `brass` as a category. */
export function Badge({ label, tone = 'wax', accessibilityHidden }: BadgeProps) {
  const t = TONES[tone];
  return (
    <View style={[styles.container, { backgroundColor: t.bg, borderColor: t.border }]}>
      <Text style={[styles.text, { color: t.fg }]} accessible={!accessibilityHidden}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1.5,
    borderRadius: Radius.sm,
    paddingVertical: 3,
    paddingHorizontal: Spacing.sm,
    alignSelf: 'flex-start',
  },
  text: {
    ...Typography.tinyLabel,
    letterSpacing: 1.5,
  },
});
