import { supabaseClient } from './supabaseClient';
import { generateImageFileName } from '../utils/imageUtils';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';

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
 * Convert image URI to base64 string for upload
 */
async function uriToBase64(uri: string): Promise<string> {
  try {
    // Check if uri is already a base64 string
    if (uri.startsWith('data:image')) {
      // Extract base64 from data URI
      const base64 = uri.split(',')[1];
      return base64;
    }

    // Try fetch API first (works for blob URLs and many local URIs)
    try {
      const response = await fetch(uri);
      const blob = await response.blob();

      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.result && typeof reader.result === 'string') {
            // Remove the data:image/...;base64, prefix
            const base64 = reader.result.split(',')[1];
            resolve(base64);
          } else {
            reject(new Error('Failed to read blob as base64'));
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (fetchError) {
      // Fallback to FileSystem for file:// URIs
      console.log('Fetch failed, trying FileSystem:', fetchError);

      try {
        const base64 = await FileSystem.readAsStringAsync(uri, {
          encoding: 'base64' as any,
        });
        return base64;
      } catch (fsError) {
        console.error('FileSystem also failed:', fsError);
        throw fsError;
      }
    }
  } catch (error) {
    console.error('Failed to convert URI to base64:', error);
    throw new Error('Failed to convert image to base64');
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

    // Convert URI to base64
    let base64: string;
    try {
      base64 = await uriToBase64(imageUri);
    } catch (error) {
      console.error('Base64 conversion error:', error);
      return {
        success: false,
        error: 'Failed to convert image to base64',
      };
    }

    // Generate unique file name
    const fileName = generateImageFileName('img');
    const filePath = `${userId}/${fileName}`;

    // Convert base64 to ArrayBuffer for upload
    const arrayBuffer = decode(base64);

    // Upload to Supabase Storage
    const { data, error } = await supabaseClient.storage
      .from(BUCKET_NAME)
      .upload(filePath, arrayBuffer, {
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

    // Check if user is authenticated before attempting delete
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
      console.warn('No active session - skipping image deletion');
      return {
        success: false,
        error: 'No active session',
      };
    }

    const { data, error } = await supabaseClient.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      // Don't log JSON parse errors as they're usually HTML responses from auth failures
      if (error.message && !error.message.includes('JSON Parse error')) {
        console.error('Supabase delete error:', error);
      }
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