import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming } from 'react-native-reanimated';
import { Colors, Spacing } from '@/lib';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { createStyleSheet } from "@/lib/theme";

export function SkeletonRow() {
  const opacity = useSharedValue(0.4);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!reduced) {
      opacity.value = withRepeat(withTiming(0.7, { duration: 600 }), -1, true);
    }
  }, [reduced]);

  const shimmer = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View style={[styles.row, shimmer]}>
      <View style={styles.avatar} />
      <View style={styles.lines}>
        <View style={styles.line1} />
        <View style={styles.line2} />
      </View>
    </Animated.View>
  );
}

const FILL = Colors.SURFACE_DEEP;
const styles = createStyleSheet((Colors) => ({
  row:    { flexDirection: 'row', padding: Spacing.base, gap: Spacing.md, alignItems: 'center' },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: FILL, borderWidth: 2, borderColor: Colors.INK },
  lines:  { flex: 1, gap: Spacing.sm },
  line1:  { height: 14, backgroundColor: FILL, width: '60%' },
  line2:  { height: 10, backgroundColor: FILL, width: '40%' },
}));
