import { supabase, isSupabaseConfigured } from './supabase';
import { useToastStore } from '../stores/toastStore';

export interface UploadResult {
  url: string | null;
  thumbnailUrl: string | null;
  error: string | null;
}

// Maximum file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Allowed image types
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Validate image file
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: '仅支持 JPG、PNG、WebP 格式的图片' };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: '图片大小不能超过 10MB' };
  }

  return { valid: true };
}

/**
 * Generate thumbnail from file
 */
export function generateThumbnail(file: File, maxWidth: number = 800): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = URL.createObjectURL(file);
  });
}

/**
 * Upload image to Supabase Storage
 */
export async function uploadImage(
  file: File,
  userId: string,
  type: 'photo' | 'avatar' = 'photo'
): Promise<UploadResult> {
  const { addToast } = useToastStore.getState();

  // Check Supabase configuration
  if (!isSupabaseConfigured) {
    // Demo mode - return mock URL
    console.log('Demo mode: Simulating image upload');
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    const mockUrl = URL.createObjectURL(file);
    return {
      url: mockUrl,
      thumbnailUrl: mockUrl,
      error: null,
    };
  }

  // Validate file
  const validation = validateImageFile(file);
  if (!validation.valid) {
    const errorMsg = validation.error || 'Invalid file';
    addToast(errorMsg, 'error');
    return { url: null, thumbnailUrl: null, error: errorMsg };
  }

  try {
    // Generate thumbnail
    const thumbnailDataUrl = await generateThumbnail(file, 800);

    // Upload original image
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const folder = type === 'avatar' ? 'avatars' : 'originals';
    const filePath = `${userId}/${folder}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('photos')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    // Get public URL for original
    const { data: urlData } = supabase.storage
      .from('photos')
      .getPublicUrl(filePath);

    // Upload thumbnail
    const thumbnailFileName = `thumb_${fileName}`;
    const thumbnailPath = `${userId}/thumbnails/${thumbnailFileName}`;
    
    // Convert data URL to blob
    const thumbnailBlob = await fetch(thumbnailDataUrl).then((r) => r.blob());
    
    const { error: thumbnailError } = await supabase.storage
      .from('photos')
      .upload(thumbnailPath, thumbnailBlob, {
        cacheControl: '3600',
        upsert: false,
        contentType: 'image/jpeg',
      });

    if (thumbnailError) {
      console.error('Thumbnail upload error:', thumbnailError);
    }

    const { data: thumbnailUrlData } = supabase.storage
      .from('photos')
      .getPublicUrl(thumbnailPath);

    return {
      url: urlData.publicUrl,
      thumbnailUrl: thumbnailUrlData.publicUrl,
      error: null,
    };
  } catch (error) {
    console.error('Upload error:', error);
    const errorMessage = error instanceof Error ? error.message : '上传失败，请重试';
    addToast(errorMessage, 'error');
    return { url: null, thumbnailUrl: null, error: errorMessage };
  }
}

/**
 * Delete image from Supabase Storage
 */
export async function deleteImage(path: string): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured) {
    return { error: null };
  }

  try {
    const { error } = await supabase.storage.from('photos').remove([path]);
    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error: error instanceof Error ? error.message : '删除失败' };
  }
}
