import { supabaseClient } from './supabaseClient';
import { generateImageFileName } from '../utils/imageUtils';

const BUCKET_NAME = 'food-images';

export interface UploadResult {
  success: boolean;
  path?: string;
  publicUrl?: string;
  error?: string;
}

export interface DeleteResult {
  success: boolean;
  error?: string;
}

/**
 * Convert image URI to Blob for upload
 */
async function uriToBlob(uri: string): Promise<Blob> {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    return blob;
  } catch (error) {
    console.error('Failed to convert URI to blob:', error);
    throw new Error('Failed to convert image to blob');
  }
}

/**
 * Upload an image to Supabase Storage
 */
export async function uploadImageToSupabase(
  imageUri: string,
  userId: string
): Promise<UploadResult> {
  try {
    // Validate inputs
    if (!userId) {
      return {
        success: false,
        error: 'User ID is required',
      };
    }

    // Convert URI to blob
    let blob: Blob;
    try {
      blob = await uriToBlob(imageUri);
    } catch (error) {
      return {
        success: false,
        error: 'Failed to convert image to blob',
      };
    }

    // Generate unique file name
    const fileName = generateImageFileName('img');
    const filePath = `${userId}/${fileName}`;

    // Upload to Supabase Storage
    const { data, error } = await supabaseClient.storage
      .from(BUCKET_NAME)
      .upload(filePath, blob, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (error) {
      console.error('Supabase upload error:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    // Get public URL
    const publicUrl = getImagePublicUrl(filePath);

    return {
      success: true,
      path: filePath,
      publicUrl: publicUrl || undefined,
    };
  } catch (error) {
    console.error('Upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}

/**
 * Get public URL for an image in Supabase Storage
 */
export function getImagePublicUrl(filePath: string): string | null {
  try {
    const { data, error } = supabaseClient.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    if (error || !data) {
      console.error('Failed to get public URL:', error);
      return null;
    }

    return data.publicUrl;
  } catch (error) {
    console.error('Error getting public URL:', error);
    return null;
  }
}

/**
 * Delete an image from Supabase Storage
 */
export async function deleteImageFromSupabase(
  filePath: string
): Promise<DeleteResult> {
  try {
    // Validate input
    if (!filePath) {
      return {
        success: false,
        error: 'File path is required',
      };
    }

    const { data, error } = await supabaseClient.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      console.error('Supabase delete error:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error('Delete error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Delete failed',
    };
  }
}

/**
 * Upload multiple images to Supabase Storage
 */
export async function uploadMultipleImages(
  imageUris: string[],
  userId: string
): Promise<UploadResult[]> {
  const uploadPromises = imageUris.map(uri => 
    uploadImageToSupabase(uri, userId)
  );

  return await Promise.all(uploadPromises);
}

/**
 * Create the storage bucket if it doesn't exist
 * This should be called during app initialization
 */
export async function initializeStorageBucket(): Promise<void> {
  try {
    const { data: buckets, error: listError } = await supabaseClient.storage.listBuckets();

    if (listError) {
      console.error('Error listing buckets:', listError);
      return;
    }

    const bucketExists = buckets?.some(bucket => bucket.name === BUCKET_NAME);

    if (!bucketExists) {
      const { data, error: createError } = await supabaseClient.storage.createBucket(
        BUCKET_NAME,
        {
          public: true,
          fileSizeLimit: 5242880, // 5MB
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/jpg'],
        }
      );

      if (createError) {
        console.error('Error creating bucket:', createError);
      } else {
        console.log('Storage bucket created successfully');
      }
    }
  } catch (error) {
    console.error('Error initializing storage bucket:', error);
  }
}