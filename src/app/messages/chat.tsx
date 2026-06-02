import React, { useState, useRef } from 'react';
import { View, Text, FlatList, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PaperPlaneRight } from 'phosphor-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Colors, Typography, Spacing } from '@/lib';
import { ChatBubble } from '@/features/messages/ChatBubble';
import { SkeletonRow } from '@/components/SkeletonRow';
import { useChatThread } from '@/hooks/useChatThread';
import { messagesService } from '@/services/messages';
import { useAuthStore } from '@/stores/useAuthStore';
import type { RootStackParamList } from '@/navigation/types';

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

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.CHARCOAL }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={insets.top}
    >
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <Text style={styles.title} numberOfLines={1}>{itemTitle}</Text>
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
                <Text style={styles.emptyText}>Say hello and tell them you're interested.</Text>
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
          placeholder="Type a message…"
          placeholderTextColor={Colors.DISABLED_GRAY}
          multiline
          maxLength={500}
          returnKeyType="send"
          onSubmitEditing={handleSend}
        />
        <Pressable
          onPress={handleSend}
          style={[styles.sendBtn, (!body.trim() || sending) && styles.sendBtnDisabled]}
          accessibilityLabel="Send message"
          accessibilityRole="button"
          disabled={!body.trim() || sending}
        >
          <PaperPlaneRight size={20} color={Colors.CREAM} weight="bold" />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: Spacing.gutter,
    paddingBottom:     Spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: Colors.RUST,
  },
  title:      { ...Typography.headline, color: Colors.CREAM },
  emptyThread:{ padding: Spacing.hero, alignItems: 'center' },
  emptyText:  { ...Typography.caption, color: Colors.MUTED_ASH, textAlign: 'center' },
  inputBar: {
    flexDirection:    'row',
    alignItems:       'flex-end',
    gap:              Spacing.sm,
    paddingHorizontal: Spacing.gutter,
    paddingTop:       Spacing.sm,
    borderTopWidth:   2,
    borderTopColor:   Colors.RUST,
    backgroundColor:  Colors.CHARCOAL,
  },
  input: {
    flex:              1,
    backgroundColor:   Colors.MID_CHARCOAL,
    borderWidth:       2,
    borderColor:       Colors.RUST,
    color:             Colors.CREAM,
    fontSize:          14,
    paddingHorizontal: Spacing.md,
    paddingVertical:   Spacing.sm,
    maxHeight:         120,
    minHeight:         48,
  },
  sendBtn:        { width: 48, height: 48, backgroundColor: Colors.RUST, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled:{ opacity: 0.4 },
});
