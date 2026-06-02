import React, { useState } from 'react';
import { View, FlatList, StyleSheet, Dimensions, Text } from 'react-native';
import { Image } from 'expo-image';
import { Colors, Typography, Spacing } from '@/lib';

const { width: SCREEN_W } = Dimensions.get('window');
const CAROUSEL_H = 240;

interface PhotoCarouselProps {
  urls:  string[];
  title: string;
}

export function PhotoCarousel({ urls, title }: PhotoCarouselProps) {
  const [index, setIndex] = useState(0);

  if (!urls.length) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No photos added</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={urls}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, i) => String(i)}
        onMomentumScrollEnd={(e) => {
          setIndex(Math.round(e.nativeEvent.contentOffset.x / SCREEN_W));
        }}
        renderItem={({ item: uri }) => (
          <Image
            source={{ uri }}
            style={styles.image}
            contentFit="cover"
            accessibilityLabel={title}
          />
        )}
      />
      {urls.length > 1 && (
        <View style={styles.counter}>
          <Text style={styles.counterText}>{index + 1} / {urls.length}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { height: CAROUSEL_H, backgroundColor: Colors.LIGHT_CHARCOAL },
  image:       { width: SCREEN_W, height: CAROUSEL_H },
  empty: {
    height:         CAROUSEL_H,
    backgroundColor: Colors.MID_CHARCOAL,
    alignItems:     'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: Colors.RUST,
  },
  emptyText:   { ...Typography.caption, color: Colors.MUTED_ASH },
  counter: {
    position:          'absolute',
    bottom:            Spacing.sm,
    right:             Spacing.md,
    backgroundColor:   'rgba(45, 45, 42, 0.7)',
    paddingHorizontal: Spacing.sm,
    paddingVertical:   2,
  },
  counterText: { ...Typography.tinyLabel, color: Colors.MUTED_ASH, fontVariant: ['tabular-nums'] },
});
