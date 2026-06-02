import React, { useCallback } from 'react';
import { FlatList, RefreshControl } from 'react-native';
import { FeedCard } from './FeedCard';
import { FeedCardSkeleton } from './FeedCardSkeleton';
import { EmptyState } from '@/components';
import { Colors, Spacing } from '@/lib';
import type { Item } from '@/types';

interface FeedListProps {
  items:        Item[];
  isLoading:    boolean;
  isRefreshing: boolean;
  onRefresh:    () => void;
  onItemPress:  (itemId: string) => void;
  onClearFilters?: () => void;
  hasFilters?:  boolean;
}

export function FeedList({
  items, isLoading, isRefreshing, onRefresh, onItemPress, onClearFilters, hasFilters,
}: FeedListProps) {
  const renderItem = useCallback(
    ({ item, index }: { item: Item; index: number }) =>
      <FeedCard item={item} index={index} onPress={onItemPress} />,
    [onItemPress]
  );
  const keyExtractor = useCallback((item: Item) => item.id, []);

  if (isLoading) {
    return (
      <>
        {Array.from({ length: 5 }).map((_, i) => <FeedCardSkeleton key={i} />)}
      </>
    );
  }

  const emptyMsg = hasFilters ? 'No items match your filters.' : 'Nothing nearby right now.';
  const emptySec = hasFilters
    ? 'Clear your filters to see everything.'
    : 'Try expanding your radius — someone might have just posted something.';

  return (
    <FlatList
      data={items}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      contentContainerStyle={{ paddingTop: Spacing.sm, paddingBottom: 80 }}
      ListEmptyComponent={
        <EmptyState
          message={emptyMsg}
          secondary={emptySec}
          actionLabel={hasFilters ? 'Clear Filters' : undefined}
          onAction={hasFilters ? onClearFilters : undefined}
        />
      }
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          tintColor={Colors.RUST}
          colors={[Colors.RUST]}
        />
      }
      removeClippedSubviews
      maxToRenderPerBatch={8}
      windowSize={5}
      initialNumToRender={6}
    />
  );
}
