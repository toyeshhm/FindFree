import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/lib/colors';

import { useThemeStore } from '@/stores/useThemeStore';

/**
 * Aged-chart depth: a top sheen + burnt-edge vignette, layered non-interactively
 * over a parchment ground. Drop in as the last child of a full-bleed container.
 */
export function ParchmentOverlay() {
  const themeName = useThemeStore(s => s.themeName);
  if (themeName !== 'parchment') return null;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={[Colors.SHEEN, 'transparent', 'transparent']}
        locations={[0, 0.35, 1]}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={['transparent', 'transparent', Colors.VIGNETTE]}
        locations={[0, 0.6, 1]}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}
