import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Image } from 'expo-image';
import { X } from 'phosphor-react-native';
import { Colors, Typography, Spacing, Springs } from '@/lib';
import { PrimaryButton } from '@/components/PrimaryButton';
import type { Item } from '@/types';

interface ItemPreviewSheetProps {
  item:          Item | null;
  onViewDetails: (itemId: string) => void;
  onDismiss:     () => void;
}

export function ItemPreviewSheet({ item, onViewDetails, onDismiss }: ItemPreviewSheetProps) {
  const translateY = useSharedValue(item ? 0 : 200);

  React.useEffect(() => {
    translateY.value = withSpring(item ? 0 : 200, Springs.heavy);
  }, [!!item]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!item) return null;

  const distLabel = item.distanceKm != null ? `${item.distanceKm.toFixed(1)} km away` : '';
  const timeLabel = item.createdAt
    ? (() => {
        const mins = Math.floor((Date.now() - new Date(item.createdAt).getTime()) / 60000);
        return mins < 60 ? `${mins} minutes ago` : `${Math.floor(mins / 60)} hours ago`;
      })()
    : '';

  return (
    <Animated.View
      style={[styles.sheet, sheetStyle]}
      accessibilityLabel={`${item.title}, ${distLabel}, posted ${timeLabel}. Tap to view details.`}
    >
      <View style={styles.thumb}>
        {item.photoUrls[0]
          ? <Image source={{ uri: item.photoUrls[0] }} style={StyleSheet.absoluteFill} contentFit="cover" />
          : <View style={[StyleSheet.absoluteFill, styles.thumbPlaceholder]} />
        }
      </View>
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.meta} numberOfLines={1}>
          {distLabel}{distLabel && timeLabel ? ' • ' : ''}{timeLabel}
        </Text>
      </View>
      <View style={styles.actions}>
        <PrimaryButton label="View Details" onPress={() => onViewDetails(item.id)} showArrow />
        <Pressable onPress={onDismiss} style={styles.dismiss} accessibilityLabel="Dismiss preview">
          <X size={18} color={Colors.MUTED_ASH} />
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position:        'absolute',
    bottom:          0,
    left:            0,
    right:           0,
    height:          110,
    backgroundColor: Colors.MID_CHARCOAL,
    borderTopWidth:  2,
    borderTopColor:  Colors.RUST,
    flexDirection:   'row',
    alignItems:      'center',
    padding:         Spacing.md,
    gap:             Spacing.md,
  },
  thumb: {
    width:           60,
    height:          60,
    backgroundColor: Colors.RUST,
    overflow:        'hidden',
  },
  thumbPlaceholder: {
    borderWidth:  2,
    borderStyle:  'dashed',
    borderColor:  Colors.RUST_LIGHT,
  },
  info:    { flex: 1, gap: 4 },
  title:   { ...Typography.label, color: Colors.CREAM, fontWeight: '700' },
  meta:    { ...Typography.tinyLabel, color: Colors.MUTED_ASH, fontVariant: ['tabular-nums'] },
  actions: { gap: Spacing.sm, alignItems: 'flex-end' },
  dismiss: { padding: Spacing.sm },
});
