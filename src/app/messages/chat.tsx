import React, { useState, useRef } from 'react';
import { View, Text, FlatList, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PaperPlaneRight } from 'phosphor-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Colors, Typography, Spacing, Stamp, Radius } from '@/lib';
import { ChatBubble } from '@/features/messages/ChatBubble';
import { RopeDivider } from '@/components/motifs';
import { SkeletonRow } from '@/components/SkeletonRow';
import { useChatThread } from '@/hooks/useChatThread';
import { messagesService } from '@/services/messages';
import { useAuthStore } from '@/stores/useAuthStore';
import type { RootStackParamList } from '@/navigation/types';
import { createStyleSheet } from "@/lib/theme";

type Props = NativeStackScreenProps<RootStackParamList, 'ChatThread'>;

export function ChatThreadScreen({ route }: Props) {
  const { conversationId, itemTitle } = route.params;
  const insets  = useSafeAreaInsets();
  const listRef = useRef<FlatList>(null);

  const { session } = useAuthStore();
  const { data: messages = [], isLoading } = useChatThread(conversationId);
  const [body,    setBody]    = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!body.trim() || sending || !session) return;
    setSending(true);
    const text = body.trim();
    setBody('');
    try {
      await messagesService.sendMessage(conversationId, session.user.id, text);
    } catch {
      setBody(text);
    } finally {
      setSending(false);
    }
  };

  const canSend = !!body.trim() && !sending;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.BACKGROUND }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={insets.top}
    >
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <Text style={styles.eyebrow}>Correspondence</Text>
        <Text style={styles.title} numberOfLines={1}>{itemTitle}</Text>
        <RopeDivider style={styles.rope} />
      </View>

      {isLoading
        ? <View style={{ padding: Spacing.base }}>{Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)}</View>
        : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(m) => m.id}
            renderItem={({ item }) => (
              <ChatBubble message={item} isOwn={item.senderId === session?.user.id} />
            )}
            contentContainerStyle={{ paddingVertical: Spacing.md }}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
            ListEmptyComponent={
              <View style={styles.emptyThread}>
                <Text style={styles.emptyText}>Hail them — say you're after the cache.</Text>
              </View>
            }
          />
        )
      }

      <View style={[styles.inputBar, { paddingBottom: insets.bottom + Spacing.sm }]}>
        <TextInput
          style={styles.input}
          value={body}
          onChangeText={setBody}
          placeholder="Pen a message…"
          placeholderTextColor={Colors.TEXT_MUTED}
          multiline
          maxLength={500}
          returnKeyType="send"
          onSubmitEditing={handleSend}
        />
        <Pressable
          onPress={handleSend}
          style={[styles.sendBtn, !canSend && styles.sendBtnDisabled]}
          accessibilityLabel="Send message"
          accessibilityRole="button"
          disabled={!canSend}
        >
          <PaperPlaneRight size={20} color={Colors.SURFACE_LIGHT} weight="fill" />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = createStyleSheet((Colors) => ({
  header: {
    paddingHorizontal: Spacing.gutter,
    paddingBottom:     Spacing.sm,
    gap:               2,
  },
  eyebrow:    { ...Typography.tinyLabel, color: Colors.TEXT_MUTED },
  title:      { ...Typography.headline, color: Colors.INK },
  rope:       { marginTop: Spacing.sm },
  emptyThread:{ padding: Spacing.hero, alignItems: 'center' },
  emptyText:  { ...Typography.flavorSmall, color: Colors.TEXT_MUTED, textAlign: 'center' },
  inputBar: {
    flexDirection:     'row',
    alignItems:        'flex-end',
    gap:               Spacing.sm,
    paddingHorizontal: Spacing.gutter,
    paddingTop:        Spacing.sm,
    borderTopWidth:    2,
    borderTopColor:    Colors.INK,
    backgroundColor:   Colors.BACKGROUND,
  },
  input: {
    flex:              1,
    backgroundColor:   Colors.SURFACE_DEEP,
    borderWidth:       2,
    borderColor:       Colors.INK,
    borderRadius:      Radius.md,
    color:             Colors.TEXT_PRIMARY,
    fontSize:          16,
    paddingHorizontal: Spacing.md,
    paddingVertical:   Spacing.sm,
    maxHeight:         120,
    minHeight:         48,
  },
  sendBtn: {
    width:           48,
    height:          48,
    backgroundColor: Colors.ACCENT,
    borderWidth:     2,
    borderColor:     Colors.INK,
    borderRadius:    Radius.md,
    alignItems:      'center',
    justifyContent:  'center',
    ...Stamp.sm,
  },
  sendBtnDisabled: { opacity: 0.4 },
}));
