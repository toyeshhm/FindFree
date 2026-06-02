import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';
import { Colors } from '@/lib';
import type { Item } from '@/types';

interface ItemMarkerProps {
  item:     Item;
  selected: boolean;
  onPress:  (item: Item) => void;
}

export function ItemMarker({ item, selected, onPress }: ItemMarkerProps) {
  const size = selected ? 32 : 24;

  return (
    <Marker
      coordinate={{ latitude: item.location.lat, longitude: item.location.lng }}
      onPress={() => onPress(item)}
      tracksViewChanges={false}
    >
      <View style={[
        styles.marker,
        { width: size, height: size, borderRadius: size / 2 },
        selected && styles.selected,
      ]} />
    </Marker>
  );
}

const styles = StyleSheet.create({
  marker:   { backgroundColor: Colors.RUST },
  selected: { borderWidth: 2, borderColor: Colors.CREAM },
});
