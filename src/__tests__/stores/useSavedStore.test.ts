import { act, renderHook } from '@testing-library/react-native';
import { useSavedStore } from '@/stores/useSavedStore';

describe('useSavedStore', () => {
  beforeEach(() => useSavedStore.getState().setSavedIds([]));

  it('isSaved returns false initially', () => {
    const { result } = renderHook(() => useSavedStore());
    expect(result.current.isSaved('item-1')).toBe(false);
  });

  it('toggle adds an item', () => {
    const { result } = renderHook(() => useSavedStore());
    act(() => result.current.toggle('item-1'));
    expect(result.current.isSaved('item-1')).toBe(true);
  });

  it('toggle removes an already-saved item', () => {
    const { result } = renderHook(() => useSavedStore());
    act(() => { result.current.toggle('item-1'); result.current.toggle('item-1'); });
    expect(result.current.isSaved('item-1')).toBe(false);
  });

  it('setSavedIds seeds the store', () => {
    const { result } = renderHook(() => useSavedStore());
    act(() => result.current.setSavedIds(['a', 'b', 'c']));
    expect(result.current.isSaved('a')).toBe(true);
    expect(result.current.isSaved('d')).toBe(false);
  });
});
