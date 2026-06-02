import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing } from '@/lib';
import { ConversationRow } from '@/features/messages/ConversationRow';
import { RopeDivider } from '@/components/motifs';
import { EmptyState } from '@/components/EmptyState';
import { SkeletonRow } from '@/components/SkeletonRow';
import { useConversations } from '@/hooks/useConversations';
import { useAuthStore } from '@/stores/useAuthStore';
import { useNavigation } from '@/navigation/types';
import { createStyleSheet } from "@/lib/theme";

export function MessagesInboxScreen() {
  const nav    = useNavigation();
  const insets = useSafeAreaInsets();
  const { session } = useAuthStore();

  const { data: convs = [], isLoading } = useConversations(session?.user.id);

  const Header = () => (
    <View style={styles.header}>
      <Text style={styles.title}>Dispatches</Text>
      <Text style={styles.subtitle}>Word from fellow hunters</Text>
      <RopeDivider style={styles.rope} />
    </View>
  );

  if (!session) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Header />
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
      <Header />
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
                message="No dispatches yet."
                secondary="Hail a poster to open the first line."
              />
            }
          />
        )
      }
    </View>
  );
}

const styles = createStyleSheet((Colors) => ({
  container: { flex: 1, backgroundColor: Colors.BACKGROUND },
  header: {
    paddingHorizontal: Spacing.gutter,
    paddingTop:        Spacing.md,
    paddingBottom:     Spacing.sm,
    gap:               Spacing.micro,
  },
  title:    { ...Typography.displayHead, color: Colors.INK },
  subtitle: { ...Typography.flavorSmall, color: Colors.TEXT_MUTED },
  rope:     { marginTop: Spacing.sm },
}));
