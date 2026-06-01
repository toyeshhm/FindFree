import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { User } from 'phosphor-react-native';
import { Colors } from '@/lib';

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
        <User size={iconSize} color={Colors.CREAM} weight="regular" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.RUST,
    alignItems:      'center',
    justifyContent:  'center',
    overflow:        'hidden',
  },
});
