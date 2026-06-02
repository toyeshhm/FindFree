import React from 'react';
import { Pressable, type PressableProps, type ViewStyle, type StyleProp } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring,
} from 'react-native-reanimated';
import { Springs } from '@/lib/springs';
import { useReducedMotion } from '@/lib/useReducedMotion';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface PressableScaleProps extends PressableProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  scaleDown?: number;
  /**
   * "stamp" presses the element down-right into its hard offset shadow, like a
   * wax seal being pressed onto paper. Use on elements that carry a Stamp shadow.
   */
  variant?: 'scale' | 'stamp';
  stampOffset?: number;
}

export function PressableScale({
  children, onPress, disabled, style, scaleDown = 0.97,
  variant = 'scale', stampOffset = 3, ...rest
}: PressableScaleProps) {
  const scale   = useSharedValue(1);
  const shift    = useSharedValue(0);
  const reduced = useReducedMotion();

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateX: shift.value },
      { translateY: shift.value },
    ],
  }));

  const handlePressIn = () => {
    if (reduced) return;
    if (variant === 'stamp') shift.value = withSpring(stampOffset, Springs.stamp);
    else scale.value = withSpring(scaleDown, Springs.snappy);
  };
  const handlePressOut = () => {
    if (reduced) return;
    if (variant === 'stamp') shift.value = withSpring(0, Springs.stamp);
    else scale.value = withSpring(1, Springs.snappy);
  };

  return (
    <AnimatedPressable
      onPress={disabled ? undefined : onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[style, animStyle]}
      {...rest}
    >
      {children}
    </AnimatedPressable>
  );
}
