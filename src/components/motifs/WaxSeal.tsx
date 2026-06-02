import React from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { Colors } from '@/lib/colors';
import { Fonts } from '@/lib/fonts';

interface WaxSealProps {
  label?: string;
  size?: number;
  color?: string;
  style?: ViewStyle;
}

/** Scalloped wax-seal blob path with `bumps` lobes around the rim. */
function scallop(size: number, bumps = 14): string {
  const c = size / 2;
  const rOuter = size * 0.46;
  const rInner = size * 0.40;
  const steps = bumps * 2;
  let d = '';
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 === 0 ? rOuter : rInner;
    const x = c + Math.cos(a) * r;
    const y = c + Math.sin(a) * r;
    d += i === 0 ? `M ${x.toFixed(2)} ${y.toFixed(2)}` : ` L ${x.toFixed(2)} ${y.toFixed(2)}`;
  }
  return d + ' Z';
}

/**
 * A pressed wax seal. Used as the "FREE" stamp on items and for confirmations.
 * Renders the scalloped wax blob with an embossed inner ring + short label.
 */
export function WaxSeal({ label = 'FREE', size = 56, color = Colors.SEALING_WAX, style }: WaxSealProps) {
  const c = size / 2;
  return (
    <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={StyleSheet.absoluteFill}>
        <Path d={scallop(size)} fill={color} />
        <Circle cx={c} cy={c} r={size * 0.34} fill="none" stroke={Colors.SURFACE_LIGHT} strokeWidth={size * 0.022} opacity={0.55} />
        <Circle cx={c} cy={c} r={size * 0.30} fill="none" stroke={Colors.INK} strokeWidth={size * 0.012} opacity={0.25} />
      </Svg>
      <Text
        style={{
          fontFamily: Fonts.heading800,
          color: Colors.SURFACE_LIGHT,
          fontSize: size * (label.length > 4 ? 0.16 : 0.2),
          letterSpacing: 0.5,
          textAlign: 'center',
        }}
        numberOfLines={1}
        accessible={false}
      >
        {label}
      </Text>
    </View>
  );
}
