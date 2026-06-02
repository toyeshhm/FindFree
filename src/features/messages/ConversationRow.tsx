import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PressableScale } from '@/components/PressableScale';
import { Avatar } from '@/components/Avatar';
import { Colors, Typography, Spacing } from '@/lib';
import type { Conversation } from '@/types';

interface ConversationRowProps {
  conv:    Conversation;
  onPress: (convId: string) => void;
}

export function ConversationRow({ conv, onPress }: ConversationRowProps) {
  const name = conv.otherUser?.name ?? 'Unknown';
  const time = conv.lastMessageAt
    ? (() => {
        const m = Math.floor((Date.now() - new Date(conv.lastMessageAt).getTime()) / 60000);
        return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h`;
      })()
    : '';

  return (
    <PressableScale
      onPress={() => onPress(conv.id)}
      style={styles.row}
      accessibilityRole="button"
      accessibilityLabel={`Conversation with ${name}. ${conv.lastMessage ?? 'No messages yet.'}`}
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
      {conv.unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{conv.unreadCount}</Text>
        </View>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection:    'row',
    alignItems:       'center',
    gap:              Spacing.md,
    paddingHorizontal: Spacing.gutter,
    paddingVertical:  Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.DIVIDER,
  },
  content:   { flex: 1 },
  topRow:    { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  name:      { ...Typography.label, color: Colors.CREAM, fontWeight: '700' },
  preview:   { ...Typography.caption, color: Colors.MUTED_ASH },
  time:      { ...Typography.caption, color: Colors.MUTED_ASH, fontVariant: ['tabular-nums'] },
  badge: {
    backgroundColor:  Colors.RUST,
    minWidth:         20,
    height:           20,
    borderRadius:     10,
    alignItems:       'center',
    justifyContent:   'center',
    paddingHorizontal: 4,
  },
  badgeText: { ...Typography.tinyLabel, color: Colors.CREAM, fontSize: 10 },
});
