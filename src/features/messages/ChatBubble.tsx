import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, Radius } from '@/lib';
import type { Message } from '@/types';
import { createStyleSheet } from "@/lib/theme";

interface ChatBubbleProps {
  message: Message;
  isOwn:   boolean;
}

/**
 * A correspondence plaque. Own messages sit on an engraved brass plate with light
 * text; others arrive on parchment with ink text. Both carry an ink hairline border.
 */
export function ChatBubble({ message, isOwn }: ChatBubbleProps) {
  const time = new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <View style={[styles.wrapper, isOwn && styles.wrapperOwn]}>
      <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}>
        <Text style={[styles.body, isOwn ? styles.bodyOwn : styles.bodyOther]}>{message.body}</Text>
      </View>
      <Text style={styles.time}>{time}</Text>
    </View>
  );
}

const styles = createStyleSheet((Colors) => ({
  wrapper:    { paddingHorizontal: Spacing.gutter, marginVertical: Spacing.micro, alignItems: 'flex-start' },
  wrapperOwn: { alignItems: 'flex-end' },
  bubble: {
    maxWidth:     '80%',
    borderWidth:  2,
    borderColor:  Colors.INK,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical:   Spacing.sm,
  },
  bubbleOwn:   { backgroundColor: Colors.ACCENT, borderTopRightRadius: Radius.sm },
  bubbleOther: { backgroundColor: Colors.SURFACE, borderTopLeftRadius: Radius.sm },
  body:        { ...Typography.body },
  bodyOwn:     { color: Colors.SURFACE_LIGHT },
  bodyOther:   { color: Colors.TEXT_PRIMARY },
  time:        { ...Typography.caption, color: Colors.TEXT_MUTED, marginTop: 2, fontVariant: ['tabular-nums'] },
}));
