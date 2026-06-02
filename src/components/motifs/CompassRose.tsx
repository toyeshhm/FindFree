import React, { useEffect } from 'react';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSpring, cancelAnimation, Easing,
} from 'react-native-reanimated';
import Svg, { Circle, Polygon, G, Line, Text as SvgText } from 'react-native-svg';
import { Colors } from '@/lib/colors';
import { Springs } from '@/lib/springs';
import { useReducedMotion } from '@/lib/useReducedMotion';

interface CompassRoseProps {
  size?: number;
  /** continuous slow spin (pull-to-refresh / loading) */
  spinning?: boolean;
  /** one-shot settle spin on mount (splash / focus) */
  settle?: boolean;
  tint?: string;
  goldTint?: string;
}

/**
 * An engraved compass rose. The four-point ink star sits over a gold
 * secondary star and a ring. Optionally spins (loading) or settles (mount).
 */
export function CompassRose({
  size = 96, spinning = false, settle = false,
  tint = Colors.INK, goldTint = Colors.ACCENT_LIGHT,
}: CompassRoseProps) {
  const rot     = useSharedValue(settle ? -120 : 0);
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
  const R = size * 0.46;   // long-point radius
  const w = size * 0.085;  // waist
  const r2 = size * 0.30;  // secondary star
  const w2 = size * 0.06;

  const star = (rad: number, waist: number) =>
    `${c},${c - rad} ${c + waist},${c - waist} ${c + rad},${c} ${c + waist},${c + waist} ` +
    `${c},${c + rad} ${c - waist},${c + waist} ${c - rad},${c} ${c - waist},${c - waist}`;

  return (
    <Animated.View style={[{ width: size, height: size }, animStyle]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle cx={c} cy={c} r={R + size * 0.03} fill="none" stroke={tint} strokeWidth={size * 0.02} />
        <Circle cx={c} cy={c} r={R - size * 0.04} fill="none" stroke={tint} strokeWidth={size * 0.012} opacity={0.5} />
        {/* secondary diagonal star (gold), rotated 45° */}
        <G rotation={45} origin={`${c}, ${c}`}>
          <Polygon points={star(r2, w2)} fill={goldTint} opacity={0.9} />
        </G>
        {/* primary ink star N/E/S/W */}
        <Polygon points={star(R, w)} fill={tint} />
        {/* north needle highlight */}
        <Polygon points={`${c},${c - R} ${c + w},${c - w} ${c - w},${c - w}`} fill={goldTint} />
        <Line x1={c} y1={c - R - size * 0.06} x2={c} y2={c - R} stroke={tint} strokeWidth={size * 0.012} />
        <SvgText
          x={c} y={size * 0.14} fill={tint} fontSize={size * 0.1}
          fontWeight="bold" textAnchor="middle" fontFamily="Cinzel_700Bold"
        >N</SvgText>
        <Circle cx={c} cy={c} r={size * 0.045} fill={goldTint} stroke={tint} strokeWidth={size * 0.012} />
      </Svg>
    </Animated.View>
  );
}
