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
    sourceName:   row.business_name ?? row.source_name ?? SOURCE_NAMES[source] ?? source,
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
      const { error } = await supabase.from('saved_items').insert({ user_id: userId, item_id: itemId });
      if (error) throw error;
    } else {
      const { error } = await supabase.from('saved_items')
        .delete().eq('user_id', userId).eq('item_id', itemId);
      if (error) throw error;
    }
  },
};
