import React, { useCallback } from 'react';
import { FlatList, RefreshControl } from 'react-native';
import { FeedCard } from './FeedCard';
import { FeedCardSkeleton } from './FeedCardSkeleton';
import { CommentsSheet } from '../community/CommentsSheet';
import { EmptyState } from '@/components';
import { PrimaryButton } from '@/components/PrimaryButton';
import { View } from 'react-native';
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
import { scrapeMoreFinds } from '@/services/scraperClient';

export function FeedList({
  items, isLoading, isRefreshing, onRefresh, onItemPress, onClearFilters, hasFilters, viewMode = 'card',
}: FeedListProps) {
  const [activeCommentId, setActiveCommentId] = React.useState<string | null>(null);
  const [isScraping, setIsScraping] = React.useState(false);
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
        onCommentPress={setActiveCommentId}
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
    <>
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
      ListFooterComponent={
        items.length > 0 ? (
          <View style={{ padding: Spacing.xl, alignItems: 'center', justifyContent: 'center' }}>
            <PrimaryButton 
              label={isScraping ? "SCRAPING..." : "SCRAPE MORE FINDS"} 
              loading={isScraping}
              onPress={async () => {
                if (!session) {
                  Alert.alert('Sign in required', 'Please sign in to help find and submit new deals!', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Sign In', onPress: () => nav.navigate('Auth', { screen: 'SignIn' }) },
                  ]);
                  return;
                }
                setIsScraping(true);
                try {
                  const imported = await scrapeMoreFinds(session.user.id);
                  if (imported > 0) {
                    await qc.invalidateQueries({ queryKey: ['items', 'nearby'] });
                    Alert.alert('Success!', `Found and added ${imported} new deals.`);
                  } else {
                    Alert.alert('All caught up', 'No new deals found at the moment. Try again later!');
                  }
                } catch (e) {
                  Alert.alert('Error', 'Failed to scrape deals.');
                } finally {
                  setIsScraping(false);
                }
              }} 
            />
          </View>
        ) : null
      }
    />
    <CommentsSheet
      postId={activeCommentId}
      entityType="item"
      visible={activeCommentId !== null}
      onDismiss={() => setActiveCommentId(null)}
    />
    </>
  );
}
