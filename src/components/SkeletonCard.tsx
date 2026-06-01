import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming } from 'react-native-reanimated';
import { Colors, Spacing } from '@/lib';
import { useReducedMotion } from '@/lib/useReducedMotion';

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

const FILL = Colors.LIGHT_CHARCOAL;
const styles = StyleSheet.create({
  card: {
    marginHorizontal: Spacing.md,
    marginBottom:     Spacing.md,
    backgroundColor:  Colors.MID_CHARCOAL,
    borderLeftWidth:  3,
    borderLeftColor:  Colors.LIGHT_CHARCOAL,
  },
  image:     { height: 80, backgroundColor: FILL },
  content:   { padding: Spacing.md, gap: Spacing.sm },
  titleLine: { height: 14, backgroundColor: FILL, width: '70%' },
  metaLine:  { height: 10, backgroundColor: FILL, width: '40%' },
});
