import * as SecureStore from 'expo-secure-store';
import type { StateStorage } from 'zustand/middleware';

// In-memory store to guarantee instantaneous, synchronous read/write access.
const memoryStore = new Map<string, string>();

// Eagerly pre-populate memoryStore with known persisted keys in the background.
// This ensures they are populated before the React components start using the store.
try {
  SecureStore.getItemAsync('ff-filters')
    .then((val) => {
      if (val) memoryStore.set('ff-filters', val);
    })
    .catch(() => {});
} catch (e) {}

export const storage: StateStorage = {
  getItem: (key: string): string | null => {
    return memoryStore.get(key) ?? null;
  },
  setItem: (key: string, value: string): void => {
    memoryStore.set(key, value);
    // Persist asynchronously in the background.
    SecureStore.setItemAsync(key, value).catch((e) => {
      console.warn('storage.setItem background persist failed:', e);
    });
  },
  removeItem: (key: string): void => {
    memoryStore.delete(key);
    // Persist asynchronously in the background.
    SecureStore.deleteItemAsync(key).catch((e) => {
      console.warn('storage.removeItem background persist failed:', e);
    });
  },
};
