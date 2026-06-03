import React, { useState } from 'react';
import {
  View, Text, Pressable, TextInput, Alert
} from 'react-native';
import { X, PaperPlaneRight } from 'phosphor-react-native';
import { Colors, Typography, Radius } from '@/lib';
import { createStyleSheet } from "@/lib/theme";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { communityService } from '@/services/community';
import { itemsService } from '@/services/items';
import { useAuthStore } from '@/stores/useAuthStore';
import type { CommunityComment } from '@/types';

function formatAge(dateString: string) {
  const mins = Math.floor((Date.now() - new Date(dateString).getTime()) / 60000);
  if (mins < 60) return `${Math.max(1, mins)}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

interface CommentsSectionProps {
  postId: string | null;
  entityType?: 'community' | 'item';
  onCommentAdded?: (postId: string) => void;
}

export function CommentsSection({ postId, entityType = 'community', onCommentAdded }: CommentsSectionProps) {
  const { session } = useAuthStore();
  const qc = useQueryClient();

  const [input, setInput] = useState('');
  const [editingComment, setEditingComment] = useState<CommunityComment | null>(null);
  const [replyingToId, setReplyingToId] = useState<string | null>(null);

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['comments', entityType, postId],
    queryFn: () => entityType === 'community' ? communityService.getComments(postId!) : itemsService.getItemComments(postId!),
    enabled: !!postId,
  });

  const createMutation = useMutation({
    mutationFn: (text: string) => entityType === 'community' 
      ? communityService.createComment(postId!, session!.user.id, text, replyingToId || undefined)
      : itemsService.createItemComment(postId!, session!.user.id, text, replyingToId || undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comments', entityType, postId] });
      if (onCommentAdded && postId) onCommentAdded(postId);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, text, parentId }: { id: string, text: string, parentId?: string }) => entityType === 'community'
      ? communityService.updateComment(id, text, parentId)
      : itemsService.updateItemComment(id, text, parentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comments', entityType, postId] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => entityType === 'community'
      ? communityService.deleteComment(id, postId!)
      : itemsService.deleteItemComment(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comments', entityType, postId] });
      if (onCommentAdded && postId) onCommentAdded(postId); // Updates community_posts count
    }
  });

  const handleSend = () => {
    if (!input.trim() || !postId || !session) return;
    if (editingComment) {
      updateMutation.mutate({ id: editingComment.id, text: input.trim(), parentId: editingComment.parentId });
      setEditingComment(null);
    } else {
      createMutation.mutate(input.trim());
      setReplyingToId(null);
    }
    setInput('');
  };

  const handleReply = (userName: string, parentId: string) => {
    setReplyingToId(parentId);
    setInput((prev) => `@${userName} ` + prev);
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete comment', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate(id) }
    ]);
  };

  const threadedComments = React.useMemo(() => {
    const roots = comments.filter(c => !c.parentId);
    const childrenByParent = new Map<string, CommunityComment[]>();
    
    comments.filter(c => c.parentId).forEach(c => {
      const list = childrenByParent.get(c.parentId!) || [];
      list.push(c);
      childrenByParent.set(c.parentId!, list);
    });
    
    const result: (CommunityComment & { isChild?: boolean })[] = [];
    for (const root of roots) {
      result.push(root);
      const children = childrenByParent.get(root.id) || [];
      // Children are already sorted by created_at from the service
      children.forEach(c => result.push({ ...c, isChild: true }));
    }
    return result;
  }, [comments]);

  return (
    <View style={styles.container}>
      <Text style={styles.titleText}>Comments</Text>

      <View style={styles.listContent}>
        {threadedComments.length === 0 ? (
          <Text style={styles.emptyText}>No comments yet. Be the first!</Text>
        ) : (
          threadedComments.map(item => {
            const isOwner = session?.user?.id === item.userId;
            return (
              <View key={item.id} style={[styles.commentRow, item.isChild && styles.childCommentRow]}>
                <View style={[styles.avatar, item.isChild && styles.childAvatar]}>
                  <Text style={[styles.initials, item.isChild && styles.childInitials]}>{item.userInitials}</Text>
                </View>
                <View style={styles.commentBody}>
                  <View style={styles.commentHeader}>
                    <Text style={styles.author}>{item.userName}</Text>
                    <Text style={styles.time}>{formatAge(item.createdAt)}</Text>
                  </View>
                  <Text style={styles.text}>{item.text}</Text>
                  
                  <View style={styles.actionRow}>
                    <Pressable onPress={() => handleReply(item.userName, item.parentId || item.id)} hitSlop={8}>
                      <Text style={styles.actionText}>Reply</Text>
                    </Pressable>
                    {isOwner && (
                      <>
                        <Text style={styles.actionDot}>·</Text>
                        <Pressable onPress={() => { setEditingComment(item); setInput(item.text); }} hitSlop={8}>
                          <Text style={styles.actionText}>Edit</Text>
                        </Pressable>
                        <Text style={styles.actionDot}>·</Text>
                        <Pressable onPress={() => handleDelete(item.id)} hitSlop={8}>
                          <Text style={styles.actionText}>Delete</Text>
                        </Pressable>
                      </>
                    )}
                  </View>
                </View>
              </View>
            );
          })
        )}
      </View>

      <View style={styles.inputRow}>
        {(editingComment || replyingToId) && (
          <Pressable onPress={() => { setEditingComment(null); setReplyingToId(null); setInput(''); }} style={{ marginRight: 8, alignSelf: 'center' }}>
            <X size={16} color={Colors.TEXT_MUTED} />
          </Pressable>
        )}
        <TextInput
          style={styles.input}
          placeholder={editingComment ? "Edit comment..." : replyingToId ? "Reply..." : "Add a comment..."}
          placeholderTextColor={Colors.TEXT_MUTED}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={handleSend}
        />
        <Pressable onPress={handleSend} style={[styles.sendBtn, !input.trim() && { opacity: 0.5 }]} disabled={!input.trim()}>
          <PaperPlaneRight size={20} color={Colors.SURFACE_LIGHT} weight="fill" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = createStyleSheet((Colors) => ({
  container: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: Colors.BORDER,
  },
  titleText: { ...Typography.sectionTitle, color: Colors.TEXT_PRIMARY, marginBottom: 16 },
  
  listContent: { paddingBottom: 16 },
  emptyText: { ...Typography.caption, color: Colors.TEXT_MUTED, textAlign: 'center', marginTop: 32 },
  
  commentRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  childCommentRow: { marginLeft: 44, marginTop: -8, marginBottom: 16 },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.SURFACE_DEEP, alignItems: 'center', justifyContent: 'center' },
  childAvatar: { width: 24, height: 24, borderRadius: 12 },
  initials: { ...Typography.tinyLabel, color: Colors.TEXT_PRIMARY },
  childInitials: { fontSize: 8 },
  commentBody: { flex: 1 },
  commentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  author: { ...Typography.label, color: Colors.TEXT_PRIMARY },
  time: { ...Typography.caption, color: Colors.TEXT_MUTED },
  text: { ...Typography.bodyCompact, color: Colors.TEXT_SECONDARY },
  
  actionRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 8 },
  actionText: { ...Typography.caption, color: Colors.TEXT_MUTED },
  actionDot: { ...Typography.caption, color: Colors.TEXT_MUTED },

  inputRow: { flexDirection: 'row', gap: 8, marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: Colors.BORDER },
  input: { flex: 1, height: 44, backgroundColor: Colors.SURFACE_DEEP, borderRadius: Radius.md, paddingHorizontal: 12, ...Typography.bodyCompact, color: Colors.TEXT_PRIMARY },
  sendBtn: { width: 44, height: 44, backgroundColor: Colors.ACCENT, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
}));
