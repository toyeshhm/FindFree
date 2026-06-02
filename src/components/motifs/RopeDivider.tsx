import React from 'react';
import { View, type ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Colors } from '@/lib/colors';

interface RopeDividerProps {
  width?: number | string;
  color?: string;
  style?: ViewStyle;
}

/**
 * A twisted nautical rope, drawn as two interleaved sine strands.
 * Used as a section divider in place of a plain hairline.
 */
export function RopeDivider({ width = '100%', color = Colors.ROPE, style }: RopeDividerProps) {
  const h = 10;
  const span = 320; // viewBox units; scales to container width
  const period = 16;
  const amp = 3;
  const strand = (phase: number) => {
    let d = `M 0 ${h / 2}`;
    for (let x = 0; x <= span; x += period / 2) {
      const y = h / 2 + Math.sin((x / period) * Math.PI * 2 + phase) * amp;
      d += ` L ${x.toFixed(1)} ${y.toFixed(2)}`;
    }
    return d;
  };
  return (
    <View style={[{ width: width as ViewStyle['width'], height: h }, style]}>
      <Svg width="100%" height={h} viewBox={`0 0 ${span} ${h}`} preserveAspectRatio="none">
        <Path d={strand(0)} stroke={color} strokeWidth={2.4} fill="none" opacity={0.9} strokeLinecap="round" />
        <Path d={strand(Math.PI)} stroke={color} strokeWidth={2.4} fill="none" opacity={0.5} strokeLinecap="round" />
      </Svg>
    </View>
  );
}
