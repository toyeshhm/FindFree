import React, { useCallback } from 'react';
import { FlatList, RefreshControl } from 'react-native';
import { FeedCard } from './FeedCard';
import { FeedCardSkeleton } from './FeedCardSkeleton';
import { EmptyState } from '@/components';
import { Colors, Spacing } from '@/lib';
import { useSavedStore } from '@/stores/useSavedStore';
import type { Item } from '@/types';

interface FeedListProps {
  items:        Item[];
  isLoading:    boolean;
  isRefreshing: boolean;
  onRefresh:    () => void;
  onItemPress:  (itemId: string) => void;
  onClearFilters?: () => void;
  hasFilters?:  boolean;
  viewMode?:    'card' | 'grid' | 'row';
}
import { Alert } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { itemsService } from '@/services/items';
import { useAuthStore } from '@/stores/useAuthStore';
import { useNavigation } from '@/navigation/types';

export function FeedList({
  items, isLoading, isRefreshing, onRefresh, onItemPress, onClearFilters, hasFilters, viewMode = 'card',
}: FeedListProps) {
  const { isSaved, toggle } = useSavedStore();
  const qc = useQueryClient();
  const { session } = useAuthStore();
  const nav = useNavigation();

  const handleSave = useCallback((itemId: string) => {
    if (!session) {
      Alert.alert('Sign in to save items', '', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => nav.navigate('Auth', { screen: 'SignIn' }) },
      ]);
      return;
    }
    const currentlySaved = isSaved(itemId);
    toggle(itemId);

    itemsService.toggleSave(session.user.id, itemId, !currentlySaved)
      .then(() => qc.invalidateQueries({ queryKey: ['items', 'saved'] }))
      .catch(() => toggle(itemId));
  }, [session, isSaved, toggle, qc, nav]);

  const renderItem = useCallback(
    ({ item, index }: { item: Item; index: number }) =>
      <FeedCard
        item={item}
        index={index}
        onPress={onItemPress}
        saved={isSaved(item.id)}
        onSave={handleSave}
        variant={viewMode}
      />,
    [onItemPress, isSaved, handleSave, viewMode]
  );
  const keyExtractor = useCallback((item: Item) => item.id, []);

  if (isLoading) {
    return (
      <>
        {Array.from({ length: 5 }).map((_, i) => <FeedCardSkeleton key={i} />)}
      </>
    );
  }

  const emptyMsg = hasFilters ? 'No loot matches your charted course.' : 'No loot in these waters yet.';
  const emptySec = hasFilters
    ? 'Lift your filters to survey the whole chart.'
    : 'Widen your radius, or wait — fresh caches surface by the hour.';

  return (
    <FlatList
      key={viewMode}
      data={items}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      numColumns={viewMode === 'grid' ? 3 : 1}
      columnWrapperStyle={viewMode === 'grid' ? { paddingHorizontal: 12, justifyContent: 'flex-start' } : undefined}
      contentContainerStyle={{ paddingTop: Spacing.sm, paddingBottom: 120 }}
      ListEmptyComponent={
        <EmptyState
          message={emptyMsg}
          secondary={emptySec}
          actionLabel={hasFilters ? 'Clear the Course' : undefined}
          onAction={hasFilters ? onClearFilters : undefined}
        />
      }
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          tintColor={Colors.ACCENT}
          colors={[Colors.ACCENT]}
        />
      }
      removeClippedSubviews
      maxToRenderPerBatch={8}
      windowSize={5}
      initialNumToRender={6}
    />
  );
}
