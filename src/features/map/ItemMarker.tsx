import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
} from 'react-native-reanimated';
import { Colors, Springs, Radius } from '@/lib';
import { useReducedMotion } from '@/lib/useReducedMotion';
import type { Item, DealCategory } from '@/types';
import { createStyleSheet } from "@/lib/theme";

interface ItemMarkerProps {
  item:     Item;
  selected: boolean;
  onPress:  (item: Item) => void;
}


export function ItemMarker({ item, selected, onPress }: ItemMarkerProps) {
  const reduced = useReducedMotion();
  const drop    = useSharedValue(reduced ? 0 : -14);
  const op      = useSharedValue(reduced ? 1 : 0);
  const scale   = useSharedValue(1);

  useEffect(() => {
    if (reduced) {
      drop.value  = 0;
      op.value    = 1;
    } else {
      drop.value  = withSpring(0, Springs.drop);
      op.value    = withTiming(1, { duration: 180 });
    }
  }, [reduced]);

  useEffect(() => {
    scale.value = withSpring(selected ? 1.15 : 1, Springs.drop);
  }, [selected]);

  const pinStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: drop.value }, { scale: scale.value }],
    opacity:   op.value,
  }));


  const pillBg      = selected ? Colors.ACCENT_LIGHT : Colors.ACCENT;
  const pillBorder  = selected ? Colors.ACCENT_LIGHT : Colors.INK;
  const triangleColor = selected ? Colors.ACCENT_LIGHT : Colors.ACCENT;

  return (
    <Marker
      coordinate={{ latitude: item.location.lat, longitude: item.location.lng }}
      onPress={() => onPress(item)}
      tracksViewChanges={false}
      anchor={{ x: 0.5, y: 1 }}
    >
      <Animated.View style={[styles.wrapper, pinStyle]}>
        {/* Pill */}
        <View style={[styles.pill, { backgroundColor: pillBg, borderColor: pillBorder }]}>

          <Text style={styles.label}>FREE</Text>
        </View>
        {/* Triangle pointer */}
        <View style={[styles.triangle, { borderTopColor: triangleColor }]} />
      </Animated.View>
    </Marker>
  );
}

const styles = createStyleSheet((Colors) => ({
  wrapper: {
    alignItems: 'center',
  },
  pill: {
    flexDirection:   'row',
    alignItems:      'center',
    paddingHorizontal: 8,
    paddingVertical:   4,
    borderRadius:    Radius.md,
    borderWidth:     1.5,
    gap:             3,
  },
  emoji: {
    fontSize:   14,
    lineHeight: 18,
  },
  label: {
    fontSize:   10,
    fontWeight: '700',
    letterSpacing: 0.5,
    color:      Colors.SURFACE_LIGHT,
  },
  triangle: {
    width:            0,
    height:           0,
    borderLeftWidth:  6,
    borderRightWidth: 6,
    borderTopWidth:   8,
    borderLeftColor:  'transparent',
    borderRightColor: 'transparent',
    alignSelf:        'center',
  },
}));
