import { MMKV } from 'react-native-mmkv';
import type { StateStorage } from 'zustand/middleware';

const mmkv = new MMKV();

export const storage: StateStorage = {
  getItem:    (key) => mmkv.getString(key) ?? null,
  setItem:    (key, value) => mmkv.set(key, value),
  removeItem: (key) => mmkv.delete(key),
};
