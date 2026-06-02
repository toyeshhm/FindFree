import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withTiming,
} from 'react-native-reanimated';
import { Colors, Spacing, Stamp, Radius } from '@/lib';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { createStyleSheet } from "@/lib/theme";

/**
 * A blank treasure notice waiting for ink — a parchment card with the full
 * ink border + Stamp shadow, shimmering gently while loot loads.
 */
export function FeedCardSkeleton() {
  const opacity = useSharedValue(0.5);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!reduced) {
      opacity.value = withRepeat(withTiming(0.85, { duration: 700 }), -1, true);
    } else {
      opacity.value = 0.7;
    }
  }, [reduced]);

  const shimmer = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View style={[styles.card, shimmer]} accessible={false}>
      <View style={styles.image} />
      <View style={styles.content}>
        <View style={styles.seal} />
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
  image: {
    height:            120,
    backgroundColor:   FILL,
    borderBottomWidth: 2,
    borderBottomColor: Colors.INK,
  },
  content: { padding: Spacing.lg, gap: Spacing.sm },
  seal: {
    width:        40,
    height:       40,
    borderRadius: Radius.pill,
    backgroundColor: FILL,
  },
  titleLine: { height: 22, backgroundColor: FILL, width: '70%', borderRadius: Radius.sm },
  metaLine:  { height: 12, backgroundColor: FILL, width: '40%', borderRadius: Radius.sm },
}));
