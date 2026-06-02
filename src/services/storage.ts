import { supabase } from '@/lib/supabase';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
export const storageService = {
  uploadImage: async (uri: string, bucket: string = 'item-photos'): Promise<string> => {
    // Read the local file as base64
    const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
    const arrayBuffer = decode(base64);

    // Create a unique filename
    const ext = uri.substring(uri.lastIndexOf('.') + 1) || 'jpg';
    const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filename, arrayBuffer, {
        contentType: `image/${ext === 'png' ? 'png' : 'jpeg'}`,
      });
      
    if (error) throw error;
    
    // Get the public URL
    const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(data.path);
    return publicData.publicUrl;
  }
};
