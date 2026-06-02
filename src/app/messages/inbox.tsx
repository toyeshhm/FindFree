import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing } from '@/lib';
import { ConversationRow } from '@/features/messages/ConversationRow';
import { EmptyState } from '@/components/EmptyState';
import { SkeletonRow } from '@/components/SkeletonRow';
import { useConversations } from '@/hooks/useConversations';
import { useAuthStore } from '@/stores/useAuthStore';
import { useNavigation } from '@/navigation/types';

export function MessagesInboxScreen() {
  const nav    = useNavigation();
  const insets = useSafeAreaInsets();
  const { session } = useAuthStore();

  const { data: convs = [], isLoading } = useConversations(session?.user.id);

  if (!session) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}><Text style={styles.title}>Messages</Text></View>
        <EmptyState
          message="Sign up to message posters and claim items."
          actionLabel="Create Account"
          onAction={() => nav.navigate('Auth', { screen: 'SignUp' })}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}><Text style={styles.title}>Messages</Text></View>
      {isLoading
        ? Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
        : (
          <FlatList
            data={convs}
            keyExtractor={(c) => c.id}
            renderItem={({ item: conv }) => (
              <ConversationRow
                conv={conv}
                onPress={(id) => nav.navigate('ChatThread', {
                  conversationId: id,
                  itemTitle: conv.item?.title ?? '',
                })}
              />
            )}
            ListEmptyComponent={
              <EmptyState
                message="No messages yet."
                secondary="Message a poster to start a conversation."
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
