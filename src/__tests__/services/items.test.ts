import { itemsService } from '@/services/items';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: jest.fn().mockResolvedValue({ data: [], error: null }),
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
        })),
      })),
    })),
  },
}));

describe('itemsService.getNearby', () => {
  it('calls get_nearby_items RPC with correct params', async () => {
    const { supabase } = require('@/lib/supabase');
    await itemsService.getNearby(
      { lat: 37.78, lng: -122.41 },
      { radiusKm: 5, category: 'furniture' }
    );
    expect(supabase.rpc).toHaveBeenCalledWith('get_nearby_items', {
      user_lat: 37.78, user_lng: -122.41,
      radius_km: 5, category: 'furniture', max_age_hours: null,
    });
  });
});
