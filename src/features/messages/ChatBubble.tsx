import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing } from '@/lib';
import type { Message } from '@/types';

interface ChatBubbleProps {
  message: Message;
  isOwn:   boolean;
}

export function ChatBubble({ message, isOwn }: ChatBubbleProps) {
  const time = new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <View style={[styles.wrapper, isOwn && styles.wrapperOwn]}>
      <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}>
        <Text style={styles.body}>{message.body}</Text>
      </View>
      <Text style={styles.time}>{time}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper:     { paddingHorizontal: Spacing.gutter, marginVertical: 4, alignItems: 'flex-start' },
  wrapperOwn:  { alignItems: 'flex-end' },
  bubble: {
    maxWidth:        '80%',
    backgroundColor: Colors.MID_CHARCOAL,
    borderWidth:     1,
    borderColor:     Colors.DIVIDER,
    padding:         Spacing.md,
  },
  bubbleOwn:  { backgroundColor: Colors.RUST, borderColor: Colors.RUST },
  body:       { ...Typography.body, color: Colors.CREAM },
  time:       { ...Typography.tinyLabel, color: Colors.MUTED_ASH, marginTop: 2, fontVariant: ['tabular-nums'] },
});
