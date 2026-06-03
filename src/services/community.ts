import { supabase } from '@/lib/supabase';
import type { CommunityPost, CommunityComment } from '@/types';

export const communityService = {
  getPosts: async (currentUserId?: string): Promise<CommunityPost[]> => {
    const { data, error } = await supabase
      .from('community_posts')
      .select(`
        id, user_id, type, body, coupon_code, coupon_claimed, photo_urls, like_count, comment_count, created_at,
        user_profiles!community_posts_user_id_fkey (name, avatar_url),
        community_post_likes (user_id)
      `)
      .order('created_at', { ascending: false })
      .limit(30);

    if (error) throw error;

    return data.map((d: any) => {
      const name = d.user_profiles?.name || 'Anonymous';
      const liked = currentUserId ? d.community_post_likes?.some((l: any) => l.user_id === currentUserId) : false;
      return {
        id: d.id,
        userId: d.user_id,
        userName: name,
        userInitials: name.substring(0, 2).toUpperCase(),
        userAvatarUrl: d.user_profiles?.avatar_url,
        userLocation: 'Nearby',
        type: d.type,
        body: d.body,
        couponCode: d.coupon_code,
        couponClaimed: d.coupon_claimed,
        photoUrls: d.photo_urls,
        likeCount: d.like_count,
        commentCount: d.comment_count,
        liked,
        createdAt: d.created_at,
      };
    });
  },

  createPost: async (post: Partial<CommunityPost>): Promise<CommunityPost> => {
    const { data, error } = await supabase
      .from('community_posts')
      .insert({
        user_id: post.userId,
        type: post.type,
        body: post.body,
        coupon_code: post.couponCode,
        photo_urls: post.photoUrls || [],
      })
      .select(`
        id, user_id, type, body, coupon_code, coupon_claimed, photo_urls, like_count, comment_count, created_at,
        user_profiles!community_posts_user_id_fkey (name, avatar_url)
      `)
      .single();

    if (error) throw error;

    const name = (data.user_profiles as any)?.name || 'Anonymous';
    return {
      id: data.id,
      userId: data.user_id,
      userName: name,
      userInitials: name.substring(0, 2).toUpperCase(),
      userAvatarUrl: (data.user_profiles as any)?.avatar_url,
      userLocation: 'Nearby',
      type: data.type,
      body: data.body,
      couponCode: data.coupon_code,
      couponClaimed: data.coupon_claimed,
      photoUrls: data.photo_urls,
      likeCount: data.like_count,
      commentCount: data.comment_count,
      liked: false,
      createdAt: data.created_at,
    };
  },

  deletePost: async (id: string): Promise<void> => {
    const { error } = await supabase.from('community_posts').delete().eq('id', id);
    if (error) throw error;
  },

  updatePost: async (id: string, updates: Partial<CommunityPost>): Promise<void> => {
    const { error } = await supabase
      .from('community_posts')
      .update({
        type: updates.type,
        body: updates.body,
        coupon_code: updates.couponCode,
        photo_urls: updates.photoUrls,
      })
      .eq('id', id);
    if (error) throw error;
  },

  toggleLike: async (postId: string, userId: string, currentlyLiked: boolean): Promise<void> => {
    // like_count is updated automatically by the on_like_change DB trigger.
    if (currentlyLiked) {
      const { error } = await supabase.from('community_post_likes').delete().match({ post_id: postId, user_id: userId });
      if (error) throw error;
      await supabase.rpc('decrement_like_count', { row_id: postId });
    } else {
      const { error } = await supabase.from('community_post_likes').insert({ post_id: postId, user_id: userId });
      if (error) throw error;
      await supabase.rpc('increment_like_count', { row_id: postId });
    }
  },

  claimCoupon: async (postId: string): Promise<void> => {
    // Uses the claim_coupon() SECURITY DEFINER RPC which adds an auth check,
    // idempotency guard (only claims if not already claimed), and audit fields.
    const { error } = await supabase.rpc('claim_coupon', { post_id: postId });
    if (error) throw error;
  },

  getComments: async (postId: string): Promise<CommunityComment[]> => {
    const { data, error } = await supabase
      .from('community_comments')
      .select('*, user_profiles!community_comments_user_id_fkey (name, avatar_url)')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return data.map((d: any) => {
      const name = d.user_profiles?.name || 'Anonymous';
      let text = d.text as string;
      let parentId: string | undefined = undefined;
      const match = text.match(/^\[reply_to:([a-f0-9\-]+)\] /i);
      if (match) {
        parentId = match[1];
        text = text.substring(match[0].length);
      }
      return {
        id: d.id,
        postId: d.post_id,
        userId: d.user_id,
        userName: name,
        userInitials: name.substring(0, 2).toUpperCase(),
        userAvatarUrl: d.user_profiles?.avatar_url,
        parentId,
        text,
        createdAt: d.created_at,
      };
    });
  },

  createComment: async (postId: string, userId: string, text: string, parentId?: string): Promise<CommunityComment> => {
    const finalText = parentId ? `[reply_to:${parentId}] ${text}` : text;
    const { data, error } = await supabase
      .from('community_comments')
      .insert({ post_id: postId, user_id: userId, text: finalText })
      .select('*, user_profiles!community_comments_user_id_fkey (name, avatar_url)')
      .single();

    if (error) throw error;
    await supabase.rpc('increment_comment_count', { row_id: postId });

    const name = data.user_profiles?.name || 'Anonymous';
    let outputText = data.text as string;
    let outParentId: string | undefined = undefined;
    const match = outputText.match(/^\[reply_to:([a-f0-9\-]+)\] /i);
    if (match) {
      outParentId = match[1];
      outputText = outputText.substring(match[0].length);
    }
    
    return {
      id: data.id,
      postId: data.post_id,
      userId: data.user_id,
      userName: name,
      userInitials: name.substring(0, 2).toUpperCase(),
      userAvatarUrl: data.user_profiles?.avatar_url,
      parentId: outParentId,
      text: outputText,
      createdAt: data.created_at,
    };
  },

  deleteComment: async (commentId: string, postId: string): Promise<void> => {
    const { error } = await supabase.from('community_comments').delete().eq('id', commentId);
    if (error) throw error;
    await supabase.rpc('decrement_comment_count', { row_id: postId });
  },

  updateComment: async (commentId: string, text: string, parentId?: string): Promise<void> => {
    const finalText = parentId ? `[reply_to:${parentId}] ${text}` : text;
    const { error } = await supabase.from('community_comments').update({ text: finalText }).eq('id', commentId);
    if (error) throw error;
  },
};
