import { supabase, isSupabaseConfigured } from '../supabase/config';

export interface UploadProgressCallback {
  (progress: number): void;
}

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export async function uploadRoomImage(
  file: File,
  userId: string,
  onProgress?: UploadProgressCallback
): Promise<string> {
  // Validate file type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error('Invalid file format. Please upload JPG, PNG, or WebP images only.');
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error('Image size must be less than 5 MB.');
  }

  if (isSupabaseConfigured && supabase) {
    try {
      onProgress?.(25);
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `${userId}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

      onProgress?.(50);
      const { data, error } = await supabase.storage
        .from('room-photos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (error) {
        console.error('Supabase Storage upload failed:', error);
        throw new Error('Failed to upload photo to Supabase Storage: ' + error.message);
      }

      onProgress?.(90);
      const { data: urlData } = supabase.storage
        .from('room-photos')
        .getPublicUrl(data.path);

      onProgress?.(100);
      return urlData.publicUrl;
    } catch (err: any) {
      console.warn('Supabase storage upload error, falling back to data URL:', err);
      // If error occurs, fall back to data URL simulation
    }
  }

  // Fallback demo/mock upload: simulate progress and convert to local data URL
  return new Promise((resolve) => {
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 25;
      onProgress?.(Math.min(currentProgress, 100));
      if (currentProgress >= 100) {
        clearInterval(interval);
        const reader = new FileReader();
        reader.onload = () => {
          resolve(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    }, 150);
  });
}
