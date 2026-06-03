import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Square, SquaresFour, List as ListIcon, Bell, Funnel } from 'phosphor-react-native';
import { Colors, Typography, Spacing } from '@/lib';
import { ParchmentOverlay } from '@/components/motifs/ParchmentOverlay';
import { RopeDivider } from '@/components/motifs/RopeDivider';
import { EmptyState } from '@/components/EmptyState';
import { FeedList } from '@/features/feed/FeedList';
import { AlertsSheet } from '@/components/AlertsSheet';
import { MapFilterSheet, DEFAULT_FILTERS, countActive } from '@/features/map/MapFilterSheet';
import type { MapFilters } from '@/features/map/MapFilterSheet';
import type { DealCategory } from '@/types';
import { useSavedItems } from '@/hooks/useSavedItems';
import { useAuthStore } from '@/stores/useAuthStore';
import { useNavigation } from '@/navigation/types';
import { createStyleSheet } from "@/lib/theme";
import { useQueryClient } from '@tanstack/react-query';

export function SavedScreen() {
  const nav    = useNavigation();
  const insets = useSafeAreaInsets();
  const qc     = useQueryClient();
  const { session } = useAuthStore();
  const { data: items = [], isLoading, isRefetching } = useSavedItems(session?.user?.id);
  const [viewMode, setViewMode] = useState<'card' | 'grid' | 'row'>('grid');
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [mapFilters, setMapFilters] = useState<MapFilters>(DEFAULT_FILTERS);

  const filteredItems = useMemo(() => {
    return items.filter(i => {
      const matchesCat   = mapFilters.category === 'all' || !mapFilters.category || i.category === (mapFilters.category as DealCategory);
      const matchesClaim = mapFilters.claimTypes.length === 0 || mapFilters.claimTypes.includes(i.claimType);
      return matchesCat && matchesClaim;
    });
  }, [items, mapFilters]);

  const UNREAD_COUNT = 2; // mock
  const count = filteredItems.length;
  const subtitle = count === 1 ? '1 deal saved' : `${count} deals saved`;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Saved</Text>
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
        <Text style={styles.subtitle}>{subtitle}</Text>
        <RopeDivider style={styles.rope} />
      </View>

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionLabelText}>Your stash</Text>
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

      {filteredItems.length === 0 && !isLoading ? (
        <ScrollView contentContainerStyle={{ paddingTop: Spacing.sm, paddingBottom: 120 }}>
          <EmptyState
            message="Nothing saved yet."
            secondary="Tap the star on any deal to save it here."
            actionLabel="Browse Deals"
            onAction={() => nav.navigate('Main', { screen: 'DiscoverTab' })}
          />
        </ScrollView>
      ) : (
        <FeedList
          items={filteredItems}
          isLoading={isLoading}
          isRefreshing={isRefetching}
          onRefresh={() => qc.invalidateQueries({ queryKey: ['items', 'saved'] })}
          onItemPress={(id) => nav.navigate('ItemDetail', { itemId: id })}
          viewMode={viewMode}
        />
      )}
      
      <AlertsSheet visible={alertsOpen} onDismiss={() => setAlertsOpen(false)} />
      <MapFilterSheet
        visible={filterOpen}
        filters={mapFilters}
        onChange={setMapFilters}
        onDismiss={() => setFilterOpen(false)}
      />

      <ParchmentOverlay />
    </View>
  );
}

const styles = createStyleSheet((Colors) => ({
  container: { flex: 1, backgroundColor: Colors.BACKGROUND },
  header: {
    paddingHorizontal: Spacing.gutter,
    paddingTop:        Spacing.md,
    paddingBottom:     Spacing.sm,
  },
  headerRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           4,
  },
  title:    { ...Typography.displayHead, color: Colors.TEXT_PRIMARY },
  subtitle: { ...Typography.caption, color: Colors.TEXT_MUTED, marginTop: Spacing.micro },
  rope:     { marginTop: Spacing.sm },

  bellBtn: {
    width:          36,
    height:         36,
    alignItems:     'center',
    justifyContent: 'center',
  },
  bellDot: {
    position:        'absolute',
    top:             4,
    right:           4,
    width:           8,
    height:          8,
    borderRadius:    4,
    backgroundColor: Colors.SEALING_WAX,
  },
  filterBtn: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               5,
    backgroundColor:   Colors.SURFACE_DEEP,
    borderWidth:       1.5,
    borderColor:       Colors.ACCENT,
    borderRadius:      20,
    paddingHorizontal: 10,
    paddingVertical:   5,
    marginRight:       8,
  },
  filterBtnActive: {
    backgroundColor: Colors.ACCENT,
    borderColor:     Colors.ACCENT,
  },
  filterBtnText: {
    ...Typography.caption,
    color:      Colors.ACCENT,
    fontWeight: '700' as const,
  },
  filterBtnTextActive: {
    ...Typography.caption,
    color:      Colors.SURFACE_LIGHT,
    fontWeight: '700' as const,
  },

  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sectionLabelText: {
    ...Typography.caption,
    color: Colors.TEXT_MUTED,
  },
  viewToggleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
}));
