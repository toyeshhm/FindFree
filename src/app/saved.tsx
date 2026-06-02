import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing } from '@/lib';
import { FeedCard } from '@/features/feed/FeedCard';
import { EmptyState } from '@/components/EmptyState';
import { SkeletonCard } from '@/components/SkeletonCard';
import { useSavedItems } from '@/hooks/useSavedItems';
import { useAuthStore } from '@/stores/useAuthStore';
import { useNavigation } from '@/navigation/types';

export function SavedScreen() {
  const nav    = useNavigation();
  const insets = useSafeAreaInsets();
  const { session } = useAuthStore();
  const { data: items = [], isLoading } = useSavedItems(session?.user.id);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}><Text style={styles.title}>Saved</Text></View>
      {isLoading
        ? Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
        : (
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <FeedCard item={item} index={index} onPress={(id) => nav.navigate('ItemDetail', { itemId: id })} />
            )}
            contentContainerStyle={{ paddingTop: Spacing.sm, paddingBottom: 80 }}
            ListEmptyComponent={
              <EmptyState
                message="Nothing saved yet."
                secondary="Tap the save button on any item to keep track of it."
              />
            }
          />
        )
      }
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
