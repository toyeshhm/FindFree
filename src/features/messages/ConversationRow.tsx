import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PressableScale } from '@/components/PressableScale';
import { Avatar } from '@/components/Avatar';
import { WaxSeal } from '@/components/motifs';
import { Colors, Typography, Spacing } from '@/lib';
import type { Conversation } from '@/types';
import { createStyleSheet } from "@/lib/theme";

interface ConversationRowProps {
  conv:    Conversation;
  onPress: (convId: string) => void;
}

/**
 * A ledger entry in the dispatch log: ink-ringed Avatar, an engraved Cinzel name,
 * the last dispatch in plain hand, and a sealing-wax stamp marking unread count.
 */
export function ConversationRow({ conv, onPress }: ConversationRowProps) {
  const name = conv.otherUser?.name ?? 'Unknown';
  const time = conv.lastMessageAt
    ? (() => {
        const m = Math.floor((Date.now() - new Date(conv.lastMessageAt).getTime()) / 60000);
        return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h`;
      })()
    : '';

  const unread = conv.unreadCount > 0;

  return (
    <PressableScale
      onPress={() => onPress(conv.id)}
      style={styles.row}
      accessibilityRole="button"
      accessibilityLabel={`Conversation with ${name}. ${conv.lastMessage ?? 'No messages yet.'}${
        unread ? ` ${conv.unreadCount} unread.` : ''
      }`}
    >
      <Avatar uri={conv.otherUser?.avatarUrl} size={44} />
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.name} numberOfLines={1}>{name}</Text>
          <Text style={styles.time}>{time}</Text>
        </View>
        <Text style={styles.preview} numberOfLines={1}>
          {conv.item?.title ? `Re: ${conv.item.title}` : conv.lastMessage ?? ''}
        </Text>
      </View>
      {unread && (
        <View style={styles.seal} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <WaxSeal label={String(conv.unreadCount)} size={28} />
        </View>
      )}
    </PressableScale>
  );
}

const styles = createStyleSheet((Colors) => ({
  row: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               Spacing.md,
    paddingHorizontal: Spacing.gutter,
    paddingVertical:   Spacing.base,
    minHeight:         64,
    borderBottomWidth: 1,
    borderBottomColor: Colors.BORDER,
  },
  content: { flex: 1 },
  topRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  name:    { ...Typography.subheading, color: Colors.TEXT_PRIMARY, flex: 1, marginRight: Spacing.sm },
  preview: { ...Typography.bodyCompact, color: Colors.TEXT_SECONDARY },
  time:    { ...Typography.caption, color: Colors.TEXT_MUTED, fontVariant: ['tabular-nums'] },
  seal:    { width: 32, alignItems: 'center', justifyContent: 'center' },
}));
