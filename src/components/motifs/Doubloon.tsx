import React, { useEffect } from 'react';
import { StyleSheet, Pressable, type ViewStyle } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSequence, withSpring, withTiming, interpolate,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { Star } from 'phosphor-react-native';
import { Colors } from '@/lib/colors';
import { Springs } from '@/lib/springs';
import { Stamp } from '@/lib/spacing';
import { HapticFeedback } from '@/lib/haptics';
import { useReducedMotion } from '@/lib/useReducedMotion';

interface DoubloonProps {
  saved: boolean;
  onToggle: () => void;
  size?: number;
  style?: ViewStyle;
  accessibilityLabel?: string;
}

/**
 * A gold doubloon you flip to stash a find. Unsaved = parchment coin with an
 * engraved outline star; saved = gold coin, filled star. Toggling spins the
 * coin on its Y axis with a weighty settle + success haptic.
 */
export function Doubloon({ saved, onToggle, size = 44, style, accessibilityLabel }: DoubloonProps) {
  const flip    = useSharedValue(saved ? 1 : 0);
  const pop     = useSharedValue(1);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) { flip.value = saved ? 1 : 0; return; }
    flip.value = withSpring(saved ? 1 : 0, Springs.drop);
  }, [saved, reduced]);

  const handlePress = () => {
    saved ? HapticFeedback.tap() : HapticFeedback.success();
    if (!reduced) pop.value = withSequence(withSpring(1.18, Springs.stamp), withSpring(1, Springs.snappy));
    onToggle();
  };

  const coinStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 400 },
      { rotateY: `${interpolate(flip.value, [0, 1], [0, 360])}deg` },
      { scale: pop.value },
    ],
  }));

  const r = size / 2;
  const coinFill = saved ? Colors.ACCENT_LIGHT : Colors.SURFACE_LIGHT;

  return (
    <Pressable
      onPress={handlePress}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityState={{ selected: saved }}
      accessibilityLabel={accessibilityLabel ?? (saved ? 'Remove from your stash' : 'Stash this find')}
      style={style}
    >
      <Animated.View style={[styles.coin, { width: size, height: size, borderRadius: r }, coinStyle]}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={StyleSheet.absoluteFill}>
          <Circle cx={r} cy={r} r={r - 1} fill={coinFill} stroke={Colors.INK} strokeWidth={2} />
          <Circle cx={r} cy={r} r={r * 0.74} fill="none" stroke={Colors.INK} strokeWidth={1} strokeDasharray="2,2.5" opacity={0.6} />
        </Svg>
        <Star
          size={size * 0.46}
          color={Colors.INK}
          weight={saved ? 'fill' : 'regular'}
        />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  coin: { alignItems: 'center', justifyContent: 'center', ...Stamp.sm },
});
