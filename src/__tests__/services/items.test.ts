import { itemsService } from '@/services/items';

jest.mock('@/lib/supabase', () => {
  const chain: any = {};
  const resolved = { data: [], error: null };
  chain.select = jest.fn(() => chain);
  chain.neq    = jest.fn(() => chain);
  chain.eq     = jest.fn(() => chain);
  chain.gte    = jest.fn(() => chain);
  chain.order  = jest.fn(() => chain);
  chain.limit  = jest.fn(() => chain);
  chain.single = jest.fn().mockResolvedValue({ data: null, error: null });
  chain.then   = (resolve: any) => Promise.resolve(resolved).then(resolve);
  chain.catch  = (reject: any) => Promise.resolve(resolved).catch(reject);
  return {
    supabase: {
      rpc:  jest.fn().mockResolvedValue({ data: [], error: null }),
      from: jest.fn(() => chain),
    },
  };
});

describe('itemsService.getNearby', () => {
  it('queries the items table directly (not RPC)', async () => {
    const { supabase } = require('@/lib/supabase');
    await itemsService.getNearby(
      { lat: 37.78, lng: -122.41 },
      { radiusKm: 5, category: 'furniture' }
    );
    expect(supabase.from).toHaveBeenCalledWith('items');
    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  it('returns an array', async () => {
    const result = await itemsService.getNearby(
      { lat: 37.78, lng: -122.41 },
      { radiusKm: 5 }
    );
    expect(Array.isArray(result)).toBe(true);
  });
});
