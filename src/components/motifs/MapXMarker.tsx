import React from 'react';
import Svg, { Path, Circle, G } from 'react-native-svg';
import { Colors } from '@/lib/colors';

interface MapXMarkerProps {
  size?: number;
  selected?: boolean;
  /** category glyph hint — tints the medallion */
  tint?: string;
}

/**
 * "X marks the spot." A parchment medallion pin with an inked red X and a
 * pointer tail. Selected pins grow and gain a gold treasure ring.
 */
export function MapXMarker({ size = 44, selected = false, tint = Colors.SURFACE_LIGHT }: MapXMarkerProps) {
  const w = size;
  const h = size * 1.3;
  const cx = w / 2;
  const cy = w / 2;
  const r = w * 0.42;
  return (
    <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      {/* pointer tail */}
      <Path d={`M ${cx - r * 0.5} ${cy + r * 0.6} L ${cx} ${h - 1} L ${cx + r * 0.5} ${cy + r * 0.6} Z`}
        fill={Colors.INK} />
      {selected && <Circle cx={cx} cy={cy} r={r + 4} fill="none" stroke={Colors.ACCENT_LIGHT} strokeWidth={3} />}
      <Circle cx={cx} cy={cy} r={r} fill={selected ? Colors.ACCENT_LIGHT : tint} stroke={Colors.INK} strokeWidth={2.5} />
      <Circle cx={cx} cy={cy} r={r * 0.78} fill="none" stroke={Colors.INK} strokeWidth={1} strokeDasharray="2,2" opacity={0.5} />
      {/* the X */}
      <G stroke={Colors.SEALING_WAX} strokeWidth={size * 0.085} strokeLinecap="round">
        <Path d={`M ${cx - r * 0.42} ${cy - r * 0.42} L ${cx + r * 0.42} ${cy + r * 0.42}`} />
        <Path d={`M ${cx + r * 0.42} ${cy - r * 0.42} L ${cx - r * 0.42} ${cy + r * 0.42}`} />
      </G>
    </Svg>
  );
}
