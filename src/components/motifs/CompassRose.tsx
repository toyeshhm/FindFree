import React, { useEffect } from 'react';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSpring, cancelAnimation, Easing,
} from 'react-native-reanimated';
import Svg, { Circle, Polygon, G, Text as SvgText, Path } from 'react-native-svg';
import { Colors } from '@/lib/colors';
import { Springs } from '@/lib/springs';
import { useReducedMotion } from '@/lib/useReducedMotion';

interface CompassRoseProps {
  size?: number;
  spinning?: boolean;
  settle?: boolean;
  tint?: string;
  goldTint?: string;
}

export function CompassRose({
  size = 96, spinning = false, settle = false,
  tint = Colors.INK, goldTint = Colors.ACCENT,
}: CompassRoseProps) {
  const rot = useSharedValue(settle ? -120 : 0);
  const reduced = useReducedMotion();

  useEffect(() => {
    cancelAnimation(rot);
    if (reduced) { rot.value = 0; return; }
    if (spinning) {
      rot.value = 0;
      rot.value = withRepeat(withTiming(360, { duration: 2200, easing: Easing.linear }), -1, false);
    } else if (settle) {
      rot.value = -120;
      rot.value = withSpring(0, Springs.drop);
    }
    return () => cancelAnimation(rot);
  }, [spinning, settle, reduced]);

  const animStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${rot.value}deg` }] }));

  const c = size / 2;
  const fSize = size * 0.10;
  const dy = fSize * 0.35; // vertical centering offset

  // Main points radius and width
  const pR = size * 0.30;
  const pW = size * 0.07;
  
  // Secondary points radius
  const sR = size * 0.20;

  return (
    <Animated.View style={[{ width: size, height: size }, animStyle]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Outer Ring */}
        <Circle cx={c} cy={c} r={size * 0.37} fill="none" stroke={tint} strokeWidth={size * 0.015} opacity={0.6} />
        <Circle cx={c} cy={c} r={size * 0.35} fill="none" stroke={tint} strokeWidth={size * 0.008} opacity={0.3} />

        {/* Secondary Points (Diagonal) */}
        <G rotation={45} origin={`${c}, ${c}`}>
          {/* North */}
          <Polygon points={`${c},${c - sR} ${c + pW},${c} ${c},${c}`} fill={goldTint} opacity={0.8} />
          <Polygon points={`${c},${c - sR} ${c - pW},${c} ${c},${c}`} fill={tint} opacity={0.5} />
          {/* South */}
          <Polygon points={`${c},${c + sR} ${c + pW},${c} ${c},${c}`} fill={tint} opacity={0.5} />
          <Polygon points={`${c},${c + sR} ${c - pW},${c} ${c},${c}`} fill={goldTint} opacity={0.8} />
          {/* East */}
          <Polygon points={`${c + sR},${c} ${c},${c - pW} ${c},${c}`} fill={tint} opacity={0.5} />
          <Polygon points={`${c + sR},${c} ${c},${c + pW} ${c},${c}`} fill={goldTint} opacity={0.8} />
          {/* West */}
          <Polygon points={`${c - sR},${c} ${c},${c - pW} ${c},${c}`} fill={goldTint} opacity={0.8} />
          <Polygon points={`${c - sR},${c} ${c},${c + pW} ${c},${c}`} fill={tint} opacity={0.5} />
        </G>

        {/* Primary Points (N/S/E/W) */}
        {/* North */}
        <Polygon points={`${c},${c - pR} ${c + pW},${c} ${c},${c}`} fill={goldTint} />
        <Polygon points={`${c},${c - pR} ${c - pW},${c} ${c},${c}`} fill={tint} />
        {/* South */}
        <Polygon points={`${c},${c + pR} ${c + pW},${c} ${c},${c}`} fill={tint} />
        <Polygon points={`${c},${c + pR} ${c - pW},${c} ${c},${c}`} fill={goldTint} />
        {/* East */}
        <Polygon points={`${c + pR},${c} ${c},${c - pW} ${c},${c}`} fill={tint} />
        <Polygon points={`${c + pR},${c} ${c},${c + pW} ${c},${c}`} fill={goldTint} />
        {/* West */}
        <Polygon points={`${c - pR},${c} ${c},${c - pW} ${c},${c}`} fill={goldTint} />
        <Polygon points={`${c - pR},${c} ${c},${c + pW} ${c},${c}`} fill={tint} />

        {/* Center */}
        <Circle cx={c} cy={c} r={size * 0.04} fill={Colors.SURFACE} stroke={tint} strokeWidth={size * 0.015} />

        {/* Labels */}
        <SvgText x={c} y={size * 0.06 + dy} fill={tint} fontSize={fSize} fontWeight="bold" textAnchor="middle" fontFamily="Cinzel_700Bold">N</SvgText>
        <SvgText x={size * 0.94} y={c + dy} fill={tint} fontSize={fSize} fontWeight="bold" textAnchor="middle" fontFamily="Cinzel_700Bold">E</SvgText>
        <SvgText x={c} y={size * 0.94 + dy} fill={tint} fontSize={fSize} fontWeight="bold" textAnchor="middle" fontFamily="Cinzel_700Bold">S</SvgText>
        <SvgText x={size * 0.06} y={c + dy} fill={tint} fontSize={fSize} fontWeight="bold" textAnchor="middle" fontFamily="Cinzel_700Bold">W</SvgText>
      </Svg>
    </Animated.View>
  );
}
