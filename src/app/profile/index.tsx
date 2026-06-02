import React from 'react';
import { View, Text, FlatList, Pressable, Alert, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Colors, Typography, Spacing } from '@/lib';
import { ProfileHeader } from '@/features/profile/ProfileHeader';
import { FeedCard } from '@/features/feed/FeedCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { EmptyState } from '@/components/EmptyState';
import { SkeletonCard } from '@/components/SkeletonCard';
import { useAuthStore } from '@/stores/useAuthStore';
import { usersService } from '@/services/users';
import { itemsService } from '@/services/items';
import { useNavigation } from '@/navigation/types';

export function ProfileScreen() {
  const nav    = useNavigation();
  const insets = useSafeAreaInsets();
  const qc     = useQueryClient();

  const { session, signOut } = useAuthStore();

  const { data: user } = useQuery({
    queryKey: ['user', session?.user.id],
    queryFn:  () => usersService.getById(session!.user.id),
    enabled:  !!session,
  });

  const { data: myItems = [], isLoading } = useQuery({
    queryKey: ['items', 'mine', session?.user.id],
    queryFn:  () => itemsService.getSaved(session!.user.id),
    enabled:  !!session,
  });

  const deleteMutation = useMutation({
    mutationFn: (itemId: string) => itemsService.delete(itemId),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['items', 'mine'] }),
  });

  const handleDelete = (itemId: string) => {
    Alert.alert('Remove this listing?', 'This will permanently remove your item.', [
      { text: 'Keep It', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate(itemId) },
    ]);
  };

  if (!session) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <EmptyState
          message="Sign in to view your profile."
          actionLabel="Create Account"
          onAction={() => nav.navigate('Auth', { screen: 'SignUp' })}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {user && <ProfileHeader user={user} />}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Listings</Text>
        <PrimaryButton
          label="Post Your First Item"
          onPress={() => nav.navigate('PostItem')}
          showArrow
        />
      </View>
      {isLoading
        ? <SkeletonCard />
        : myItems.length === 0
          ? <EmptyState message="You haven't posted anything yet." />
          : (
            <FlatList
              data={myItems}
              keyExtractor={(item) => item.id}
              renderItem={({ item, index }) => (
                <FeedCard item={item} index={index} onPress={(id) => nav.navigate('ItemDetail', { itemId: id })} />
              )}
              contentContainerStyle={{ paddingBottom: 80 }}
            />
          )
      }
      <View style={styles.footer}>
        <Pressable onPress={signOut} accessibilityRole="button" accessibilityLabel="Sign out">
          <Text style={styles.signOut}>Sign Out</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.CHARCOAL },
  section: {
    paddingHorizontal: Spacing.gutter,
    paddingVertical:   Spacing.md,
    gap:               Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.DIVIDER,
  },
  sectionTitle: { ...Typography.subheading, color: Colors.CREAM, fontWeight: '700' },
  footer: {
    paddingHorizontal: Spacing.gutter,
    paddingVertical:   Spacing.base,
    borderTopWidth:    1,
    borderTopColor:    Colors.DIVIDER,
  },
  signOut: { ...Typography.label, color: Colors.RUST_LIGHT },
});
