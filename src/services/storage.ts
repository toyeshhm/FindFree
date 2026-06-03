import { supabase } from '@/lib/supabase';
const ALLOWED_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif']);

const CONTENT_TYPES: Record<string, string> = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
  webp: 'image/webp', heic: 'image/heic', heif: 'image/heif',
};

export const storageService = {
  // userId is required so the upload path matches the RLS policy:
  //   (storage.foldername(name))[1] = auth.uid()::text
  uploadImage: async (uri: string, userId: string, bucket: string = 'item-photos'): Promise<string> => {
    const raw = uri.substring(uri.lastIndexOf('.') + 1).toLowerCase().split('?')[0];
    const ext = ALLOWED_EXTENSIONS.has(raw) ? raw : 'jpg';

    const response = await fetch(uri);
    const arrayBuffer = await response.arrayBuffer();

    // Path must be <userId>/<filename> to satisfy the storage INSERT RLS policy.
    const filename = `${userId}/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filename, arrayBuffer, {
        contentType: CONTENT_TYPES[ext] ?? 'image/jpeg',
      });

    if (error) throw error;

    const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(data.path);
    return publicData.publicUrl;
  },
};
