import React, { memo, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withDelay, withTiming,
} from 'react-native-reanimated';
import { Image } from 'expo-image';
import { PressableScale } from '@/components/PressableScale';
import { Badge } from '@/components/Badge';
import { Colors, Typography, Spacing, Springs } from '@/lib';
import { useReducedMotion } from '@/lib/useReducedMotion';
import type { Item } from '@/types';

type CardTier = 'standard' | 'feature' | 'text-only';

function isRecent(item: Item): boolean {
  return Date.now() - new Date(item.createdAt).getTime() < 60 * 60 * 1000;
}

function deriveCardTier(item: Item, index: number): CardTier {
  if (!item.photoUrls.length) return 'text-only';
  if (index === 0 || isRecent(item)) return 'feature';
  return 'standard';
}

function formatAge(isoString: string): string {
  const mins = Math.floor((Date.now() - new Date(isoString).getTime()) / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

interface FeedCardProps {
  item:    Item;
  index:   number;
  onPress: (itemId: string) => void;
}

export const FeedCard = memo(function FeedCard({ item, index, onPress }: FeedCardProps) {
  const tier    = deriveCardTier(item, index);
  const reduced = useReducedMotion();
  const ty      = useSharedValue(16);
  const op      = useSharedValue(0);

  useEffect(() => {
    const delay = Math.min(index, 4) * 50;
    if (reduced) {
      ty.value = withTiming(0, { duration: 0 });
      op.value = withTiming(1, { duration: 0 });
    } else {
      ty.value = withDelay(delay, withSpring(0, Springs.gentle));
      op.value = withDelay(delay, withSpring(1, Springs.gentle));
    }
  }, []);

  const entryStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: ty.value }],
    opacity: op.value,
  }));

  const imageHeight = tier === 'feature' ? 140 : tier === 'standard' ? 80 : 0;
  const distLabel   = item.distanceKm != null ? `${item.distanceKm.toFixed(1)} km` : '';
  const a11yLabel   = `${item.title}, ${distLabel}${distLabel ? ' away' : ''}, free`;

  return (
    <Animated.View style={entryStyle}>
      <PressableScale
        onPress={() => onPress(item.id)}
        style={styles.outerShell}
        accessibilityRole="button"
        accessibilityLabel={a11yLabel}
      >
        <View style={styles.innerCore}>
          {imageHeight > 0 && (
            <View style={[styles.imageWrap, { height: imageHeight }]}>
              {item.photoUrls[0] ? (
                <Image source={{ uri: item.photoUrls[0] }} style={StyleSheet.absoluteFill} contentFit="cover" />
              ) : (
                <View style={[StyleSheet.absoluteFill, styles.imagePlaceholder]} />
              )}
            </View>
          )}
          <View style={styles.content}>
            <View style={styles.headerRow}>
              <Badge label="FREE" accessibilityHidden />
              <Text style={styles.meta} numberOfLines={1} accessibilityHidden>
                {distLabel}{distLabel ? ' • ' : ''}{formatAge(item.createdAt)}
              </Text>
            </View>
            <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
            {tier === 'feature' && (
              <Text style={styles.description} numberOfLines={3}>{item.description}</Text>
            )}
          </View>
        </View>
      </PressableScale>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  outerShell: {
    marginHorizontal: Spacing.md,
    marginBottom:     Spacing.md,
    backgroundColor:  Colors.MID_CHARCOAL,
    borderLeftWidth:  3,
    borderLeftColor:  Colors.RUST,
    borderBottomWidth: 1,
    borderBottomColor: Colors.LIGHT_CHARCOAL,
    padding:          1,
  },
  innerCore: {
    backgroundColor: Colors.MID_CHARCOAL,
    borderTopWidth:  1,
    borderTopColor:  'rgba(255, 255, 255, 0.06)',
  },
  imageWrap: {
    overflow:        'hidden',
    backgroundColor: Colors.LIGHT_CHARCOAL,
  },
  imagePlaceholder: {
    borderWidth:  1,
    borderColor:  Colors.RUST_LIGHT,
    borderStyle:  'dashed',
  },
  content:   { padding: Spacing.md },
  headerRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    marginBottom:   Spacing.sm,
  },
  title: {
    ...Typography.bodyCompact,
    color:      Colors.CREAM,
    fontWeight: '700',
  },
  description: {
    ...Typography.caption,
    color:     Colors.MUTED_ASH,
    marginTop: Spacing.sm,
  },
  meta: {
    ...Typography.tinyLabel,
    color:       Colors.MUTED_ASH,
    fontVariant: ['tabular-nums'],
  },
});
