import { supabase } from '@/lib/supabase';
import type { Item, LatLng, FilterState } from '@/types';

const SOURCE_NAMES: Record<string, string> = {
  mcdonalds: "McDonald's", starbucks: 'Starbucks', chickfila: 'Chick-fil-A',
  flipp: 'Flipp', reddit: 'Reddit r/freebies', user: 'Community', facebook: 'Facebook',
};

function rowToItem(row: any): Item {
  const source = row.source ?? 'user';
  return {
    id:           row.id,
    title:        row.title,
    description:  row.description ?? '',
    category:     row.category ?? 'food',
    location:     { lat: row.lat, lng: row.lng, address: row.address },
    photoUrls:    row.photo_urls ?? [],
    source,
    sourceName:   row.source_name ?? SOURCE_NAMES[source] ?? source,
    sourceId:     row.source_id,
    userId:       row.user_id,
    status:       row.status,
    claimType:    row.claim_type ?? 'in-store',
    couponCode:   row.coupon_code,
    claimedCount: row.claimed_count ?? 0,
    createdAt:    row.created_at,
    expiresAt:    row.expires_at,
    distanceKm:   row.distance_km,
    distanceMi:   row.distance_km != null ? row.distance_km * 0.621371 : undefined,
  };
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
    return (data as any[]).map(rowToItem);
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
      const { error } = await supabase.from('saved_items').insert({ user_id: userId, item_id: itemId });
      if (error) throw error;
    } else {
      const { error } = await supabase.from('saved_items')
        .delete().eq('user_id', userId).eq('item_id', itemId);
      if (error) throw error;
    }
  },
};
