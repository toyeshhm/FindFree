import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, Alert, Share, Linking,
  ScrollView,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedScrollHandler, useAnimatedStyle,
  useAnimatedRef, interpolate, Extrapolation,
  FadeIn, FadeOut,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, CopySimple, DeviceMobile, MapPin, Clock,
} from 'phosphor-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Colors, Typography, Spacing, Stamp, Radius, useReducedMotion } from '@/lib';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SecondaryButton } from '@/components/SecondaryButton';
import { PressableScale } from '@/components/PressableScale';
import { SkeletonCard } from '@/components/SkeletonCard';
import { Doubloon, WaxSeal, RopeDivider, ParchmentOverlay } from '@/components/motifs';
import { PhotoCarousel } from '@/features/items/PhotoCarousel';
import { useItemDetail } from '@/hooks/useItemDetail';
import { useAuthStore } from '@/stores/useAuthStore';
import { useSavedStore } from '@/stores/useSavedStore';
import { itemsService } from '@/services/items';
import type { RootStackParamList } from '@/navigation/types';
import { createStyleSheet } from "@/lib/theme";

type Props = NativeStackScreenProps<RootStackParamList, 'ItemDetail'>;

const AnimatedScrollView = Animated.ScrollView;

function formatExpiry(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function ItemDetailScreen({ route, navigation }: Props) {
  const { itemId } = route.params;
  const insets  = useSafeAreaInsets();
  const qc      = useQueryClient();
  const reduced = useReducedMotion();

  const { session }         = useAuthStore();
  const { isSaved, toggle } = useSavedStore();
  const { data: item, isLoading } = useItemDetail(itemId);

  const savedNow = isSaved(itemId);
  const isOwner = session?.user?.id === item?.userId;

  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });

  const [copiedVisible, setCopiedVisible] = useState(false);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const parallaxStyle = useAnimatedStyle(() => {
    if (reduced) return { transform: [{ translateY: 0 }] };
    const ty = interpolate(scrollY.value, [-120, 0, 120], [-36, 0, 18], Extrapolation.CLAMP);
    return { transform: [{ translateY: ty }] };
  });

  const saveMutation = useMutation({
    mutationFn: () => itemsService.toggleSave(session!.user.id, itemId, !savedNow),
    onMutate:   () => toggle(itemId),
    onError:    () => toggle(itemId),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['items', 'saved'] }),
  });

  const handleSave = () => {
    if (!session) {
      Alert.alert('Sign in to save items', '', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => navigation.navigate('Auth', { screen: 'SignIn' }) },
      ]);
      return;
    }
    saveMutation.mutate();
  };

  const deleteMutation = useMutation({
    mutationFn: () => itemsService.delete(itemId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['items'] });
      Alert.alert('Post deleted', 'Your post has been removed.');
      navigation.goBack();
    },
    onError: () => {
      Alert.alert('Error', 'Could not delete post. Try again.');
    }
  });

  const handleDelete = () => {
    Alert.alert('Delete Post', 'Are you sure you want to delete this post?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate() }
    ]);
  };

  const showCopied = () => {
    if (copiedTimer.current) clearTimeout(copiedTimer.current);
    setCopiedVisible(true);
    copiedTimer.current = setTimeout(() => setCopiedVisible(false), 2000);
  };

  const copyCode = (code: string) => {
    Alert.alert('Coupon Code', code, [{ text: 'OK' }]);
    showCopied();
  };

  const handleShare = async () => {
    if (!item) return;
    try {
      await Share.share({ message: item.title });
    } catch {
      // user dismissed
    }
  };

  const handlePrimaryPress = () => {
    if (!item) return;
    const claimType = item.claimType;

    if (claimType === 'code') {
      const code = item.couponCode || 'FREEBIES2024';
      Alert.alert('Coupon Code', code, [{ text: 'OK' }]);
      showCopied();
    } else if (claimType === 'app-required') {
      Linking.openURL(`https://www.google.com/search?q=${encodeURIComponent(item.sourceName + ' app')}`).catch(() => {
        Alert.alert('Could not open app', `Search for the ${item.sourceName} app in the App Store or Google Play.`);
      });
    } else if (claimType === 'in-store') {
      navigation.navigate('Main', {
        screen: 'MapTab',
        params: { focusLat: item.location.lat, focusLng: item.location.lng },
      });
    } else if (claimType === 'no-action') {
      const { lat, lng } = item.location;
      const url = `https://maps.apple.com/?ll=${lat},${lng}&q=${encodeURIComponent(item.sourceName)}`;
      Linking.openURL(url).catch(() => {
        const gMaps = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
        Linking.openURL(gMaps).catch(() => Alert.alert('Could not open Maps'));
      });
    }
  };

  const primaryLabel = (): string => {
    if (!item) return 'CLAIM';
    switch (item.claimType) {
      case 'code':         return 'COPY CODE';
      case 'app-required': return 'OPEN APP';
      case 'in-store':     return 'SHOW ON MAP';
      case 'no-action':    return 'GET DIRECTIONS';
      default:             return 'CLAIM';
    }
  };

  if (isLoading || !item) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <SkeletonCard />
      </View>
    );
  }

  const code = item.couponCode || 'FREEBIES2024';

  return (
    <View style={styles.container}>
      <View style={[styles.medallion, styles.backBtn, { top: insets.top + Spacing.sm }]}>
        <Pressable
          onPress={() => navigation.goBack()}
          accessibilityLabel="Go back"
          accessibilityRole="button"
          style={styles.medallionPress}
          hitSlop={8}
        >
          <ArrowLeft size={20} color={Colors.INK} weight="bold" />
        </Pressable>
      </View>

      <Doubloon
        saved={savedNow}
        onToggle={handleSave}
        size={46}
        style={{ ...styles.saveBtn, top: insets.top + Spacing.sm }}
        accessibilityLabel={savedNow ? 'Remove from your stash' : 'Stash this find'}
      />

      <AnimatedScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        bounces={false}
        overScrollMode="never"
        contentContainerStyle={{ paddingBottom: 150 }}
      >
        <Animated.View style={parallaxStyle}>
          <PhotoCarousel urls={item.photoUrls} title={item.title} />
        </Animated.View>

        <View style={styles.content}>
          {/* Title area with sourceName above */}
          <View style={styles.titleRow}>
            <View style={styles.titleBlock}>
              <Text style={styles.sourceName}>{item.sourceName.toUpperCase()}</Text>
              <Text style={styles.title}>{item.title}</Text>
            </View>
            <WaxSeal label="FREE" size={56} style={styles.seal} />
          </View>

          {/* Expiry row */}
          {item.expiresAt ? (
            <View style={styles.expiryRow}>
              <Clock size={18} color={Colors.SEALING_WAX} weight="bold" />
              <Text style={styles.expiryText}>Expires {formatExpiry(item.expiresAt)}</Text>
            </View>
          ) : null}

          <RopeDivider style={styles.divider} />

          <Text style={styles.sectionHead}>The Notice</Text>
          <Text style={styles.description}>{item.description || 'No description provided.'}</Text>

          <RopeDivider style={styles.divider} />

          {/* How to Claim section */}
          <Text style={styles.sectionHead}>HOW TO CLAIM</Text>

          <View style={styles.claimBlock}>
            {item.claimType === 'code' && (
              <>
                <Text style={styles.claimBody}>
                  Copy the code below and use it at checkout online or in-app.
                </Text>
                <View style={styles.codeRow}>
                  <Text style={styles.codeText}>{code}</Text>
                  <PressableScale
                    onPress={() => copyCode(code)}
                    accessibilityLabel="Copy coupon code"
                    accessibilityRole="button"
                    style={styles.copyBtn}
                  >
                    <CopySimple size={20} color={Colors.TEXT_MUTED} />
                  </PressableScale>
                </View>
              </>
            )}

            {item.claimType === 'in-store' && (
              <Text style={styles.claimBody}>
                Head to the location and tell the staff you're claiming the free offer.
              </Text>
            )}

            {item.claimType === 'app-required' && (
              <>
                <Text style={styles.claimBody}>
                  Open the {item.sourceName} app and navigate to the offers or rewards section.
                </Text>
                <View style={styles.stepList}>
                  {[
                    `Open the ${item.sourceName} app`,
                    'Go to Offers or Rewards',
                    'Find and activate this deal',
                  ].map((step, i) => (
                    <View key={i} style={styles.stepRow}>
                      <Text style={styles.stepNumber}>{i + 1}.</Text>
                      <Text style={styles.claimBody}>{step}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}

            {item.claimType === 'no-action' && (
              <>
                <Text style={styles.claimBody}>
                  No action required — just show up! This deal is automatically available.
                </Text>
                <Pressable
                  onPress={handlePrimaryPress}
                  style={styles.iconRow}
                  accessibilityRole="button"
                  accessibilityLabel={`Get directions to ${item.sourceName}`}
                >
                  <MapPin size={24} color={Colors.ACCENT} weight="bold" />
                  <Text style={[styles.iconRowText, { color: Colors.ACCENT }]}>
                    Get directions to {item.sourceName}
                  </Text>
                </Pressable>
              </>
            )}
          </View>

          {/* Social proof */}
          {item.claimedCount != null && item.claimedCount > 0 ? (
            <Text style={styles.socialProof}>
              {item.claimedCount} people claimed this today
            </Text>
          ) : null}
        </View>
      </AnimatedScrollView>

      {/* "Copied!" toast */}
      {copiedVisible && (
        <Animated.View
          entering={FadeIn.duration(150)}
          exiting={FadeOut.duration(300)}
          style={styles.toast}
          pointerEvents="none"
        >
          <Text style={styles.toastText}>Copied to clipboard</Text>
        </Animated.View>
      )}

      {/* Sticky CTA bar */}
      <View style={[styles.cta, { paddingBottom: insets.bottom + Spacing.md }]}>
        <View style={styles.ctaRow}>
          {isOwner ? (
            <View style={{ flex: 1 }}>
              <PrimaryButton
                label="DELETE POST"
                onPress={handleDelete}
                fullWidth
              />
            </View>
          ) : (
            <>
              <View style={{ flex: 1 }}>
                <SecondaryButton label="SHARE" onPress={handleShare} fullWidth />
              </View>
              <View style={{ flex: 2 }}>
                <PrimaryButton
                  label={primaryLabel()}
                  onPress={handlePrimaryPress}
                  fullWidth
                  showArrow
                />
              </View>
            </>
          )}
        </View>
      </View>

      <ParchmentOverlay />
    </View>
  );
}

const styles = createStyleSheet((Colors) => ({
  container: { flex: 1, backgroundColor: Colors.BACKGROUND },
  medallion: {
    position:        'absolute',
    zIndex:          10,
    width:           46,
    height:          46,
    borderRadius:    23,
    backgroundColor: Colors.SURFACE_LIGHT,
    borderWidth:     2,
    borderColor:     Colors.INK,
    alignItems:      'center',
    justifyContent:  'center',
    ...Stamp.sm,
  },
  medallionPress: {
    width:          46,
    height:         46,
    alignItems:     'center',
    justifyContent: 'center',
  },
  backBtn: { left: Spacing.gutter },
  saveBtn: { position: 'absolute', right: Spacing.gutter, zIndex: 10 },
  content: {
    paddingHorizontal: Spacing.gutter,
    paddingVertical:   Spacing.base,
    gap:               Spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems:    'flex-start',
    gap:           Spacing.md,
    marginTop:     Spacing.sm,
  },
  titleBlock: { flex: 1, gap: 2 },
  sourceName: {
    ...Typography.tinyLabel,
    color:         Colors.ACCENT,
    textTransform: 'uppercase',
  },
  title: { ...Typography.displayHead, color: Colors.TEXT_PRIMARY },
  seal:  { marginTop: Spacing.micro },
  expiryRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Spacing.xs,
    marginTop:     Spacing.xs,
  },
  expiryText: { ...Typography.caption, color: Colors.SEALING_WAX },
  divider:    { marginVertical: Spacing.md },
  sectionHead: { ...Typography.tinyLabel, color: Colors.TEXT_MUTED },
  description: { ...Typography.flavor, color: Colors.TEXT_SECONDARY },

  // How to Claim block
  claimBlock: {
    backgroundColor: Colors.SURFACE_DEEP,
    borderWidth:     2,
    borderColor:     Colors.INK,
    padding:         16,
    borderRadius:    Radius.md,
    marginTop:       Spacing.sm,
    gap:             Spacing.sm,
  },
  claimBody: { ...Typography.bodyCompact, color: Colors.TEXT_SECONDARY },

  codeRow: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'space-between',
    marginTop:       Spacing.md,
    backgroundColor: Colors.SURFACE_LIGHT,
    borderWidth:     2,
    borderColor:     Colors.ACCENT,
    borderRadius:    Radius.md,
    padding:         12,
  },
  codeText: {
    ...Typography.headline,
    color:      Colors.ACCENT,
    fontFamily: 'monospace',
  },
  copyBtn: { padding: 4 },

  iconRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Spacing.sm,
    marginTop:     Spacing.xs,
  },
  iconRowText: { ...Typography.label, color: Colors.TEXT_PRIMARY },

  stepList: { gap: Spacing.sm, marginTop: Spacing.sm },
  stepRow:  { flexDirection: 'row', gap: Spacing.sm },
  stepNumber: { ...Typography.label, color: Colors.ACCENT },

  socialProof: {
    ...Typography.caption,
    color:     Colors.TEXT_MUTED,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },

  // Toast
  toast: {
    position:        'absolute',
    bottom:          140,
    alignSelf:       'center',
    backgroundColor: Colors.INK,
    paddingHorizontal: Spacing.base,
    paddingVertical:   Spacing.sm,
    borderRadius:    Radius.pill,
    zIndex:          20,
  },
  toastText: { ...Typography.caption, color: Colors.SURFACE_LIGHT },

  // Bottom CTA
  cta: {
    position:          'absolute',
    bottom:            0,
    left:              0,
    right:             0,
    paddingHorizontal: Spacing.gutter,
    paddingTop:        Spacing.md,
    backgroundColor:   Colors.BACKGROUND,
    borderTopWidth:    2,
    borderTopColor:    Colors.INK,
  },
  ctaRow: {
    flexDirection: 'row',
    gap:           Spacing.sm,
    alignItems:    'stretch',
  },
}));
