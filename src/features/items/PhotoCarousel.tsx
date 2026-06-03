import React, { useState } from 'react';
import { View, FlatList, StyleSheet, Dimensions, Text } from 'react-native';
import { Image } from 'expo-image';
import { MapTrifold } from 'phosphor-react-native';
import { Colors, Typography, Spacing, Stamp, Radius } from '@/lib';
import { createStyleSheet } from "@/lib/theme";

const { width: SCREEN_W } = Dimensions.get('window');
const CAROUSEL_H = 264;
const PLATE_W = SCREEN_W - Spacing.gutter * 2;

interface PhotoCarouselProps {
  urls:  string[];
  title: string;
}

/**
 * Photos framed as pinned map plates — each on an ink-bordered parchment mount,
 * with page indicators rendered as small engraved brass coins.
 */
const PLACEHOLDER_IMG = require('../../../assets/placeholder.png');

export function PhotoCarousel({ urls, title }: PhotoCarouselProps) {
  const [index, setIndex] = useState(0);

  if (!urls.length) {
    return (
      <View style={styles.frame}>
        <View style={styles.plate}>
          <View style={[styles.image, { padding: 40, backgroundColor: Colors.SURFACE_DEEP }]}>
            <Image source={PLACEHOLDER_IMG} style={{ width: '100%', height: '100%', opacity: 0.8 }} contentFit="contain" />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.frame}>
      <View style={styles.plate}>
        <FlatList
          data={urls}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(_, i) => String(i)}
          snapToInterval={PLATE_W}
          decelerationRate="fast"
          onMomentumScrollEnd={(e) => {
            setIndex(Math.round(e.nativeEvent.contentOffset.x / PLATE_W));
          }}
          renderItem={({ item: uri }) => (
            <Image
              source={{ uri }}
              placeholder={PLACEHOLDER_IMG}
              style={styles.image}
              contentFit="cover"
              accessibilityLabel={title}
            />
          )}
        />
      </View>

      {urls.length > 1 && (
        <View style={styles.dots} pointerEvents="none">
          {urls.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === index ? styles.dotActive : styles.dotIdle]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = createStyleSheet((Colors) => ({
  frame: {
    paddingHorizontal: Spacing.gutter,
    paddingTop:        Spacing.base,
    paddingBottom:     Spacing.sm,
    backgroundColor:   Colors.BACKGROUND,
  },
  plate: {
    height:          CAROUSEL_H,
    width:           PLATE_W,
    borderRadius:    Radius.md,
    borderWidth:     2,
    borderColor:     Colors.INK,
    backgroundColor: Colors.SURFACE_DEEP,
    overflow:        'hidden',
    ...Stamp.md,
  },
  image: { width: PLATE_W, height: CAROUSEL_H },
  empty: {
    height:          CAROUSEL_H,
    borderRadius:    Radius.md,
    borderWidth:     2,
    borderColor:     Colors.INK,
    backgroundColor: Colors.SURFACE,
    alignItems:      'center',
    justifyContent:  'center',
    gap:             Spacing.sm,
    ...Stamp.md,
  },
  emptyText: { ...Typography.flavorSmall, color: Colors.TEXT_MUTED, textAlign: 'center' },
  dots: {
    flexDirection:  'row',
    justifyContent: 'center',
    alignItems:     'center',
    gap:            Spacing.xs,
    marginTop:      Spacing.md,
  },
  dot:       { width: 8, height: 8, borderRadius: 4, borderWidth: 1, borderColor: Colors.INK },
  dotActive: { backgroundColor: Colors.ACCENT_LIGHT },
  dotIdle:   { backgroundColor: Colors.SURFACE_DEEP, opacity: 0.7 },
}));
