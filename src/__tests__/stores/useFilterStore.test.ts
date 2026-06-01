import { act, renderHook } from '@testing-library/react-native';
import { useFilterStore } from '@/stores/useFilterStore';

describe('useFilterStore', () => {
  beforeEach(() => useFilterStore.getState().resetFilters());

  it('has default radius of 10km', () => {
    const { result } = renderHook(() => useFilterStore());
    expect(result.current.filters.radiusKm).toBe(10);
  });

  it('setRadius updates radiusKm', () => {
    const { result } = renderHook(() => useFilterStore());
    act(() => result.current.setRadius(25));
    expect(result.current.filters.radiusKm).toBe(25);
  });

  it('setCategory updates category', () => {
    const { result } = renderHook(() => useFilterStore());
    act(() => result.current.setCategory('furniture'));
    expect(result.current.filters.category).toBe('furniture');
  });

  it('resetFilters clears category and resets radius', () => {
    const { result } = renderHook(() => useFilterStore());
    act(() => { result.current.setRadius(50); result.current.setCategory('books'); });
    act(() => result.current.resetFilters());
    expect(result.current.filters.radiusKm).toBe(10);
    expect(result.current.filters.category).toBeUndefined();
  });
});
