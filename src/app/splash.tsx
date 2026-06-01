import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing } from '@/lib';
import { useNavigation } from '@/navigation/types';
import { useReducedMotion } from '@/lib/useReducedMotion';

export function SplashScreen() {
  const nav     = useNavigation();
  const insets  = useSafeAreaInsets();
  const reduced = useReducedMotion();

  const wordmarkOpacity = useSharedValue(0);
  const taglineOpacity  = useSharedValue(0);

  useEffect(() => {
    const dur = reduced ? 0 : 400;
    wordmarkOpacity.value = withTiming(1, { duration: dur });
    taglineOpacity.value  = withDelay(reduced ? 0 : 300, withTiming(1, { duration: dur }));

    const timer = setTimeout(() => nav.replace('Onboarding'), 2500);
    return () => clearTimeout(timer);
  }, []);

  const wordmarkStyle = useAnimatedStyle(() => ({ opacity: wordmarkOpacity.value }));
  const taglineStyle  = useAnimatedStyle(() => ({ opacity: taglineOpacity.value }));

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Animated.Text style={[styles.wordmark, wordmarkStyle]}>
        FIND{'\n'}FREE
      </Animated.Text>
      <View style={styles.divider} />
      <Animated.Text style={[styles.tagline, taglineStyle]}>
        Free stuff, nearby.
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex:            1,
    backgroundColor: Colors.CHARCOAL,
    alignItems:      'center',
    justifyContent:  'center',
    gap:             Spacing.xl,
  },
  wordmark: {
    ...Typography.displayHero,
    color:         Colors.CREAM,
    textAlign:     'center',
    textTransform: 'uppercase',
    lineHeight:    56,
  },
  divider: {
    width:           60,
    height:          3,
    backgroundColor: Colors.RUST,
  },
  tagline: {
    ...Typography.label,
    color:         Colors.MUTED_ASH,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
