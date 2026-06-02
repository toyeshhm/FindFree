import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming } from 'react-native-reanimated';
import { Colors, Spacing, Stamp, Radius } from '@/lib';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { createStyleSheet } from "@/lib/theme";

export function SkeletonCard() {
  const opacity = useSharedValue(0.4);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!reduced) {
      opacity.value = withRepeat(
        withTiming(0.7, { duration: 600 }),
        -1, true
      );
    }
  }, [reduced]);

  const shimmer = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View style={[styles.card, shimmer]}>
      <View style={styles.image} />
      <View style={styles.content}>
        <View style={styles.titleLine} />
        <View style={styles.metaLine} />
      </View>
    </Animated.View>
  );
}

const FILL = Colors.SURFACE_DEEP;
const styles = createStyleSheet((Colors) => ({
  card: {
    marginHorizontal: Spacing.gutter,
    marginBottom:     Spacing.lg,
    backgroundColor:  Colors.SURFACE,
    borderWidth:      2,
    borderColor:      Colors.INK,
    borderRadius:     Radius.md,
    overflow:         'hidden',
    ...Stamp.md,
  },
  image:     { height: 120, backgroundColor: FILL, borderBottomWidth: 2, borderBottomColor: Colors.INK },
  content:   { padding: Spacing.lg, gap: Spacing.sm },
  titleLine: { height: 18, backgroundColor: FILL, width: '70%', borderRadius: 3 },
  metaLine:  { height: 10, backgroundColor: FILL, width: '40%', borderRadius: 3 },
}));
