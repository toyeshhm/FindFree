import * as SecureStore from 'expo-secure-store';

// Supabase SupportedStorage accepts async getItem/setItem/removeItem.
// We use expo-secure-store which is officially supported in both Expo Go
// and bare native development builds, providing robust secure storage.
export const authStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (e) {
      console.warn('authStorage.getItem failed:', e);
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (e) {
      console.warn('authStorage.setItem failed:', e);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (e) {
      console.warn('authStorage.removeItem failed:', e);
    }
  },
};
