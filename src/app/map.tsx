import React, { useState } from 'react';
import { View, StyleSheet, Pressable, Text } from 'react-native';
import MapView from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SlidersHorizontal } from 'phosphor-react-native';
import { Colors, Typography, Spacing } from '@/lib';
import { ItemMarker } from '@/features/map/ItemMarker';
import { ItemPreviewSheet } from '@/features/map/ItemPreviewSheet';
import { useNearbyItems } from '@/hooks/useNearbyItems';
import { useLocation } from '@/hooks/useLocation';
import { useFilterStore } from '@/stores/useFilterStore';
import { useNavigation } from '@/navigation/types';
import type { Item } from '@/types';

const SF_DEFAULT = { latitude: 37.78, longitude: -122.41, latitudeDelta: 0.05, longitudeDelta: 0.05 };

export function MapScreen() {
  const nav    = useNavigation();
  const insets = useSafeAreaInsets();

  const { location, denied } = useLocation();
  const { filters }          = useFilterStore();
  const { data: items = [] } = useNearbyItems(location, filters);
  const [selected, setSelected] = useState<Item | null>(null);

  const initialRegion = location
    ? { latitude: location.lat, longitude: location.lng, latitudeDelta: 0.05, longitudeDelta: 0.05 }
    : SF_DEFAULT;

  return (
    <View style={styles.container}>
      <MapView
        style={StyleSheet.absoluteFill}
        initialRegion={initialRegion}
        showsUserLocation
        onPress={() => setSelected(null)}
      >
        {items.map((item) => (
          <ItemMarker
            key={item.id}
            item={item}
            selected={selected?.id === item.id}
            onPress={setSelected}
          />
        ))}
      </MapView>

      <View style={[styles.header, { marginTop: insets.top + Spacing.sm }]}>
        <Pressable
          style={styles.filterBtn}
          onPress={() => {/* filter sheet – future */}}
          accessibilityLabel="Filters"
          accessibilityRole="button"
        >
          <SlidersHorizontal size={18} color={Colors.CREAM} />
          <Text style={styles.filterLabel}>Filters</Text>
        </Pressable>
      </View>

      {denied && (
        <View style={[styles.deniedBanner, { top: insets.top }]}>
          <Text style={styles.deniedText}>FindFree works best with your location.</Text>
        </View>
      )}

      <ItemPreviewSheet
        item={selected}
        onViewDetails={(id) => nav.navigate('ItemDetail', { itemId: id })}
        onDismiss={() => setSelected(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: Colors.CHARCOAL },
  header: {
    position:        'absolute',
    top:             0,
    left:            Spacing.gutter,
    right:           Spacing.gutter,
    flexDirection:   'row',
    justifyContent:  'flex-end',
  },
  filterBtn: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             Spacing.sm,
    backgroundColor: Colors.MID_CHARCOAL,
    borderWidth:     2,
    borderColor:     Colors.RUST,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    minHeight:       44,
  },
  filterLabel: { ...Typography.label, color: Colors.CREAM, textTransform: 'uppercase', letterSpacing: 1 },
  deniedBanner: {
    position:          'absolute',
    left:              0,
    right:             0,
    backgroundColor:   Colors.MID_CHARCOAL,
    borderBottomWidth: 2,
    borderBottomColor: Colors.RUST,
    paddingHorizontal: Spacing.gutter,
    paddingVertical:   Spacing.sm,
  },
  deniedText: { ...Typography.caption, color: Colors.MUTED_ASH },
});
