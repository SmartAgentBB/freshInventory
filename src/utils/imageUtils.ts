import * as ImageManipulator from 'expo-image-manipulator';
import { Image } from 'react-native';

export interface CompressionOptions {
  quality?: number;
  maxWidth?: number;
  format?: 'jpeg' | 'png';
  returnBase64?: boolean;
}

export interface CompressionResult {
  uri: string;
  width?: number;
  height?: number;
  base64?: string;
  error?: string;
}

export async function compressImage(
  imageUri: string,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const {
    quality = 0.7,
    maxWidth = 1024,
    format = 'jpeg',
    returnBase64 = false,
  } = options;

  try {
    // First, get the original image dimensions
    const { Image } = require('react-native');
    const originalInfo = await new Promise<{ width: number; height: number }>((resolve, reject) => {
      Image.getSize(
        imageUri,
        (width, height) => resolve({ width, height }),
        reject
      );
    });
    
    console.log('Original image size:', originalInfo.width, 'x', originalInfo.height);
    
    // Only resize if image is larger than maxWidth
    const actions: ImageManipulator.Action[] = [];
    if (originalInfo.width > maxWidth) {
      console.log(`Resizing image from ${originalInfo.width}px to ${maxWidth}px width`);
      actions.push({ resize: { width: maxWidth } });
    } else {
      console.log('Image is smaller than maxWidth, not resizing');
    }

    const result = await ImageManipulator.manipulateAsync(
      imageUri,
      actions,
      {
        compress: quality,
        format: format === 'png' 
          ? ImageManipulator.SaveFormat.PNG 
          : ImageManipulator.SaveFormat.JPEG,
        base64: returnBase64,
      }
    );
    
    console.log('Compressed image size:', result.width, 'x', result.height);

    return {
      uri: result.uri,
      width: result.width,
      height: result.height,
      base64: result.base64,
    };
  } catch (error) {
    console.error('Image compression failed:', error);
    // Return original image info if compression fails
    try {
      const { Image } = require('react-native');
      const fallbackInfo = await new Promise<{ width: number; height: number }>((resolve, reject) => {
        Image.getSize(
          imageUri,
          (width, height) => resolve({ width, height }),
          reject
        );
      });
      return {
        uri: imageUri,
        width: fallbackInfo.width,
        height: fallbackInfo.height,
        error: error instanceof Error ? error.message : 'Compression failed',
      };
    } catch (fallbackError) {
      return {
        uri: imageUri,
        error: error instanceof Error ? error.message : 'Compression failed',
      };
    }
  }
}

export function getImageSizeInMB(base64String: string): number {
  // Calculate size in MB from base64 string
  const sizeInBytes = (base64String.length * 3) / 4;
  const sizeInMB = sizeInBytes / (1024 * 1024);
  return Math.round(sizeInMB * 100) / 100; // Round to 2 decimal places
}

export function generateImageFileName(prefix: string = 'img'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  return `${prefix}_${timestamp}_${random}.jpg`;
}

// BoundingBox is now represented as [ymin, xmin, ymax, xmax] normalized to 0-1000
export type BoundingBox = number[];

export async function cropImageToBoundingBox(
  imageUri: string,
  boundingBox: BoundingBox,
  targetSize: number = 100,
  imageDimensions?: { width: number; height: number }
): Promise<string | null> {
  try {
    // Validate boundingBox format
    if (!Array.isArray(boundingBox) || boundingBox.length !== 4) {
      console.error('Invalid boundingBox format:', boundingBox);
      return null;
    }

    // Get image dimensions - use provided dimensions or fetch them
    let imgWidth: number;
    let imgHeight: number;
    
    if (imageDimensions) {
      imgWidth = imageDimensions.width;
      imgHeight = imageDimensions.height;
      console.log('Using provided image dimensions:', imgWidth, 'x', imgHeight);
    } else {
      const imageInfo = await new Promise<{ width: number; height: number }>((resolve, reject) => {
        Image.getSize(
          imageUri,
          (width, height) => resolve({ width, height }),
          reject
        );
      });
      imgWidth = imageInfo.width;
      imgHeight = imageInfo.height;
      console.log('Fetched image dimensions:', imgWidth, 'x', imgHeight);
    }
    
    console.log('=== Crop Thumbnail Generation (Python-style) ===');
    console.log('Image dimensions:', imgWidth, 'x', imgHeight);
    console.log('BoundingBox [ymin, xmin, ymax, xmax] (0-1000):', boundingBox);
    
    // Convert from [ymin, xmin, ymax, xmax] normalized to 0-1000 to pixel coordinates
    // Following the Python example exactly
    const [ymin, xmin, ymax, xmax] = boundingBox;
    
    const abs_y1 = Math.floor((ymin / 1000) * imgHeight);
    const abs_x1 = Math.floor((xmin / 1000) * imgWidth);
    const abs_y2 = Math.floor((ymax / 1000) * imgHeight);
    const abs_x2 = Math.floor((xmax / 1000) * imgWidth);
    
    console.log('Converted to pixels [x1, y1, x2, y2]:', [abs_x1, abs_y1, abs_x2, abs_y2]);
    
    // Calculate the bounding box dimensions
    const boxWidth = abs_x2 - abs_x1;
    const boxHeight = abs_y2 - abs_y1;
    
    // Calculate center point
    const centerX = abs_x1 + boxWidth / 2;
    const centerY = abs_y1 + boxHeight / 2;
    
    console.log('Box dimensions (w x h):', boxWidth, 'x', boxHeight);
    console.log('Center point:', { centerX, centerY });
    
    // Create square crop with slight padding to ensure full visibility
    const cropSize = Math.max(boxWidth, boxHeight) * 1.1; // 10% padding for safety
    
    // Calculate crop area centered on the bounding box
    let cropX = centerX - cropSize / 2;
    let cropY = centerY - cropSize / 2;
    
    // Ensure crop stays within image bounds
    cropX = Math.max(0, Math.min(cropX, imgWidth - cropSize));
    cropY = Math.max(0, Math.min(cropY, imgHeight - cropSize));
    
    // Adjust crop size if it exceeds image bounds
    const finalCropSize = Math.min(cropSize, imgWidth - cropX, imgHeight - cropY);
    
    console.log('Final crop area:', { 
      cropX: Math.floor(cropX), 
      cropY: Math.floor(cropY), 
      size: Math.floor(finalCropSize) 
    });
    console.log('================================================');

    // Crop the image
    const actions: ImageManipulator.Action[] = [
      {
        crop: {
          originX: Math.floor(cropX),
          originY: Math.floor(cropY),
          width: Math.floor(finalCropSize),
          height: Math.floor(finalCropSize),
        }
      },
      {
        resize: {
          width: targetSize,
          height: targetSize,
        }
      }
    ];

    const result = await ImageManipulator.manipulateAsync(
      imageUri,
      actions,
      {
        compress: 0.85, // Increased quality for better detail
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );

    return result.uri;
  } catch (error) {
    console.error('Failed to crop image:', error);
    return null;
  }
}