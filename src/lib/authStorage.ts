import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { MMKV } from 'react-native-mmkv';

const KEY_ID = 'ff-auth-enc-key';
let _mmkv: MMKV | undefined;

async function getMmkv(): Promise<MMKV> {
  if (_mmkv) return _mmkv;
  let encKey = await SecureStore.getItemAsync(KEY_ID);
  if (!encKey) {
    const bytes = Crypto.getRandomBytes(32);
    encKey = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    await SecureStore.setItemAsync(KEY_ID, encKey);
  }
  _mmkv = new MMKV({ id: 'ff-auth', encryptionKey: encKey });
  return _mmkv;
}

// Supabase SupportedStorage accepts async getItem/setItem/removeItem
export const authStorage = {
  getItem:    async (key: string) => (await getMmkv()).getString(key) ?? null,
  setItem:    async (key: string, value: string) => { (await getMmkv()).set(key, value); },
  removeItem: async (key: string) => { (await getMmkv()).delete(key); },
};
