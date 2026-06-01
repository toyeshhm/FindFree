import React from 'react';
import { Pressable, type PressableProps, type ViewStyle } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring,
} from 'react-native-reanimated';
import { Springs } from '@/lib/springs';
import { useReducedMotion } from '@/lib/useReducedMotion';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface PressableScaleProps extends PressableProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  scaleDown?: number;
}

export function PressableScale({
  children, onPress, disabled, style, scaleDown = 0.97, ...rest
}: PressableScaleProps) {
  const scale   = useSharedValue(1);
  const reduced = useReducedMotion();

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (!reduced) scale.value = withSpring(scaleDown, Springs.snappy);
  };
  const handlePressOut = () => {
    if (!reduced) scale.value = withSpring(1, Springs.snappy);
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
