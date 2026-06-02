import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withDelay,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing } from '@/lib';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SecondaryButton } from '@/components/SecondaryButton';
import { CompassRose } from '@/components/motifs/CompassRose';
import { RopeDivider } from '@/components/motifs/RopeDivider';
import { ParchmentOverlay } from '@/components/motifs/ParchmentOverlay';
import { useNavigation } from '@/navigation/types';
import { useAuthStore } from '@/stores/useAuthStore';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { createStyleSheet } from "@/lib/theme";

export function OnboardingScreen() {
  const nav     = useNavigation();
  const insets  = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const { setGuest } = useAuthStore();

  const enter = useSharedValue(reduced ? 1 : 0);

  useEffect(() => {
    if (reduced) { enter.value = 1; return; }
    enter.value = withDelay(80, withTiming(1, { duration: 420 }));
  }, [reduced]);

  const topStyle = useAnimatedStyle(() => ({
    opacity:   enter.value,
    transform: [{ translateY: (1 - enter.value) * 18 }],
  }));
  const actionsStyle = useAnimatedStyle(() => ({
    opacity:   enter.value,
    transform: [{ translateY: (1 - enter.value) * 28 }],
  }));

  const handleSignUp = () => nav.navigate('Auth', { screen: 'SignUp' });

  const handleGuest = () => {
    setGuest(true);
    nav.replace('Main', { screen: 'MapTab' });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.hero, paddingBottom: insets.bottom + Spacing.xl }]}>
      <Animated.View style={[styles.top, topStyle]}>
        <CompassRose size={72} settle={!reduced} />
        <Text style={styles.headline}>X Marks the{'\n'}Free Stuff.</Text>
        <Text style={styles.flavor}>
          Every chart hides a cache. Set your bearings and claim what others leave behind.
        </Text>
      </Animated.View>

      <Animated.View style={[styles.actions, actionsStyle]}>
        <RopeDivider style={styles.rope} />
        <Text style={styles.guestNote}>
          Browse and view the chart freely. Sign on to hail posters or stow your finds.
        </Text>
        <PrimaryButton
          label="Create Account"
          onPress={handleSignUp}
          fullWidth
          showArrow
        />
        <SecondaryButton
          label="Browse as a Drifter"
          onPress={handleGuest}
          fullWidth
        />
      </Animated.View>

      <ParchmentOverlay />
    </View>
  );
}

const styles = createStyleSheet((Colors) => ({
  container: {
    flex:              1,
    backgroundColor:   Colors.BACKGROUND,
    paddingHorizontal: Spacing.gutter,
    justifyContent:    'space-between',
  },
  top: { gap: Spacing.base },
  headline: {
    ...Typography.displayHead,
    color: Colors.TEXT_PRIMARY,
  },
  flavor: {
    ...Typography.flavor,
    color: Colors.TEXT_SECONDARY,
  },
  rope: { marginBottom: Spacing.xs },
  guestNote: {
    ...Typography.caption,
    color:     Colors.TEXT_MUTED,
    textAlign: 'center',
  },
  actions: { gap: Spacing.md },
}));
