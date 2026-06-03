import React, { memo, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Linking } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withDelay, withTiming,
} from 'react-native-reanimated';
import { Image } from 'expo-image';
import { Star, ArrowUpRight } from 'phosphor-react-native';
import { PressableScale } from '@/components/PressableScale';
import { Colors, Typography, Spacing, Springs, Stamp, Radius } from '@/lib';
import { useReducedMotion } from '@/lib/useReducedMotion';
import type { Item, ClaimType } from '@/types';
import { createStyleSheet } from "@/lib/theme";

function isNew(item: Item): boolean {
  return Date.now() - new Date(item.createdAt).getTime() < 2 * 60 * 60 * 1000;
}

function formatAge(isoString: string): string {
  const mins = Math.floor((Date.now() - new Date(isoString).getTime()) / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function claimLabel(ct: ClaimType): string {
  switch (ct) {
    case 'code':         return 'CODE';
    case 'in-store':     return 'IN-STORE';
    case 'app-required': return 'APP REQUIRED';
    default:             return '';
  }
}

interface FeedCardProps {
  item:     Item;
  index:    number;
  onPress:  (itemId: string) => void;
  saved?:   boolean;
  onSave?:  (itemId: string) => void;
  variant?: 'card' | 'grid' | 'row';
}

export const FeedCard = memo(function FeedCard({
  item, index, onPress, saved = false, onSave, variant = 'card',
}: FeedCardProps) {
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

  const hasPhoto    = item.photoUrls.length > 0;
  const showNew     = isNew(item);
  const claimBadge  = claimLabel(item.claimType);
  const distLabel   = item.distanceMi != null ? `${item.distanceMi.toFixed(1)} mi` : '';
  const a11yLabel   = `${item.title}${distLabel ? ', ' + distLabel + ' away' : ''}, free`;

  if (variant === 'grid') {
    return (
      <Animated.View style={[entryStyle, styles.gridOuter]}>
        <PressableScale onPress={() => onPress(item.id)} style={styles.gridCard} variant="scale" accessibilityLabel={a11yLabel} accessibilityRole="button">
          <View style={styles.gridInner}>
            {hasPhoto ? (
              <Image source={{ uri: item.photoUrls[0] }} style={styles.gridImage} contentFit="cover" />
            ) : (
              <View style={styles.gridPlaceholder} />
            )}
            <View style={styles.gridContent}>
              <Text style={styles.gridTitle} numberOfLines={2}>{item.title}</Text>
              <Text style={styles.gridSource}>{item.sourceName}</Text>
              {distLabel !== '' && <Text style={styles.gridDistance}>{distLabel}</Text>}
              <Pressable onPress={() => onSave?.(item.id)} hitSlop={8} style={styles.gridSaveBtn}>
                <Star size={16} color={saved ? Colors.ACCENT : Colors.TEXT_MUTED} weight={saved ? 'fill' : 'regular'} />
              </Pressable>
            </View>
          </View>
        </PressableScale>
      </Animated.View>
    );
  }

  if (variant === 'row') {
    return (
      <Animated.View style={entryStyle}>
        <PressableScale onPress={() => onPress(item.id)} style={styles.rowCard} variant="scale" accessibilityLabel={a11yLabel} accessibilityRole="button">
          {hasPhoto ? (
            <Image source={{ uri: item.photoUrls[0] }} style={styles.rowImage} contentFit="cover" />
          ) : (
            <View style={styles.rowPlaceholder} />
          )}
          <View style={styles.rowContent}>
            <Text style={styles.rowTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.rowSource}>{item.sourceName} {distLabel ? `· ${distLabel}` : ''}</Text>
          </View>
          <Pressable onPress={() => onSave?.(item.id)} hitSlop={8} style={styles.rowSaveBtn}>
            <Star size={20} color={saved ? Colors.ACCENT : Colors.TEXT_MUTED} weight={saved ? 'fill' : 'regular'} />
          </Pressable>
        </PressableScale>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={entryStyle}>
      <PressableScale
        onPress={() => onPress(item.id)}
        variant="stamp"
        style={styles.outerShell}
        accessibilityRole="button"
        accessibilityLabel={a11yLabel}
      >
        <View style={styles.innerCore}>
          {/* ── Hero image / placeholder ── */}
          <View style={styles.imageWrap}>
            {hasPhoto ? (
              <Image
                source={{ uri: item.photoUrls[0] }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
              />
            ) : (
              <View style={styles.imagePlaceholder} />
            )}

            {/* NEW badge — top-left, only when < 2 h old */}
            {showNew && (
              <View style={styles.badgeNew}>
                <Text style={styles.badgeNewText}>NEW</Text>
              </View>
            )}

            {/* Claim type badge — top-right */}
            {claimBadge !== '' && (
              <View style={styles.badgeClaim}>
                <Text style={styles.badgeClaimText}>{claimBadge}</Text>
              </View>
            )}
          </View>

          {/* ── Content area ── */}
          <View style={styles.content}>
            {/* Title row + bookmark */}
            <View style={styles.titleRow}>
              <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
              <Pressable
                onPress={() => onSave?.(item.id)}
                accessibilityRole="button"
                accessibilityLabel={saved ? 'Unsave deal' : 'Save deal'}
                hitSlop={8}
                style={styles.saveBtn}
              >
                <Star
                  size={22}
                  color={saved ? Colors.ACCENT : Colors.TEXT_MUTED}
                  weight={saved ? 'fill' : 'regular'}
                />
              </Pressable>
            </View>

            {/* Source name */}
            <Text style={styles.sourceName}>{item.sourceName}</Text>

            {/* Description */}
            <Text style={styles.description} numberOfLines={2}>
              {item.description}
            </Text>

            {/* Meta row: distance · time · link */}
            <View style={styles.metaRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {distLabel !== '' && (
                  <Text style={styles.meta}>{distLabel}</Text>
                )}
                {distLabel !== '' && (
                  <Text style={styles.metaDot}> · </Text>
                )}
                <Text style={styles.meta}>{formatAge(item.createdAt)}</Text>
              </View>
              {item.sourceUrl && (
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation();
                    Linking.openURL(item.sourceUrl!);
                  }}
                  style={styles.linkBtn}
                >
                  <Text style={styles.linkBtnText}>Get Deal</Text>
                  <ArrowUpRight size={14} color={Colors.ACCENT} weight="bold" />
                </Pressable>
              )}
            </View>
          </View>
        </View>
      </PressableScale>
    </Animated.View>
  );
});

const styles = createStyleSheet((Colors) => ({
  // --- CARD VARIANT ---
  outerShell: {
    marginHorizontal: Spacing.gutter,
    marginBottom:     Spacing.lg,
    backgroundColor:  Colors.SURFACE,
    borderRadius:     Radius.md,
    borderWidth:      2,
    borderColor:      Colors.INK,
    borderLeftWidth:  3,
    borderLeftColor:  Colors.ACCENT,
    ...Stamp.md,
  },
  innerCore: {
    borderRadius: Radius.md - 2,
    overflow:     'hidden',
  },
  imageWrap: {
    height:            140,
    overflow:          'hidden',
    backgroundColor:   Colors.SURFACE_HOVER,
    borderBottomWidth: 2,
    borderBottomColor: Colors.INK,
  },
  imagePlaceholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.SURFACE_DEEP,
    borderWidth:     1.5,
    borderColor:     Colors.ACCENT_LIGHT,
    borderStyle:     'dashed',
  },
  badgeNew: {
    position:         'absolute',
    top:              Spacing.sm,
    left:             Spacing.sm,
    backgroundColor:  Colors.SEALING_WAX,
    borderRadius:     Radius.sm,
    paddingHorizontal: 8,
    paddingVertical:  3,
  },
  badgeNewText: {
    ...Typography.tinyLabel,
    color:       Colors.SURFACE_LIGHT,
    letterSpacing: 1.2,
  },
  badgeClaim: {
    position:         'absolute',
    top:              Spacing.sm,
    right:            Spacing.sm,
    backgroundColor:  Colors.ACCENT,
    borderRadius:     Radius.sm,
    paddingHorizontal: 8,
    paddingVertical:  3,
  },
  badgeClaimText: {
    ...Typography.tinyLabel,
    color:       Colors.SURFACE_LIGHT,
    letterSpacing: 1.2,
  },
  content: {
    padding: 12,
  },
  titleRow: {
    flexDirection:  'row',
    alignItems:     'flex-start',
    justifyContent: 'space-between',
    gap:            8,
    marginBottom:   4,
  },
  title: {
    ...Typography.subheading,
    color:      Colors.TEXT_PRIMARY,
    flex:       1,
  },
  saveBtn: {
    marginTop: 2,
  },
  sourceName: {
    ...Typography.caption,
    color:        Colors.ACCENT,
    marginBottom: 4,
  },
  description: {
    ...Typography.bodyCompact,
    color:        Colors.TEXT_SECONDARY,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  meta: {
    ...Typography.bodySmall,
    color: Colors.TEXT_MUTED,
  },
  metaDot: {
    ...Typography.bodySmall,
    color: Colors.TEXT_MUTED,
  },
  linkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.SURFACE_LIGHT,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.BORDER,
  },
  linkBtnText: {
    ...Typography.labelSmall,
    color: Colors.ACCENT,
  },

  // --- GRID VARIANT ---
  gridOuter: {
    width: '31.33%',
    marginHorizontal: '1%',
    marginBottom: Spacing.sm,
  },
  gridCard: {
    flex: 1,
    backgroundColor: Colors.SURFACE,
    borderWidth: 2,
    borderColor: Colors.INK,
    borderLeftWidth: 3,
    borderLeftColor: Colors.ACCENT,
    borderRadius: Radius.md,
  },
  gridInner: {
    borderRadius: Radius.md - 2,
    overflow: 'hidden',
  },
  gridImage: {
    width: '100%',
    aspectRatio: 1.5,
  },
  gridPlaceholder: {
    width: '100%',
    aspectRatio: 1.5,
    backgroundColor: Colors.SURFACE_DEEP,
  },
  gridContent: {
    padding: 8,
  },
  gridTitle: {
    ...Typography.label,
    color: Colors.TEXT_PRIMARY,
    marginBottom: 2,
  },
  gridSource: {
    ...Typography.caption,
    color: Colors.ACCENT,
    marginBottom: 2,
  },
  gridDistance: {
    ...Typography.caption,
    color: Colors.TEXT_MUTED,
  },
  gridSaveBtn: {
    position: 'absolute',
    bottom: 8,
    right: 8,
  },

  // --- ROW VARIANT ---
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.SURFACE,
    marginHorizontal: Spacing.gutter,
    marginBottom: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.INK,
  },
  rowImage: {
    width: 48,
    height: 48,
    borderRadius: Radius.sm,
    marginRight: Spacing.sm,
  },
  rowPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: Radius.sm,
    backgroundColor: Colors.SURFACE_DEEP,
    marginRight: Spacing.sm,
  },
  rowContent: {
    flex: 1,
    justifyContent: 'center',
  },
  rowTitle: {
    ...Typography.bodyCompact,
    color: Colors.TEXT_PRIMARY,
  },
  rowSource: {
    ...Typography.caption,
    color: Colors.TEXT_MUTED,
  },
  rowSaveBtn: {
    padding: 4,
  },
}));
