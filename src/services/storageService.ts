import { supabase, isSupabaseConfigured } from '../supabase/config';

export interface UploadProgressCallback {
  (progress: number): void;
}

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB max raw input from phone camera

/**
 * Compresses and resizes an image file down to max 1400px at 0.82 quality.
 * Reduces raw 5-15 MB phone photos down to ~100-200 KB while preserving crystal-clear clarity.
 */
export async function compressAndOptimizeImage(
  file: File,
  maxWidth = 1400,
  quality = 0.82
): Promise<{ dataUrl: string; blob: Blob }> {
  return new Promise((resolve, reject) => {
    // 10s safety timeout to prevent hanging
    const timeout = setTimeout(() => {
      reject(new Error('Image processing timed out. Please try a different photo.'));
    }, 10000);

    const reader = new FileReader();

    reader.onerror = () => {
      clearTimeout(timeout);
      reject(new Error('Could not read image file from your device.'));
    };

    reader.onload = (e) => {
      const rawDataUrl = e.target?.result as string;
      if (!rawDataUrl) {
        clearTimeout(timeout);
        reject(new Error('Empty image file.'));
        return;
      }

      const img = new Image();
      img.onerror = () => {
        clearTimeout(timeout);
        // If canvas image load fails (e.g. unsupported HEIC on desktop), fallback to raw data url
        resolve({ dataUrl: rawDataUrl, blob: file });
      };

      img.onload = () => {
        try {
          let { width, height } = img;
          if (width > maxWidth || height > maxWidth) {
            if (width > height) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxWidth) / height);
              height = maxWidth;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = Math.max(width, 1);
          canvas.height = Math.max(height, 1);
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            clearTimeout(timeout);
            resolve({ dataUrl: rawDataUrl, blob: file });
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const optimizedDataUrl = canvas.toDataURL('image/jpeg', quality);

          canvas.toBlob(
            (blob) => {
              clearTimeout(timeout);
              resolve({
                dataUrl: optimizedDataUrl,
                blob: blob || file,
              });
            },
            'image/jpeg',
            quality
          );
        } catch {
          clearTimeout(timeout);
          resolve({ dataUrl: rawDataUrl, blob: file });
        }
      };

      img.src = rawDataUrl;
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Uploads a room image with automatic client-side compression and fast fallback.
 * Never hangs or stays stuck at 50%.
 */
export async function uploadRoomImage(
  file: File,
  userId: string,
  onProgress?: UploadProgressCallback
): Promise<string> {
  // Validate image type
  const isImageMime = file.type ? file.type.startsWith('image/') : false;
  const isImageExt = /\.(jpe?g|png|webp|heic|heif|gif|bmp)$/i.test(file.name);
  if (!isImageMime && !isImageExt && file.type !== '') {
    throw new Error('Invalid file format. Please select an image (JPG, PNG, WebP) from your phone gallery or camera.');
  }

  // Validate raw file size
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error('Image size must be less than 15 MB.');
  }

  onProgress?.(10);

  // Step 1: Compress and downscale image client-side (~100-200 KB)
  let optimized: { dataUrl: string; blob: Blob };
  try {
    optimized = await compressAndOptimizeImage(file);
    onProgress?.(40);
  } catch (err: any) {
    console.warn('Image optimization error, using original file:', err);
    // If optimization fails, fallback to simple data URL
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        onProgress?.(100);
        resolve(reader.result as string);
      };
      reader.onerror = () => reject(new Error('Failed to read image file.'));
      reader.readAsDataURL(file);
    });
  }

  onProgress?.(55);

  // Step 2: Try uploading the compressed blob to Supabase Storage with strict 3.5s timeout
  if (isSupabaseConfigured && supabase) {
    try {
      const fileExt = 'jpg';
      const fileName = `${userId}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

      onProgress?.(70);

      const uploadPromise = supabase.storage
        .from('room-photos')
        .upload(fileName, optimized.blob, {
          contentType: 'image/jpeg',
          cacheControl: '3600',
          upsert: true,
        });

      // Strict timeout: if Supabase doesn't respond or bucket doesn't exist within 3.5s, don't stall!
      const timeoutPromise = new Promise<{ data: null; error: Error }>((_, reject) => {
        setTimeout(() => reject(new Error('SUPABASE_STORAGE_TIMEOUT')), 3500);
      });

      const { data, error } = await Promise.race([uploadPromise, timeoutPromise]);

      if (error) {
        console.warn('Supabase storage upload failed, falling back to optimized image:', error.message);
      } else if (data) {
        const { data: urlData } = supabase.storage
          .from('room-photos')
          .getPublicUrl(data.path);

        if (urlData?.publicUrl) {
          onProgress?.(100);
          return urlData.publicUrl;
        }
      }
    } catch (err: any) {
      console.warn('Supabase storage unavailable or timed out, using optimized photo:', err?.message || err);
      // Seamlessly proceed to use optimized dataUrl
    }
  }

  // Step 3: Fast finish with compressed image dataUrl
  onProgress?.(90);
  await new Promise((r) => setTimeout(r, 60));
  onProgress?.(100);
  return optimized.dataUrl;
}
