import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Text, TextInput, ScrollView, Pressable } from 'react-native';
import MapView from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Funnel, Crosshair } from 'phosphor-react-native';
import { Colors, Typography, Spacing, Stamp, Radius } from '@/lib';
import { ParchmentOverlay } from '@/components/motifs/ParchmentOverlay';
import { ItemMarker } from '@/features/map/ItemMarker';
import { ItemPreviewSheet } from '@/features/map/ItemPreviewSheet';
import { useNearbyItems } from '@/hooks/useNearbyItems';
import { useLocation } from '@/hooks/useLocation';
import { useFilterStore } from '@/stores/useFilterStore';
import { useNavigation } from '@/navigation/types';
import type { Item, DealCategory } from '@/types';
import { MapFilterSheet, DEFAULT_FILTERS, countActive } from '@/features/map/MapFilterSheet';
import type { MapFilters } from '@/features/map/MapFilterSheet';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { TabParamList } from '@/navigation/types';
import { createStyleSheet } from "@/lib/theme";

const SF_DEFAULT = { latitude: 37.78, longitude: -122.41, latitudeDelta: 0.05, longitudeDelta: 0.05 };


export function MapScreen({ route, navigation }: BottomTabScreenProps<TabParamList, 'MapTab'>) {
  const nav    = useNavigation();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);

  const { location, denied, requestLocation } = useLocation();
  const { filters }           = useFilterStore();
  const { data: items = [] }  = useNearbyItems(location, filters);
  const [searchQuery, setSearchQuery]     = useState('');
  const [sheetOpen, setSheetOpen]         = useState(false);
  const [mapFilters, setMapFilters]       = useState<MapFilters>(DEFAULT_FILTERS);
  const [locating, setLocating]           = useState(false);

  useEffect(() => {
    if (route.params?.focusLat && route.params?.focusLng) {
      mapRef.current?.animateToRegion({
        latitude: route.params.focusLat,
        longitude: route.params.focusLng,
        latitudeDelta: 0.015,
        longitudeDelta: 0.015,
      }, 800);
      navigation.setParams({ focusLat: undefined, focusLng: undefined });
    }
  }, [route.params?.focusLat, route.params?.focusLng]);

  const handleCenterLocation = async () => {
    setLocating(true);
    try {
      const coords = await requestLocation();
      if (coords) {
        mapRef.current?.animateToRegion(
          { latitude: coords.lat, longitude: coords.lng, latitudeDelta: 0.015, longitudeDelta: 0.015 },
          800,
        );
      }
    } finally {
      setLocating(false);
    }
  };

  const initialRegion = location
    ? { latitude: location.lat, longitude: location.lng, latitudeDelta: 0.05, longitudeDelta: 0.05 }
    : SF_DEFAULT;

  const filteredItems = items.filter((item) => {
    const matchesCategory =
      mapFilters.category === 'all' || item.category === (mapFilters.category as DealCategory);
    const matchesSearch =
      searchQuery.trim() === '' ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sourceName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClaim =
      mapFilters.claimTypes.length === 0 || mapFilters.claimTypes.includes(item.claimType);
    return matchesCategory && matchesSearch && matchesClaim;
  });

  const searchBarTop  = insets.top + 12;

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={initialRegion}
        showsUserLocation
        onPress={() => {}}
      >
        {filteredItems.map((item) => (
          <ItemMarker
            key={item.id}
            item={item}
            selected={false}
            onPress={(i) => nav.navigate('ItemDetail', { itemId: i.id })}
          />
        ))}
      </MapView>

      <ParchmentOverlay />

      {denied && (
        <View style={[styles.deniedBanner, { top: insets.top }]}>
          <View style={styles.deniedDot} />
          <Text style={styles.deniedText}>
            FindFree maps best with your location. Enable it in Settings.
          </Text>
        </View>
      )}

      {/* Floating search bar — search + location center + filter */}
      <View style={[styles.searchRow, { top: searchBarTop }]}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search deals..."
          placeholderTextColor={Colors.TEXT_MUTED}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
          accessibilityLabel="Search deals"
        />
        <Pressable
          style={[styles.iconBtn, countActive(mapFilters) > 0 && styles.filterBtnActive]}
          onPress={() => setSheetOpen(true)}
          accessibilityLabel="Open map filters"
          accessibilityRole="button"
        >
          <Funnel size={20} color={countActive(mapFilters) > 0 ? Colors.SURFACE_LIGHT : Colors.INK} weight="bold" />
          {countActive(mapFilters) > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{countActive(mapFilters)}</Text>
            </View>
          )}
        </Pressable>
        <Pressable
          style={styles.iconBtn}
          onPress={handleCenterLocation}
          accessibilityLabel="Center map on my location"
          accessibilityRole="button"
        >
          <Crosshair size={20} color={locating ? Colors.ACCENT : Colors.INK} weight="bold" />
        </Pressable>
      </View>



      <MapFilterSheet
        visible={sheetOpen}
        filters={mapFilters}
        onChange={setMapFilters}
        onDismiss={() => setSheetOpen(false)}
      />
    </View>
  );
}

const styles = createStyleSheet((Colors) => ({
  container: { flex: 1, backgroundColor: Colors.BACKGROUND },

  // Search bar row
  searchRow: {
    position:      'absolute',
    left:          16,
    right:         16,
    zIndex:        50,
    flexDirection: 'row',
    alignItems:    'center',
    gap:           8,
    ...Stamp.md,
  },
  searchInput: {
    flex:             1,
    height:           48,
    backgroundColor:  Colors.SURFACE,
    borderWidth:      2,
    borderColor:      Colors.INK,
    borderRadius:     Radius.md,
    paddingLeft:      12,
    paddingRight:     12,
    ...Typography.bodyCompact,
    color:            Colors.TEXT_PRIMARY,
  },
  iconBtn: {
    width:           48,
    height:          48,
    backgroundColor: Colors.SURFACE,
    borderWidth:     2,
    borderColor:     Colors.INK,
    borderRadius:    Radius.md,
    alignItems:      'center',
    justifyContent:  'center',
  },
  filterBtnActive: {
    backgroundColor: Colors.SURFACE_DEEP,
    borderColor:     Colors.ACCENT,
  },
  badge: {
    position:        'absolute',
    top:             4,
    right:           4,
    minWidth:        16,
    height:          16,
    borderRadius:    8,
    backgroundColor: Colors.SEALING_WAX,
    alignItems:      'center',
    justifyContent:  'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    ...Typography.caption,
    fontSize:  10,
    color:     Colors.SURFACE_LIGHT,
    lineHeight: 14,
  },

  // Location denied banner
  deniedBanner: {
    position:          'absolute',
    left:              0,
    right:             0,
    flexDirection:     'row',
    alignItems:        'center',
    gap:               Spacing.sm,
    backgroundColor:   Colors.SURFACE_LIGHT,
    borderBottomWidth: 3,
    borderBottomColor: Colors.SEALING_WAX,
    paddingHorizontal: Spacing.gutter,
    paddingVertical:   Spacing.md,
    zIndex:            60,
  },
  deniedDot: {
    width:           10,
    height:          10,
    borderRadius:    5,
    backgroundColor: Colors.SEALING_WAX,
  },
  deniedText: {
    ...Typography.flavorSmall,
    color: Colors.TEXT_PRIMARY,
    flex:  1,
  },

}));
