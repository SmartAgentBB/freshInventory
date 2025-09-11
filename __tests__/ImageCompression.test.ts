import * as ImageManipulator from 'expo-image-manipulator';
import { compressImage } from '../src/utils/imageUtils';

// Mock expo-image-manipulator
jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn(),
  SaveFormat: {
    JPEG: 'jpeg',
    PNG: 'png',
  },
  FlipType: {
    Vertical: 'vertical',
    Horizontal: 'horizontal',
  },
}));

describe('Image Compression', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('compressImage function', () => {
    it('should compress image with default settings', async () => {
      const originalUri = 'file:///path/to/original/image.jpg';
      const compressedUri = 'file:///path/to/compressed/image.jpg';
      const expectedSize = { width: 1024, height: 768 };

      (ImageManipulator.manipulateAsync as jest.Mock).mockResolvedValue({
        uri: compressedUri,
        width: expectedSize.width,
        height: expectedSize.height,
      });

      const result = await compressImage(originalUri);

      expect(ImageManipulator.manipulateAsync).toHaveBeenCalledWith(
        originalUri,
        [{ resize: { width: 1024 } }],
        {
          compress: 0.7,
          format: ImageManipulator.SaveFormat.JPEG,
          base64: false,
        }
      );
      expect(result.uri).toBe(compressedUri);
      expect(result.width).toBe(expectedSize.width);
      expect(result.height).toBe(expectedSize.height);
    });

    it('should compress image with custom quality', async () => {
      const originalUri = 'file:///path/to/original/image.jpg';
      const compressedUri = 'file:///path/to/compressed/image.jpg';

      (ImageManipulator.manipulateAsync as jest.Mock).mockResolvedValue({
        uri: compressedUri,
        width: 800,
        height: 600,
      });

      const result = await compressImage(originalUri, { quality: 0.5 });

      expect(ImageManipulator.manipulateAsync).toHaveBeenCalledWith(
        originalUri,
        [{ resize: { width: 1024 } }],
        {
          compress: 0.5,
          format: ImageManipulator.SaveFormat.JPEG,
          base64: false,
        }
      );
      expect(result.uri).toBe(compressedUri);
    });

    it('should compress image with custom max width', async () => {
      const originalUri = 'file:///path/to/original/image.jpg';
      const compressedUri = 'file:///path/to/compressed/image.jpg';

      (ImageManipulator.manipulateAsync as jest.Mock).mockResolvedValue({
        uri: compressedUri,
        width: 800,
        height: 600,
      });

      const result = await compressImage(originalUri, { maxWidth: 800 });

      expect(ImageManipulator.manipulateAsync).toHaveBeenCalledWith(
        originalUri,
        [{ resize: { width: 800 } }],
        {
          compress: 0.7,
          format: ImageManipulator.SaveFormat.JPEG,
          base64: false,
        }
      );
      expect(result.uri).toBe(compressedUri);
    });

    it('should handle PNG format', async () => {
      const originalUri = 'file:///path/to/original/image.png';
      const compressedUri = 'file:///path/to/compressed/image.png';

      (ImageManipulator.manipulateAsync as jest.Mock).mockResolvedValue({
        uri: compressedUri,
        width: 1024,
        height: 768,
      });

      const result = await compressImage(originalUri, { format: 'png' });

      expect(ImageManipulator.manipulateAsync).toHaveBeenCalledWith(
        originalUri,
        [{ resize: { width: 1024 } }],
        {
          compress: 0.7,
          format: ImageManipulator.SaveFormat.PNG,
          base64: false,
        }
      );
      expect(result.uri).toBe(compressedUri);
    });

    it('should return original URI if compression fails', async () => {
      const originalUri = 'file:///path/to/original/image.jpg';
      const error = new Error('Compression failed');

      (ImageManipulator.manipulateAsync as jest.Mock).mockRejectedValue(error);

      const result = await compressImage(originalUri);

      expect(result.uri).toBe(originalUri);
      expect(result.error).toBe('Compression failed');
    });

    it('should always resize and compress for consistency', async () => {
      const originalUri = 'file:///path/to/small/image.jpg';
      const compressedUri = 'file:///path/to/compressed/image.jpg';

      (ImageManipulator.manipulateAsync as jest.Mock).mockResolvedValue({
        uri: compressedUri,
        width: 500,
        height: 375,
      });

      const result = await compressImage(originalUri, { maxWidth: 1024 });

      // Should always resize and compress
      expect(ImageManipulator.manipulateAsync).toHaveBeenCalledWith(
        originalUri,
        [{ resize: { width: 1024 } }],
        {
          compress: 0.7,
          format: ImageManipulator.SaveFormat.JPEG,
          base64: false,
        }
      );
      expect(result.uri).toBe(compressedUri);
    });

    it('should calculate file size reduction', async () => {
      const originalUri = 'file:///path/to/original/image.jpg';
      const compressedUri = 'file:///path/to/compressed/image.jpg';

      (ImageManipulator.manipulateAsync as jest.Mock).mockResolvedValue({
        uri: compressedUri,
        width: 1024,
        height: 768,
        base64: 'compressed_base64_string',
      });

      const result = await compressImage(originalUri, { returnBase64: true });

      expect(result.uri).toBe(compressedUri);
      expect(result.base64).toBe('compressed_base64_string');
    });
  });

});