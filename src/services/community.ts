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
    if (currentlyLiked) {
      await supabase.from('community_post_likes').delete().match({ post_id: postId, user_id: userId });
      await supabase.rpc('decrement_like_count', { row_id: postId });
    } else {
      await supabase.from('community_post_likes').insert({ post_id: postId, user_id: userId });
      await supabase.rpc('increment_like_count', { row_id: postId });
    }
  },

  claimCoupon: async (postId: string): Promise<void> => {
    const { error } = await supabase.from('community_posts').update({ coupon_claimed: true }).eq('id', postId);
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
      return {
        id: d.id,
        postId: d.post_id,
        userId: d.user_id,
        userName: name,
        userInitials: name.substring(0, 2).toUpperCase(),
        userAvatarUrl: d.user_profiles?.avatar_url,
        text: d.text,
        createdAt: d.created_at,
      };
    });
  },

  createComment: async (postId: string, userId: string, text: string): Promise<CommunityComment> => {
    const { data, error } = await supabase
      .from('community_comments')
      .insert({ post_id: postId, user_id: userId, text })
      .select('*, user_profiles!community_comments_user_id_fkey (name, avatar_url)')
      .single();

    if (error) throw error;
    await supabase.rpc('increment_comment_count', { row_id: postId });

    const name = data.user_profiles?.name || 'Anonymous';
    return {
      id: data.id,
      postId: data.post_id,
      userId: data.user_id,
      userName: name,
      userInitials: name.substring(0, 2).toUpperCase(),
      userAvatarUrl: data.user_profiles?.avatar_url,
      text: data.text,
      createdAt: data.created_at,
    };
  }
};
