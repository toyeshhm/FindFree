import React, { memo, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Linking } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withDelay, withTiming,
} from 'react-native-reanimated';
import { Image } from 'expo-image';
import { Star, ArrowUpRight, ChatTeardrop, MapPin, Heart } from 'phosphor-react-native';
import { PressableScale } from '@/components/PressableScale';
import { Colors, Typography, Fonts, Spacing, Springs, Stamp, Radius } from '@/lib';
import { useLikesStore } from '@/stores/useLikesStore';
import { useReducedMotion } from '@/lib/useReducedMotion';
import type { Item, ClaimType } from '@/types';
import { createStyleSheet } from "@/lib/theme";

const PLACEHOLDER_IMG = require('../../../assets/placeholder.png');

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

function extractLinks(text: string): string[] {
  if (!text) return [];
  const matches = text.match(/(https?:\/\/[^\s]+)/g);
  return matches ? Array.from(new Set(matches)) : [];
}

function stripLinks(text: string): string {
  if (!text) return '';
  return text.replace(/(https?:\/\/[^\s]+)/g, '').trim();
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
  onCommentPress?: (itemId: string) => void;
  onViewOnMap?: (item: Item) => void;
  onLike?: (itemId: string) => void;
  variant?: 'card' | 'grid' | 'row';
}

export const FeedCard = memo(function FeedCard({
  item, index, onPress, saved = false, onSave, onCommentPress, onViewOnMap, onLike, variant = 'card',
}: FeedCardProps) {
  const isLiked    = useLikesStore(s => s.isLiked(item.id));
  const likeCount  = (item.likeCount ?? 0) + (isLiked && !item.likedByMe ? 1 : !isLiked && item.likedByMe ? -1 : 0);
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

  const hasPhoto   = item.photoUrls.length > 0;
  const showNew    = isNew(item);
  const claimBadge = claimLabel(item.claimType);
  const hasLocation = item.location?.lat != null && item.location?.lng != null;
  const a11yLabel  = `${item.title}, free`;
  
  const additionalLinks = extractLinks(item.description).filter(u => u !== item.sourceUrl);

  if (variant === 'grid') {
    return (
      <Animated.View style={[entryStyle, styles.gridOuter]}>
        <PressableScale onPress={() => onPress(item.id)} style={styles.gridCard} variant="scale" accessibilityLabel={a11yLabel} accessibilityRole="button">
          <View style={styles.gridInner}>
            {hasPhoto ? (
              <Image source={{ uri: item.photoUrls[0] }} placeholder={PLACEHOLDER_IMG} style={styles.gridImage} contentFit="cover" />
            ) : (
              <View style={[styles.gridImage, { padding: 40, backgroundColor: Colors.SURFACE_DEEP }]}>
                <Image source={PLACEHOLDER_IMG} style={{ width: '100%', height: '100%', opacity: 0.8 }} contentFit="contain" />
              </View>
            )}
            <View style={styles.gridContent}>
              <Text style={styles.gridTitle} numberOfLines={2}>{item.title}</Text>
              
              <View style={styles.gridMetaRow}>
                <Text style={styles.meta}>{formatAge(item.createdAt)}</Text>
                <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>

                  {item.sourceUrl && (
                    <Pressable
                      onPress={(e) => { e.stopPropagation(); Linking.openURL(item.sourceUrl!); }}
                      hitSlop={8}
                    >
                      <ArrowUpRight size={14} color={Colors.ACCENT} weight="bold" />
                    </Pressable>
                  )}
                  <Pressable onPress={(e) => { e.stopPropagation(); onSave?.(item.id); }} hitSlop={8}>
                    <Star size={16} color={saved ? Colors.ACCENT : Colors.TEXT_MUTED} weight={saved ? 'fill' : 'regular'} />
                  </Pressable>
                </View>
              </View>
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
            <Image source={{ uri: item.photoUrls[0] }} placeholder={PLACEHOLDER_IMG} style={styles.rowImage} contentFit="cover" />
          ) : (
            <View style={[styles.rowImage, { padding: 8, backgroundColor: Colors.SURFACE_DEEP }]}>
              <Image source={PLACEHOLDER_IMG} style={{ width: '100%', height: '100%', opacity: 0.8 }} contentFit="contain" />
            </View>
          )}
          <View style={styles.rowContent}>
            <Text style={styles.rowTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.rowSource} numberOfLines={1}>{item.sourceName}</Text>
          </View>
          <Pressable onPress={(e) => { e.stopPropagation(); onSave?.(item.id); }} hitSlop={8} style={styles.rowSaveBtn}>
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
                placeholder={PLACEHOLDER_IMG}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
              />
            ) : (
              <View style={[StyleSheet.absoluteFill, { padding: 40, backgroundColor: Colors.SURFACE_DEEP }]}>
                <Image source={PLACEHOLDER_IMG} style={{ width: '100%', height: '100%', opacity: 0.8 }} contentFit="contain" />
              </View>
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
                onPress={(e) => { e.stopPropagation(); onSave?.(item.id); }}
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
            <Text style={styles.sourceName} numberOfLines={1}>{item.sourceName}</Text>

            {/* Description */}
            <Text style={styles.description} numberOfLines={2}>
              {stripLinks(item.description)}
            </Text>

            {additionalLinks.length > 0 && (
              <View style={styles.extraLinksRow}>
                {additionalLinks.map((url, idx) => (
                  <Pressable key={idx} style={styles.extraLinkBtn} onPress={(e) => { e.stopPropagation(); Linking.openURL(url); }}>
                    <Text style={styles.extraLinkBtnText}>Link {idx + 1}</Text>
                  </Pressable>
                ))}
              </View>
            )}

            {/* Meta row: time · map · comment · link */}
            <View style={styles.metaRow}>
              <Text style={styles.meta}>{formatAge(item.createdAt)}</Text>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                {onLike && (
                  <Pressable
                    onPress={(e) => { e.stopPropagation(); onLike(item.id); }}
                    style={styles.linkBtn}
                    hitSlop={8}
                    accessibilityLabel={isLiked ? 'Unlike' : 'Like'}
                  >
                    <Heart size={14} color={isLiked ? Colors.SEALING_WAX : Colors.TEXT_MUTED} weight={isLiked ? 'fill' : 'regular'} />
                    {likeCount > 0 && <Text style={[styles.linkBtnText, { color: isLiked ? Colors.SEALING_WAX : Colors.TEXT_MUTED }]}>{likeCount}</Text>}
                  </Pressable>
                )}
                {onViewOnMap && hasLocation && (
                  <Pressable
                    onPress={(e) => { e.stopPropagation(); onViewOnMap(item); }}
                    style={styles.linkBtn}
                    hitSlop={8}
                    accessibilityLabel="View on map"
                  >
                    <MapPin size={14} color={Colors.SEA} weight="fill" />
                  </Pressable>
                )}
                {onCommentPress && (
                  <Pressable
                    onPress={(e) => { e.stopPropagation(); onCommentPress(item.id); }}
                    style={styles.linkBtn}
                    hitSlop={8}
                  >
                    <ChatTeardrop size={16} color={Colors.TEXT_MUTED} />
                  </Pressable>
                )}
                {item.sourceUrl && (
                  <Pressable
                    onPress={(e) => { e.stopPropagation(); Linking.openURL(item.sourceUrl!); }}
                    style={styles.linkBtn}
                  >
                    <Text style={styles.linkBtnText}>Get Deal</Text>
                    <ArrowUpRight size={14} color={Colors.ACCENT} weight="bold" />
                  </Pressable>
                )}
              </View>
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
    fontFamily: Fonts.display,
    fontSize:   18,
    lineHeight: 24,
    letterSpacing: 0.2,
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
  extraLinksRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  extraLinkBtn: {
    backgroundColor: Colors.SURFACE,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.BORDER,
  },
  extraLinkBtnText: {
    ...Typography.caption,
    color: Colors.TEXT_PRIMARY,
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
    fontFamily: Fonts.display,
    fontSize:   14,
    lineHeight: 18,
    letterSpacing: 0.2,
    color: Colors.TEXT_PRIMARY,
    marginBottom: 2,
  },
  gridSource: {
    ...Typography.caption,
    color: Colors.ACCENT,
    marginBottom: 2,
  },
  gridMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
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
