import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Alert
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { MapPin, Bell, Funnel, Square, SquaresFour, List as ListIcon, Clock } from 'phosphor-react-native';
import { Colors, Typography, Spacing, Radius } from '@/lib';
import { FeedList } from '@/features/feed/FeedList';
import { AlertsSheet } from '@/components/AlertsSheet';
import { TimeframeSheet } from '@/components/TimeframeSheet';
import { useNearbyItems } from '@/hooks/useNearbyItems';
import { useLocation } from '@/hooks/useLocation';
import { useFilterStore } from '@/stores/useFilterStore';
import { useNavigation } from '@/navigation/types';
import type { DealCategory } from '@/types';
import { MapFilterSheet, DEFAULT_FILTERS, countActive } from '@/features/map/MapFilterSheet';
import type { MapFilters } from '@/features/map/MapFilterSheet';
import { createStyleSheet } from "@/lib/theme";

// Mock unread count — replace with real data when backend is wired
const UNREAD_COUNT = 2;

export function DiscoverScreen() {
  const nav    = useNavigation();
  const insets = useSafeAreaInsets();
  const qc     = useQueryClient();

  const { location } = useLocation();
  const { filters, resetFilters } = useFilterStore();
  const { data: items = [], isLoading, isRefetching } = useNearbyItems(location, filters);

  const [viewMode, setViewMode]             = useState<'card' | 'grid' | 'row'>('card');
  const [alertsOpen, setAlertsOpen]         = useState(false);
  const [filterOpen, setFilterOpen]         = useState(false);
  const [timeframeOpen, setTimeframeOpen]   = useState(false);
  const [mapFilters, setMapFilters]         = useState<MapFilters>(DEFAULT_FILTERS);

  const filteredItems = useMemo(() => {
    return items.filter(i => {
      const matchesCat   = mapFilters.category === 'all' || !mapFilters.category || i.category === (mapFilters.category as DealCategory);
      const matchesClaim = mapFilters.claimTypes.length === 0 || mapFilters.claimTypes.includes(i.claimType);
      return matchesCat && matchesClaim;
    });
  }, [items, mapFilters]);

  const hasFilters = !!(filters.category || filters.maxAgeHours || filters.radiusKm !== 10);

  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerRow}>
          <Text style={styles.wordmark}>FindFree</Text>
          <View style={styles.headerRight}>
            <Pressable
              onPress={() => setFilterOpen(true)}
              style={[styles.filterBtn, countActive(mapFilters) > 0 && styles.filterBtnActive]}
              accessibilityRole="button"
              accessibilityLabel="Open filters"
            >
              <Funnel size={16} color={countActive(mapFilters) > 0 ? Colors.SURFACE_LIGHT : Colors.ACCENT} weight="bold" />
              {countActive(mapFilters) > 0
                ? <Text style={styles.filterBtnTextActive}>{countActive(mapFilters)}</Text>
                : <Text style={styles.filterBtnText}>Filter</Text>
              }
            </Pressable>
            <Pressable
              onPress={() => setAlertsOpen(true)}
              accessibilityRole="button"
              accessibilityLabel="Open notifications"
              style={styles.bellBtn}
            >
              <Bell size={22} color={Colors.TEXT_PRIMARY} />
              {UNREAD_COUNT > 0 && <View style={styles.bellDot} />}
            </Pressable>
          </View>
        </View>
      </View>

      {/* ── Section label & View Toggle ── */}
      <View style={styles.sectionHeaderRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <Text style={styles.sectionLabelText}>
            Showing past {filters.maxAgeHours ? (filters.maxAgeHours === 24 ? '24 hours' : `${filters.maxAgeHours / 24} days`) : '7 days'}
          </Text>
          <Pressable 
            onPress={() => setTimeframeOpen(true)}
            style={{ marginLeft: 8 }}
            hitSlop={8}
          >
            <Clock size={16} color={Colors.TEXT_MUTED} />
          </Pressable>
        </View>
        <View style={styles.viewToggleGroup}>
          <Pressable onPress={() => setViewMode('card')} accessibilityLabel="Card view" accessibilityRole="button">
            <Square size={20} color={viewMode === 'card' ? Colors.ACCENT : Colors.TEXT_MUTED} weight={viewMode === 'card' ? 'fill' : 'regular'} />
          </Pressable>
          <Pressable onPress={() => setViewMode('grid')} accessibilityLabel="Grid view" accessibilityRole="button">
            <SquaresFour size={20} color={viewMode === 'grid' ? Colors.ACCENT : Colors.TEXT_MUTED} weight={viewMode === 'grid' ? 'fill' : 'regular'} />
          </Pressable>
          <Pressable onPress={() => setViewMode('row')} accessibilityLabel="List view" accessibilityRole="button">
            <ListIcon size={20} color={viewMode === 'row' ? Colors.ACCENT : Colors.TEXT_MUTED} weight={viewMode === 'row' ? 'bold' : 'regular'} />
          </Pressable>
        </View>
      </View>

      {/* ── Feed ── */}
      <FeedList
        items={filteredItems}
        isLoading={isLoading}
        isRefreshing={isRefetching}
        viewMode={viewMode}
        onRefresh={() => qc.invalidateQueries({ queryKey: ['items', 'nearby'] })}
        onItemPress={(id) => nav.navigate('ItemDetail', { itemId: id })}
        hasFilters={hasFilters}
        onClearFilters={resetFilters}
      />
      
      {/* ── Alerts bottom sheet ── */}
      <AlertsSheet visible={alertsOpen} onDismiss={() => setAlertsOpen(false)} />

      {/* ── Timeframe sheet ── */}
      <TimeframeSheet
        visible={timeframeOpen}
        value={filters.maxAgeHours}
        onChange={(hours) => useFilterStore.getState().setMaxAge(hours)}
        onDismiss={() => setTimeframeOpen(false)}
      />

      {/* ── Filter sheet (shared with Map) ── */}
      <MapFilterSheet
        visible={filterOpen}
        filters={mapFilters}
        onChange={setMapFilters}
        onDismiss={() => setFilterOpen(false)}
      />
    </View>
  );
}

const styles = createStyleSheet((Colors) => ({
  container: {
    flex: 1,
    backgroundColor: Colors.BACKGROUND,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom:     12,
    backgroundColor:   Colors.SURFACE_LIGHT,
    borderBottomWidth: 2,
    borderBottomColor: Colors.INK,
  },
  headerRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
  },
  wordmark: {
    ...Typography.headline,
    color: Colors.TEXT_PRIMARY,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.BORDER,
  },
  filterBtnActive: {
    backgroundColor: Colors.ACCENT,
    borderColor: Colors.ACCENT,
  },
  filterBtnText: {
    ...Typography.label,
    color: Colors.TEXT_PRIMARY,
  },
  filterBtnTextActive: {
    ...Typography.label,
    color: Colors.SURFACE_LIGHT,
  },
  bellBtn: {
    padding: 4,
    position: 'relative',
  },
  bellDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.ACCENT,
    borderWidth: 1,
    borderColor: Colors.SURFACE_LIGHT,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.BORDER,
    backgroundColor: Colors.SURFACE_LIGHT,
  },
  sectionLabelText: {
    ...Typography.bodyCompact,
    color: Colors.TEXT_MUTED,
  },
  viewToggleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
}));
