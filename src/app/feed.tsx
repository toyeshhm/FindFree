import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { Colors, Typography, Spacing } from '@/lib';
import { FeedList } from '@/features/feed/FeedList';
import { useNearbyItems } from '@/hooks/useNearbyItems';
import { useLocation } from '@/hooks/useLocation';
import { useFilterStore } from '@/stores/useFilterStore';
import { useNavigation } from '@/navigation/types';

export function FeedScreen() {
  const nav    = useNavigation();
  const insets = useSafeAreaInsets();
  const qc     = useQueryClient();

  const { location } = useLocation();
  const { filters, resetFilters } = useFilterStore();
  const { data: items = [], isLoading, isRefetching } = useNearbyItems(location, filters);

  const hasFilters = !!(filters.category || filters.maxAgeHours || filters.radiusKm !== 10);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Nearby</Text>
      </View>
      <FeedList
        items={items}
        isLoading={isLoading}
        isRefreshing={isRefetching}
        onRefresh={() => qc.invalidateQueries({ queryKey: ['items', 'nearby'] })}
        onItemPress={(id) => nav.navigate('ItemDetail', { itemId: id })}
        hasFilters={hasFilters}
        onClearFilters={resetFilters}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.CHARCOAL },
  header: {
    paddingHorizontal: Spacing.gutter,
    paddingVertical:   Spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: Colors.RUST,
  },
  title: { ...Typography.headline, color: Colors.CREAM },
});
