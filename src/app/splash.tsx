import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withDelay,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing } from '@/lib';
import { CompassRose } from '@/components/motifs/CompassRose';
import { RopeDivider } from '@/components/motifs/RopeDivider';
import { ParchmentOverlay } from '@/components/motifs/ParchmentOverlay';
import { useNavigation } from '@/navigation/types';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { createStyleSheet } from "@/lib/theme";

export function SplashScreen() {
  const nav     = useNavigation();
  const insets  = useSafeAreaInsets();
  const reduced = useReducedMotion();

  const compassOpacity  = useSharedValue(0);
  const wordmarkOpacity = useSharedValue(0);
  const taglineOpacity  = useSharedValue(0);

  useEffect(() => {
    const dur = reduced ? 0 : 400;
    compassOpacity.value  = withTiming(1, { duration: dur });
    wordmarkOpacity.value = withDelay(reduced ? 0 : 200, withTiming(1, { duration: dur }));
    taglineOpacity.value  = withDelay(reduced ? 0 : 450, withTiming(1, { duration: dur }));

    const timer = setTimeout(() => nav.replace('Onboarding'), 2500);
    return () => clearTimeout(timer);
  }, []);

  const compassStyle  = useAnimatedStyle(() => ({ opacity: compassOpacity.value }));
  const wordmarkStyle = useAnimatedStyle(() => ({ opacity: wordmarkOpacity.value }));
  const taglineStyle  = useAnimatedStyle(() => ({ opacity: taglineOpacity.value }));

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Animated.View style={[styles.compass, compassStyle]}>
        <CompassRose size={120} settle={!reduced} />
      </Animated.View>

      <Animated.Text style={[styles.wordmark, wordmarkStyle]}>
        FindFree
      </Animated.Text>

      <RopeDivider width={140} style={styles.rope} />

      <Animated.Text style={[styles.tagline, taglineStyle]}>
        Chart a course to free loot nearby.
      </Animated.Text>

      <ParchmentOverlay />
    </View>
  );
}

const styles = createStyleSheet((Colors) => ({
  container: {
    flex:            1,
    backgroundColor: Colors.BACKGROUND,
    alignItems:      'center',
    justifyContent:  'center',
    gap:             Spacing.lg,
  },
  compass: {
    marginBottom: Spacing.sm,
  },
  wordmark: {
    ...Typography.wordmark,
    color:     Colors.TEXT_PRIMARY,
    textAlign: 'center',
  },
  rope: {
    marginVertical: Spacing.xs,
  },
  tagline: {
    ...Typography.flavor,
    color:      Colors.TEXT_SECONDARY,
    textAlign:  'center',
    paddingHorizontal: Spacing.xl,
  },
}));
