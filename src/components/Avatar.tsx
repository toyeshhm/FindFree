import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { User } from 'phosphor-react-native';
import { Colors } from '@/lib';
import { createStyleSheet } from "@/lib/theme";

interface AvatarProps {
  uri?: string;
  size?: 36 | 44 | 64;
  accessibilityLabel?: string;
}

export function Avatar({ uri, size = 44, accessibilityLabel }: AvatarProps) {
  const iconSize = Math.round(size * 0.45);

  return (
    <View
      style={[styles.container, { width: size, height: size, borderRadius: size / 2 }]}
      accessibilityLabel={accessibilityLabel}
      accessible={!!accessibilityLabel}
    >
      {uri ? (
        <Image
          source={{ uri }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          contentFit="cover"
        />
      ) : (
        <User size={iconSize} color={Colors.TEXT_PRIMARY} weight="regular" />
      )}
    </View>
  );
}

const styles = createStyleSheet((Colors) => ({
  container: {
    backgroundColor: Colors.SURFACE_LIGHT,
    alignItems:      'center',
    justifyContent:  'center',
    overflow:        'hidden',
    borderWidth:     2,
    borderColor:     Colors.INK,
  },
}));
