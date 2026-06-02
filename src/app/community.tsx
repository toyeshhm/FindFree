import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, ScrollView, Pressable, Alert
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PencilSimple } from 'phosphor-react-native';
import { Colors, Typography, Spacing, Radius } from '@/lib';
import { EmptyState } from '@/components/EmptyState';
import { PostCard } from '@/features/community/PostCard';
import { PostComposer } from '@/features/community/PostComposer';
import { CommentsSheet } from '@/features/community/CommentsSheet';
import type { CommunityPost } from '@/types';
import { createStyleSheet } from "@/lib/theme";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { communityService } from '@/services/community';
import { useAuthStore } from '@/stores/useAuthStore';


// ── Filter config ─────────────────────────────────────────────────────────────
type FilterLabel = 'All' | 'Coupons' | 'Free Stuff' | 'Finds';
const FILTERS: FilterLabel[] = ['All', 'Coupons', 'Free Stuff', 'Finds'];

function applyFilter(posts: CommunityPost[], filter: FilterLabel): CommunityPost[] {
  switch (filter) {
    case 'Coupons':    return posts.filter(p => p.type === 'coupon');
    case 'Free Stuff': return posts.filter(p => p.type === 'free-stuff');
    case 'Finds':      return posts.filter(p => p.type === 'find');
    default:           return posts;
  }
}

// ── Screen ────────────────────────────────────────────────────────────────────
export function CommunityScreen() {
  const insets = useSafeAreaInsets();
  const { session } = useAuthStore();
  const qc = useQueryClient();

  const { data: posts = [], isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['community_posts', session?.user?.id],
    queryFn: () => communityService.getPosts(session?.user?.id),
  });
  const [activeFilter, setActiveFilter] = useState<FilterLabel>('All');
  const [composerOpen, setComposerOpen] = useState(false);
  const [activeCommentPost, setActiveCommentPost] = useState<string | null>(null);
  const [editingPost, setEditingPost] = useState<CommunityPost | null>(null);

  const filteredPosts = useMemo(
    () => applyFilter(posts, activeFilter),
    [posts, activeFilter],
  );

  const likeMutation = useMutation({
    mutationFn: ({ id, liked }: { id: string, liked: boolean }) => communityService.toggleLike(id, session!.user.id, liked),
    onMutate: async ({ id, liked }) => {
      await qc.cancelQueries({ queryKey: ['community_posts'] });
      const previous = qc.getQueryData(['community_posts', session?.user?.id]);
      qc.setQueryData(['community_posts', session?.user?.id], (old: CommunityPost[] | undefined) => 
        (old || []).map(p => p.id === id ? { ...p, liked: !liked, likeCount: p.likeCount + (liked ? -1 : 1) } : p)
      );
      return { previous };
    },
    onError: (err, newLike, context) => qc.setQueryData(['community_posts', session?.user?.id], context?.previous),
    onSettled: () => qc.invalidateQueries({ queryKey: ['community_posts'] }),
  });

  function handleLike(id: string) {
    if (!session) return Alert.alert('Sign in to like posts');
    const post = posts.find(p => p.id === id);
    if (post) likeMutation.mutate({ id, liked: post.liked });
  }

  const claimMutation = useMutation({
    mutationFn: communityService.claimCoupon,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['community_posts'] }),
  });
  function handleClaimCode(id: string) {
    claimMutation.mutate(id);
  }

  const deleteMutation = useMutation({
    mutationFn: communityService.deletePost,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['community_posts'] }),
  });
  function handleDelete(id: string) {
    deleteMutation.mutate(id);
  }

  function handleReport(id: string) {
    Alert.alert('Report Post', 'Why are you reporting this post?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Spam', style: 'destructive', onPress: () => Alert.alert('Report submitted') },
      { text: 'Inappropriate', style: 'destructive', onPress: () => Alert.alert('Report submitted') },
    ]);
  }

  const createMutation = useMutation({
    mutationFn: communityService.createPost,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['community_posts'] }),
    onError: (err: any) => Alert.alert('Failed to post', err.message || err.toString()),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<CommunityPost> }) => communityService.updatePost(id, updates),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['community_posts'] }),
    onError: (err: any) => Alert.alert('Failed to update', err.message || err.toString()),
  });

  function handlePost(partial: Partial<CommunityPost>) {
    if (!session) return Alert.alert('Sign in to post');
    if (editingPost) {
      updateMutation.mutate({ id: editingPost.id, updates: partial });
      setEditingPost(null);
    } else {
      createMutation.mutate({ ...partial, userId: session.user.id });
    }
  }

  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.headerTitle}>Community</Text>
        <Pressable
          onPress={() => setComposerOpen(true)}
          style={styles.composeBtn}
          accessibilityRole="button"
          accessibilityLabel="Create new post"
        >
          <PencilSimple size={22} color={Colors.TEXT_PRIMARY} />
        </Pressable>
      </View>

      {/* ── Filter pills ── */}
      <View style={styles.pillBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillScroll}
        >
          {FILTERS.map((label) => {
            const isActive = activeFilter === label;
            return (
              <Pressable
                key={label}
                onPress={() => setActiveFilter(label)}
                style={[styles.pill, isActive ? styles.pillActive : styles.pillInactive]}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
              >
                <Text style={[styles.pillText, isActive ? styles.pillTextActive : styles.pillTextInactive]}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Post list ── */}
      <FlatList
        data={filteredPosts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            onLike={handleLike}
            onClaimCode={handleClaimCode}
            onComment={(id) => setActiveCommentPost(id)}
            onReport={handleReport}
            onDelete={handleDelete}
            onEdit={(post) => {
              setEditingPost(post);
              setComposerOpen(true);
            }}
          />
        )}
        onRefresh={refetch}
        refreshing={isRefetching}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            message="Nothing posted yet."
            secondary="Be the first to share a free find with the crew."
          />
        }
      />

      {/* ── Post composer sheet ── */}
      <PostComposer
        visible={composerOpen}
        initialPost={editingPost}
        onDismiss={() => {
          setComposerOpen(false);
          setTimeout(() => setEditingPost(null), 300); // clear after animation
        }}
        onPost={handlePost}
      />
      <CommentsSheet
        visible={!!activeCommentPost}
        postId={activeCommentPost}
        onDismiss={() => setActiveCommentPost(null)}
        onCommentAdded={(id) => {
          qc.invalidateQueries({ queryKey: ['community_posts'] });
        }}
      />
    </View>
  );
}

const styles = createStyleSheet((Colors) => ({
  container: {
    flex:            1,
    backgroundColor: Colors.BACKGROUND,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom:     12,
    backgroundColor:   Colors.SURFACE_LIGHT,
    borderBottomWidth: 2,
    borderBottomColor: Colors.INK,
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
  },
  headerTitle: {
    ...Typography.displayHead,
    color: Colors.TEXT_PRIMARY,
  },
  composeBtn: {
    width:          44,
    height:         44,
    alignItems:     'center',
    justifyContent: 'center',
  },
  pillBar: {
    backgroundColor:   Colors.SURFACE,
    borderBottomWidth: 1,
    borderBottomColor: Colors.BORDER,
    paddingVertical:   10,
  },
  pillScroll: {
    paddingHorizontal: 16,
    gap:               8,
    flexDirection:     'row',
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical:   6,
    borderRadius:      20,
    borderWidth:       1.5,
  },
  pillActive: {
    backgroundColor: Colors.ACCENT,
    borderColor:     Colors.ACCENT,
  },
  pillInactive: {
    backgroundColor: Colors.SURFACE_DEEP,
    borderColor:     Colors.BORDER,
  },
  pillText: {
    ...Typography.caption,
  },
  pillTextActive: {
    color: Colors.SURFACE_LIGHT,
  },
  pillTextInactive: {
    color: Colors.TEXT_MUTED,
  },
  listContent: {
    paddingTop:    12,
    paddingBottom: 120,
  },
}));
