import { supabase } from '@/lib/supabase';
import type { Item, LatLng, FilterState } from '@/types';

const SOURCE_NAMES: Record<string, string> = {
  mcdonalds: "McDonald's", starbucks: 'Starbucks', chickfila: 'Chick-fil-A',
  flipp: 'Flipp', reddit: 'Reddit', user: 'Community', facebook: 'Facebook',
  slickdeals: 'Slickdeals', '9to5toys': '9to5Toys', hip2save: 'Hip2Save',
  dealnews: 'DealNews', krazycouponlady: 'Krazy Coupon Lady',
};

function getDefaultLogo(source: string, sourceName: string): string | null {
  const s = (sourceName + ' ' + source).toLowerCase();
  if (s.includes('reddit')) return 'https://www.redditinc.com/assets/images/site/reddit-logo.png';
  if (s.includes('mcdonald')) return 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/McDonald%27s_Golden_Arches.svg/512px-McDonald%27s_Golden_Arches.svg.png';
  if (s.includes('starbucks')) return 'https://upload.wikimedia.org/wikipedia/en/thumb/d/d3/Starbucks_Corporation_Logo_2011.svg/512px-Starbucks_Corporation_Logo_2011.svg.png';
  if (s.includes('chick-fil-a') || s.includes('chickfila')) return 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Chick-fil-A_Logo.svg/512px-Chick-fil-A_Logo.svg.png';
  if (s.includes('wendy')) return 'https://upload.wikimedia.org/wikipedia/en/thumb/3/32/Wendy%27s_full_logo_2012.svg/512px-Wendy%27s_full_logo_2012.svg.png';
  if (s.includes('burger king')) return 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/Burger_King_2020.svg/512px-Burger_King_2020.svg.png';
  if (s.includes('subway')) return 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Subway_2016_logo.svg/512px-Subway_2016_logo.svg.png';
  if (s.includes('flipp')) return 'https://corp.flipp.com/wp-content/uploads/2022/04/Flipp_logo.png';
  if (s.includes('slickdeal')) return 'https://static.slickdealscdn.com/common/images/slickdeals-logo.png';
  if (s.includes('9to5')) return 'https://9to5toys.com/wp-content/uploads/sites/3/2020/04/9to5Toys-logo.png';
  if (s.includes('hip2save')) return 'https://hip2save.com/wp-content/themes/hip2save/images/logo.png';
  if (s.includes('dealnews')) return 'https://www.dealnews.com/img/logos/dealnews-logo-2x.png';
  return null;
}

function rowToItem(row: any): Item {
  const source = row.source ?? 'user';
  const sourceName = row.business_name ?? row.source_name ?? SOURCE_NAMES[source] ?? source;
  const photoUrls = (row.photo_urls ?? []).map((url: string) => url.replace(/&amp;/g, '&'));
  const defaultLogo = photoUrls.length === 0 ? getDefaultLogo(source, sourceName) : null;
  const finalPhotoUrls = defaultLogo ? [defaultLogo] : photoUrls;

  return {
    id:           row.id,
    title:        row.title,
    description:  row.description ?? '',
    category:     row.category ?? 'food',
    location:     { lat: row.lat, lng: row.lng, address: row.address },
    photoUrls:    finalPhotoUrls,
    source,
    sourceName,
    sourceId:     row.source_id,
    sourceUrl:    row.source_url,
    tags:         row.tags ?? [],
    businessName: row.business_name,
    claimInstructions: row.claim_instructions,
    userId:       row.user_id,
    status:       row.status,
    claimType:    row.deal_type ?? row.claim_type ?? 'in-store',
    couponCode:   row.code ?? row.coupon_code,
    claimedCount: row.claimed_count ?? 0,
    likeCount:    row.like_count ?? 0,
    likedByMe:    row.liked_by_me ?? false,
    createdAt:    row.created_at,
    expiresAt:    row.expires_at,
    distanceKm:   row.distance_km,
    distanceMi:   row.distance_km != null ? row.distance_km * 0.621371 : undefined,
  };
}

const CHAINS = ['McDonald\'s', 'Starbucks', 'Chick-fil-A', 'Dunkin', 'Chipotle', 'Taco Bell', 'Wendy\'s', 'Burger King', 'Subway', 'Domino\'s'];

function extractChainName(text: string): string | null {
  for (const chain of CHAINS) {
    if (text.toLowerCase().includes(chain.toLowerCase())) return chain;
  }
  return null;
}

async function resolvePlaces(items: Item[], location: LatLng): Promise<Item[]> {
  const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY;
  if (!GOOGLE_API_KEY) return items;

  const resolved = await Promise.all(items.map(async (item) => {
    // If it already has a physical location, skip
    if (item.location.lat != null && item.location.lng != null) return item;
    
    // Check if it's a known chain
    const chainName = extractChainName(item.title) || extractChainName(item.description);
    if (!chainName) return item;

    try {
      const query = encodeURIComponent(chainName);
      const url = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${query}&inputtype=textquery&locationbias=circle:20000@${location.lat},${location.lng}&fields=geometry,formatted_address&key=${GOOGLE_API_KEY}`;
      const res = await fetch(url);
      const json = await res.json();
      
      if (json.candidates && json.candidates.length > 0) {
        const closest = json.candidates[0];
        const lat = closest.geometry?.location?.lat;
        const lng = closest.geometry?.location?.lng;
        
        if (lat && lng) {
          const R = 6371; // km
          const dLat = (lat - location.lat) * Math.PI / 180;
          const dLng = (lng - location.lng) * Math.PI / 180;
          const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(location.lat * Math.PI / 180) * Math.cos(lat * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          const distanceKm = R * c;
          
          return {
            ...item,
            location: { lat, lng, address: closest.formatted_address },
            sourceName: chainName,
            distanceKm: distanceKm,
            distanceMi: distanceKm * 0.621371,
          };
        }
      }
    } catch (e) {
      console.warn('Google Places API error', e);
    }
    return item;
  }));
  return resolved;
}

export const itemsService = {
  getNearby: async (location: LatLng, filters: FilterState): Promise<Item[]> => {
    const { data, error } = await supabase.rpc('get_nearby_items', {
      user_lat:      location.lat,
      user_lng:      location.lng,
      radius_km:     filters.radiusKm,
      category:      filters.category ?? null,
      max_age_hours: filters.maxAgeHours ?? null,
    });
    if (error) throw error;
    
    let parsedItems = (data as any[]).map(rowToItem);
    parsedItems = await resolvePlaces(parsedItems, location);
    
    // Optional: Sort by newly computed distances since online deals were originally 0 distance
    parsedItems.sort((a, b) => (a.distanceKm ?? Number.MAX_VALUE) - (b.distanceKm ?? Number.MAX_VALUE));
    
    return parsedItems;
  },

  getById: async (itemId: string): Promise<Item> => {
    const { data, error } = await supabase
      .from('items').select('*').eq('id', itemId).single();
    if (error) throw error;
    return rowToItem(data);
  },

  getSaved: async (userId: string): Promise<Item[]> => {
    const { data, error } = await supabase
      .from('saved_items').select('item:items(*)').eq('user_id', userId);
    if (error) throw error;
    return (data as any[]).map((row) => rowToItem(row.item));
  },

  create: async (payload: {
    title: string; description: string; category: string;
    lat: number; lng: number; photoUrls: string[]; userId: string;
  }): Promise<Item> => {
    const { data, error } = await supabase
      .from('items')
      .insert({
        title: payload.title, description: payload.description,
        category: payload.category, lat: payload.lat, lng: payload.lng,
        photo_urls: payload.photoUrls, user_id: payload.userId, source: 'user',
      })
      .select().single();
    if (error) throw error;
    return rowToItem(data);
  },

  delete: async (itemId: string): Promise<void> => {
    const { error } = await supabase
      .from('items').update({ status: 'deleted' }).eq('id', itemId);
    if (error) throw error;
  },

  toggleSave: async (userId: string, itemId: string, saved: boolean): Promise<void> => {
    if (saved) {
      const { error } = await supabase.from('saved_items')
        .insert({ user_id: userId, item_id: itemId });
      // Ignore conflict errors if they tap quickly and it inserts twice
      if (error && error.code !== '23505') throw error;
    } else {
      const { error } = await supabase.from('saved_items')
        .delete().eq('user_id', userId).eq('item_id', itemId);
      if (error) throw error;
    }
  },

  getItemComments: async (itemId: string) => {
    const { data, error } = await supabase
      .from('item_comments')
      .select('*, user_profiles!item_comments_user_id_fkey(name, avatar_url)')
      .eq('item_id', itemId)
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
        postId: d.item_id, // Map item_id to postId so we can reuse CommunityComment type easily
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

  createItemComment: async (itemId: string, userId: string, text: string, parentId?: string) => {
    const finalText = parentId ? `[reply_to:${parentId}] ${text}` : text;
    const { data, error } = await supabase
      .from('item_comments')
      .insert({ item_id: itemId, user_id: userId, text: finalText })
      .select('*, user_profiles!item_comments_user_id_fkey(name, avatar_url)')
      .single();

    if (error) throw error;
    
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
      postId: data.item_id,
      userId: data.user_id,
      userName: name,
      userInitials: name.substring(0, 2).toUpperCase(),
      userAvatarUrl: data.user_profiles?.avatar_url,
      parentId: outParentId,
      text: outputText,
      createdAt: data.created_at,
    };
  },

  updateItemComment: async (commentId: string, text: string, parentId?: string): Promise<void> => {
    const finalText = parentId ? `[reply_to:${parentId}] ${text}` : text;
    const { error } = await supabase.from('item_comments').update({ text: finalText }).eq('id', commentId);
    if (error) throw error;
  },

  deleteItemComment: async (commentId: string): Promise<void> => {
    const { error } = await supabase.from('item_comments').delete().eq('id', commentId);
    if (error) throw error;
  },

  toggleLike: async (userId: string, itemId: string, liked: boolean): Promise<void> => {
    if (liked) {
      const { error } = await supabase.from('item_likes')
        .insert({ user_id: userId, item_id: itemId });
      if (error && error.code !== '23505') throw error;
    } else {
      const { error } = await supabase.from('item_likes')
        .delete().eq('user_id', userId).eq('item_id', itemId);
      if (error) throw error;
    }
  },

  submitFeedback: async (userId: string, itemId: string | undefined, message: string): Promise<void> => {
    const { error } = await supabase.from('app_feedback').insert({ user_id: userId, item_id: itemId || null, message });
    if (error) throw error;
  }
};
