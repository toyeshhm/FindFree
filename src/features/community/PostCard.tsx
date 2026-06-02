import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, Image, Share, Alert, ScrollView
} from 'react-native';
import { Heart, ChatCircle, ShareNetwork, Trash, Warning, PencilSimple } from 'phosphor-react-native';
import { Colors, Typography, Spacing, Radius } from '@/lib';
import { useAuthStore } from '@/stores/useAuthStore';
import type { CommunityPost, CommunityPostType } from '@/types';
import { createStyleSheet } from "@/lib/theme";

interface PostCardProps {
  post: CommunityPost;
  onLike: (id: string) => void;
  onClaimCode: (id: string) => void;
  onComment: (id: string) => void;
  onReport: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit?: (post: CommunityPost) => void;
}

function formatAge(isoString: string): string {
  const mins = Math.floor((Date.now() - new Date(isoString).getTime()) / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

interface TypeBadgeProps { type: CommunityPostType }
function TypeBadge({ type }: TypeBadgeProps) {
  const config: Record<CommunityPostType, { label: string; bg: string }> = {
    coupon:     { label: 'COUPON',     bg: Colors.ACCENT_LIGHT },
    'free-stuff': { label: 'FREE STUFF', bg: Colors.SEALING_WAX },
    find:       { label: 'FIND',       bg: Colors.SEA },
  };
  const { label, bg } = config[type];
  return (
    <View style={[styles.typeBadge, { backgroundColor: bg }]}>
      <Text style={styles.typeBadgeText}>{label}</Text>
    </View>
  );
}

export function PostCard({ post, onLike, onClaimCode, onComment, onReport, onDelete, onEdit }: PostCardProps) {
  const [truncated, setTruncated] = useState(false);
  const [expanded, setExpanded]   = useState(false);
  const { session } = useAuthStore();
  
  const isOwner = post.userId === 'me' || (session?.user?.id && session.user.id === post.userId);

  const handleShare = async () => {
    try {
      await Share.share({ message: post.body });
    } catch {}
  };

  return (
    <View style={styles.card}>
      {/* ── Top row: avatar + meta + badge ── */}
      <View style={styles.topRow}>
        <View style={styles.avatarWrap}>
          {post.userAvatarUrl ? (
            <Image source={{ uri: post.userAvatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.initials}>{post.userInitials}</Text>
            </View>
          )}
        </View>

        <View style={styles.metaCol}>
          <Text style={styles.userName}>{post.userName}</Text>
          <Text style={styles.metaSub}>
            {post.userLocation}
            {'  ·  '}
            {formatAge(post.createdAt)}
          </Text>
        </View>

        <TypeBadge type={post.type} />
      </View>

      {/* ── Body ── */}
      <Text
        style={styles.body}
        numberOfLines={expanded ? undefined : 4}
        onTextLayout={(e) => {
          if (!expanded && e.nativeEvent.lines.length >= 4) setTruncated(true);
        }}
      >
        {post.body}
      </Text>
      {truncated && !expanded && (
        <Pressable onPress={() => setExpanded(true)} hitSlop={4}>
          <Text style={styles.readMore}>Read more</Text>
        </Pressable>
      )}

      {/* ── Coupon code block ── */}
      {post.type === 'coupon' && post.couponCode && (
        <View style={styles.codeBlock}>
          <Text style={styles.codeText} numberOfLines={1}>{post.couponCode}</Text>
          {post.couponClaimed ? (
            <Text style={styles.claimedText}>CLAIMED</Text>
          ) : (
            <Pressable
              style={styles.claimBtn}
              onPress={() => onClaimCode(post.id)}
              accessibilityRole="button"
              accessibilityLabel={`Claim coupon code ${post.couponCode}`}
            >
              <Text style={styles.claimBtnText}>CLAIM CODE</Text>
            </Pressable>
          )}
        </View>
      )}

      {/* ── Photos ── */}
      {post.photoUrls && post.photoUrls.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoScroll}>
          {post.photoUrls.map((url, i) => (
            <Image key={i} source={{ uri: url }} style={styles.postPhoto} />
          ))}
        </ScrollView>
      )}

      {/* ── Action row ── */}
      <View style={styles.actionRow}>
        <Pressable
          style={styles.actionBtn}
          onPress={() => onLike(post.id)}
          accessibilityRole="button"
          accessibilityLabel={post.liked ? 'Unlike post' : 'Like post'}
        >
          <Heart
            size={18}
            color={post.liked ? Colors.SEALING_WAX : Colors.TEXT_MUTED}
            weight={post.liked ? 'fill' : 'regular'}
          />
          <Text style={[styles.actionCount, post.liked && styles.actionCountLiked]}>
            {post.likeCount}
          </Text>
        </Pressable>

        <Pressable
          style={styles.actionBtn}
          onPress={() => onComment(post.id)}
          accessibilityRole="button"
          accessibilityLabel="View comments"
        >
          <ChatCircle size={18} color={Colors.TEXT_MUTED} />
          <Text style={styles.actionCount}>{post.commentCount}</Text>
        </Pressable>

        <Pressable
          style={styles.actionBtn}
          onPress={handleShare}
          accessibilityRole="button"
          accessibilityLabel="Share post"
        >
          <ShareNetwork size={18} color={Colors.TEXT_MUTED} />
        </Pressable>

        {isOwner ? (
          <View style={{ marginLeft: 'auto', flexDirection: 'row', gap: 16 }}>
            <Pressable onPress={() => onEdit?.(post)} style={styles.actionBtn}>
              <PencilSimple size={20} color={Colors.TEXT_MUTED} />
            </Pressable>
            <Pressable
              onPress={() => {
                Alert.alert('Delete Post', 'Are you sure you want to delete this post?', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Delete', style: 'destructive', onPress: () => onDelete(post.id) },
                ]);
              }}
              style={styles.actionBtn}
            >
              <Trash size={20} color={Colors.TEXT_MUTED} />
            </Pressable>
          </View>
        ) : (
          <Pressable
            style={[styles.actionBtn, { marginLeft: 'auto' }]}
            onPress={() => onReport(post.id)}
            accessibilityRole="button"
            accessibilityLabel="Report post"
          >
            <Warning size={18} color={Colors.TEXT_MUTED} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = createStyleSheet((Colors) => ({
  card: {
    backgroundColor:  Colors.SURFACE,
    borderWidth:      2,
    borderColor:      Colors.INK,
    borderRadius:     Radius.md,
    borderLeftWidth:  3,
    borderLeftColor:  Colors.ACCENT,
    padding:          14,
    marginHorizontal: 16,
    marginBottom:     12,
  },
  topRow: {
    flexDirection:  'row',
    alignItems:     'flex-start',
    gap:            10,
    marginBottom:   10,
  },
  avatarWrap: {
    flexShrink: 0,
  },
  avatar: {
    width:           40,
    height:          40,
    borderRadius:    20,
    backgroundColor: Colors.SURFACE_DEEP,
    borderWidth:     2,
    borderColor:     Colors.INK,
    alignItems:      'center',
    justifyContent:  'center',
    overflow:        'hidden',
  },
  initials: {
    ...Typography.label,
    color:     Colors.TEXT_PRIMARY,
    textAlign: 'center',
  },
  metaCol: {
    flex:           1,
    justifyContent: 'center',
  },
  userName: {
    ...Typography.subheading,
    color:        Colors.TEXT_PRIMARY,
    marginBottom: 2,
  },
  metaSub: {
    ...Typography.caption,
    color: Colors.TEXT_MUTED,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical:   3,
    borderRadius:      20,
    alignSelf:         'flex-start',
    flexShrink:        0,
  },
  typeBadgeText: {
    ...Typography.tinyLabel,
    color: Colors.SURFACE_LIGHT,
  },
  body: {
    ...Typography.body,
    color:        Colors.TEXT_SECONDARY,
    marginBottom: 4,
  },
  readMore: {
    ...Typography.caption,
    color:        Colors.ACCENT,
    marginBottom: 8,
  },
  codeBlock: {
    flexDirection:    'row',
    alignItems:       'center',
    borderWidth:      2,
    borderColor:      Colors.ACCENT,
    backgroundColor:  Colors.SURFACE_DEEP,
    borderRadius:     Radius.md,
    padding:          12,
    marginTop:        8,
    gap:              8,
  },
  codeText: {
    ...Typography.headline,
    fontFamily:  'monospace',
    color:       Colors.ACCENT,
    flex:        1,
  },
  claimBtn: {
    backgroundColor:  Colors.ACCENT,
    paddingHorizontal: 12,
    paddingVertical:  6,
    borderRadius:     Radius.sm,
    flexShrink:       0,
  },
  claimBtnText: {
    ...Typography.tinyLabel,
    color: Colors.SURFACE_LIGHT,
  },
  claimedText: {
    ...Typography.tinyLabel,
    color:      Colors.TEXT_MUTED,
    flexShrink: 0,
  },
  photoScroll: {
    gap: 8,
    marginTop: 10,
  },
  postPhoto: {
    width: 240,
    height: 160,
    borderRadius: Radius.sm,
    backgroundColor: Colors.SURFACE_DEEP,
    borderWidth: 1,
    borderColor: Colors.BORDER,
    resizeMode: 'cover',
  },
  actionRow: {
    flexDirection:  'row',
    gap:            20,
    marginTop:      10,
    paddingTop:     10,
    borderTopWidth: 1,
    borderTopColor: Colors.BORDER,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           4,
    minHeight:     44,
  },
  actionCount: {
    ...Typography.caption,
    color: Colors.TEXT_MUTED,
  },
  actionCountLiked: {
    color: Colors.SEALING_WAX,
  },
}));
