import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { Image } from 'expo-image';
import { X } from 'phosphor-react-native';
import { Colors, Typography, Spacing, Springs, Stamp, Radius } from '@/lib';
import { PrimaryButton } from '@/components/PrimaryButton';
import { WaxSeal } from '@/components/motifs/WaxSeal';
import { RopeDivider } from '@/components/motifs/RopeDivider';
import { useReducedMotion } from '@/lib/useReducedMotion';
import type { Item, ClaimType } from '@/types';
import { createStyleSheet } from "@/lib/theme";

interface ItemPreviewSheetProps {
  item:          Item | null;
  onViewDetails: (itemId: string) => void;
  onDismiss:     () => void;
}

const HIDDEN = 240;

const CLAIM_LABELS: Record<ClaimType, string> = {
  'code':         'CODE',
  'in-store':     'IN-STORE',
  'app-required': 'APP REQUIRED',
  'no-action':    'NO ACTION',
};

export function ItemPreviewSheet({ item, onViewDetails, onDismiss }: ItemPreviewSheetProps) {
  const reduced    = useReducedMotion();
  const translateY = useSharedValue(item ? 0 : HIDDEN);
  const opacity    = useSharedValue(item ? 1 : 0);

  React.useEffect(() => {
    const shown = !!item;
    if (reduced) {
      translateY.value = shown ? 0 : HIDDEN;
      opacity.value    = withTiming(shown ? 1 : 0, { duration: 120 });
    } else {
      translateY.value = withSpring(shown ? 0 : HIDDEN, Springs.heavy);
      opacity.value    = withTiming(shown ? 1 : 0, { duration: 160 });
    }
  }, [!!item, reduced]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity:   opacity.value,
  }));

  if (!item) return null;

  const distLabel  = item.distanceMi != null ? `${item.distanceMi.toFixed(1)} mi away` : '';
  const claimLabel = CLAIM_LABELS[item.claimType] ?? 'FREE';

  return (
    <Animated.View
      style={[styles.sheet, sheetStyle]}
      accessibilityLabel={`${item.title}, ${distLabel}. Tap to view deal.`}
    >
      {/* curled top edge of the unrolled manifest */}
      <View style={styles.curl} accessible={false} />
      <View style={styles.row}>
        <View style={styles.thumb}>
          {item.photoUrls[0]
            ? <Image source={{ uri: item.photoUrls[0] }} style={StyleSheet.absoluteFill} contentFit="cover" />
            : <View style={[StyleSheet.absoluteFill, styles.thumbPlaceholder]} />
          }
          <WaxSeal label="FREE" size={34} style={styles.seal} />
        </View>
        <View style={styles.info}>
          <Text style={styles.sourceName} numberOfLines={1}>{item.sourceName}</Text>
          <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
          <View style={styles.metaRow}>
            {distLabel ? (
              <Text style={styles.distance}>{distLabel}</Text>
            ) : null}
            <View style={styles.claimBadge}>
              <Text style={styles.claimBadgeText}>{claimLabel}</Text>
            </View>
          </View>
        </View>
        <Pressable
          onPress={onDismiss}
          style={styles.dismiss}
          accessibilityLabel="Dismiss preview"
          accessibilityRole="button"
        >
          <X size={18} color={Colors.TEXT_SECONDARY} weight="bold" />
        </Pressable>
      </View>
      <RopeDivider style={styles.rope} />
      <PrimaryButton label="View Deal" onPress={() => onViewDetails(item.id)} showArrow fullWidth />
    </Animated.View>
  );
}

const styles = createStyleSheet((Colors) => ({
  sheet: {
    position:        'absolute',
    bottom:          Spacing.safeBottom + Spacing.md,
    left:            Spacing.gutter,
    right:           Spacing.gutter,
    backgroundColor: Colors.SURFACE,
    borderRadius:    Radius.lg,
    borderWidth:     2,
    borderColor:     Colors.INK,
    padding:         Spacing.base,
    gap:             Spacing.sm,
    ...Stamp.lg,
  },
  curl: {
    alignSelf:       'center',
    width:           44,
    height:          4,
    borderRadius:    Radius.pill,
    backgroundColor: Colors.ROPE,
    opacity:         0.6,
    marginBottom:    Spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Spacing.md,
  },
  thumb: {
    width:           64,
    height:          64,
    backgroundColor: Colors.SURFACE_HOVER,
    borderRadius:    Radius.md,
    borderWidth:     2,
    borderColor:     Colors.INK,
    overflow:        'hidden',
  },
  thumbPlaceholder: {
    backgroundColor: Colors.SURFACE_DEEP,
  },
  seal: {
    position: 'absolute',
    bottom:   -4,
    right:    -4,
  },
  info:       { flex: 1, gap: 3 },
  sourceName: { ...Typography.caption, color: Colors.ACCENT },
  title:      { ...Typography.subheading, color: Colors.TEXT_PRIMARY },
  metaRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           6,
    flexWrap:      'wrap',
  },
  distance: { ...Typography.caption, color: Colors.TEXT_MUTED },
  claimBadge: {
    backgroundColor: Colors.SEALING_WAX,
    paddingHorizontal: 6,
    paddingVertical:   2,
    borderRadius:      Radius.sm,
  },
  claimBadgeText: {
    ...Typography.caption,
    color:      Colors.SURFACE_LIGHT,
    fontWeight: '700',
    fontSize:   10,
  },
  rope:    { marginVertical: Spacing.xs },
  dismiss: {
    padding:    Spacing.sm,
    minWidth:   44,
    minHeight:  44,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
