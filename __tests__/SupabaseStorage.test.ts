import { uploadImageToSupabase, deleteImageFromSupabase, getImagePublicUrl } from '../src/services/StorageService';
import { supabaseClient } from '../src/services/supabaseClient';

// Mock Supabase client
jest.mock('../src/services/supabaseClient', () => ({
  supabaseClient: {
    storage: {
      from: jest.fn(),
    },
  },
}));

describe('Supabase Storage Service', () => {
  const mockBucket = 'food-images';
  const mockFilePath = 'user123/img_1234567890_abc.jpg';
  const mockImageUri = 'file:///path/to/image.jpg';
  const mockPublicUrl = 'https://fwoykfbumwsbodrconeo.supabase.co/storage/v1/object/public/food-images/user123/img_1234567890_abc.jpg';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('uploadImageToSupabase', () => {
    it('should upload image successfully', async () => {
      const mockUpload = jest.fn().mockResolvedValue({
        data: { path: mockFilePath },
        error: null,
      });

      const mockFrom = jest.fn().mockReturnValue({
        upload: mockUpload,
      });

      (supabaseClient.storage.from as jest.Mock).mockImplementation(mockFrom);

      // Mock fetch for converting URI to blob
      global.fetch = jest.fn().mockResolvedValue({
        blob: jest.fn().mockResolvedValue(new Blob(['image data'], { type: 'image/jpeg' })),
      }) as jest.Mock;

      const result = await uploadImageToSupabase(mockImageUri, 'user123');

      expect(supabaseClient.storage.from).toHaveBeenCalledWith(mockBucket);
      expect(mockUpload).toHaveBeenCalledWith(
        expect.stringMatching(/^user123\/img_\d+_\w+\.jpg$/),
        expect.any(Blob),
        {
          contentType: 'image/jpeg',
          upsert: true,
        }
      );
      expect(result.success).toBe(true);
      expect(result.path).toMatch(/^user123\/img_\d+_\w+\.jpg$/);
    });

    it('should handle upload errors', async () => {
      const mockError = { message: 'Upload failed' };
      const mockUpload = jest.fn().mockResolvedValue({
        data: null,
        error: mockError,
      });

      const mockFrom = jest.fn().mockReturnValue({
        upload: mockUpload,
      });

      (supabaseClient.storage.from as jest.Mock).mockImplementation(mockFrom);

      global.fetch = jest.fn().mockResolvedValue({
        blob: jest.fn().mockResolvedValue(new Blob(['image data'], { type: 'image/jpeg' })),
      }) as jest.Mock;

      const result = await uploadImageToSupabase(mockImageUri, 'user123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Upload failed');
    });

    it('should handle missing userId', async () => {
      const result = await uploadImageToSupabase(mockImageUri, '');

      expect(result.success).toBe(false);
      expect(result.error).toBe('User ID is required');
      expect(supabaseClient.storage.from).not.toHaveBeenCalled();
    });

    it('should handle blob conversion errors', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Failed to fetch'));

      const result = await uploadImageToSupabase(mockImageUri, 'user123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to convert image to blob');
    });

    it('should generate unique file names', async () => {
      const mockUpload = jest.fn().mockResolvedValue({
        data: { path: mockFilePath },
        error: null,
      });

      const mockFrom = jest.fn().mockReturnValue({
        upload: mockUpload,
      });

      (supabaseClient.storage.from as jest.Mock).mockImplementation(mockFrom);

      global.fetch = jest.fn().mockResolvedValue({
        blob: jest.fn().mockResolvedValue(new Blob(['image data'], { type: 'image/jpeg' })),
      }) as jest.Mock;

      await uploadImageToSupabase(mockImageUri, 'user123');
      await uploadImageToSupabase(mockImageUri, 'user123');

      const firstCall = mockUpload.mock.calls[0][0];
      const secondCall = mockUpload.mock.calls[1][0];

      expect(firstCall).not.toBe(secondCall);
      expect(firstCall).toMatch(/^user123\/img_\d+_\w+\.jpg$/);
      expect(secondCall).toMatch(/^user123\/img_\d+_\w+\.jpg$/);
    });
  });

  describe('getImagePublicUrl', () => {
    it('should return public URL for image', () => {
      const mockGetPublicUrl = jest.fn().mockReturnValue({
        data: { publicUrl: mockPublicUrl },
        error: null,
      });

      const mockFrom = jest.fn().mockReturnValue({
        getPublicUrl: mockGetPublicUrl,
      });

      (supabaseClient.storage.from as jest.Mock).mockImplementation(mockFrom);

      const result = getImagePublicUrl(mockFilePath);

      expect(supabaseClient.storage.from).toHaveBeenCalledWith(mockBucket);
      expect(mockGetPublicUrl).toHaveBeenCalledWith(mockFilePath);
      expect(result).toBe(mockPublicUrl);
    });

    it('should return null if getting public URL fails', () => {
      const mockGetPublicUrl = jest.fn().mockReturnValue({
        data: null,
        error: { message: 'Failed to get URL' },
      });

      const mockFrom = jest.fn().mockReturnValue({
        getPublicUrl: mockGetPublicUrl,
      });

      (supabaseClient.storage.from as jest.Mock).mockImplementation(mockFrom);

      const result = getImagePublicUrl(mockFilePath);

      expect(result).toBeNull();
    });
  });

  describe('deleteImageFromSupabase', () => {
    it('should delete image successfully', async () => {
      const mockRemove = jest.fn().mockResolvedValue({
        data: { message: 'Deleted successfully' },
        error: null,
      });

      const mockFrom = jest.fn().mockReturnValue({
        remove: mockRemove,
      });

      (supabaseClient.storage.from as jest.Mock).mockImplementation(mockFrom);

      const result = await deleteImageFromSupabase(mockFilePath);

      expect(supabaseClient.storage.from).toHaveBeenCalledWith(mockBucket);
      expect(mockRemove).toHaveBeenCalledWith([mockFilePath]);
      expect(result.success).toBe(true);
    });

    it('should handle deletion errors', async () => {
      const mockError = { message: 'Delete failed' };
      const mockRemove = jest.fn().mockResolvedValue({
        data: null,
        error: mockError,
      });

      const mockFrom = jest.fn().mockReturnValue({
        remove: mockRemove,
      });

      (supabaseClient.storage.from as jest.Mock).mockImplementation(mockFrom);

      const result = await deleteImageFromSupabase(mockFilePath);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Delete failed');
    });

    it('should handle empty file path', async () => {
      const result = await deleteImageFromSupabase('');

      expect(result.success).toBe(false);
      expect(result.error).toBe('File path is required');
      expect(supabaseClient.storage.from).not.toHaveBeenCalled();
    });
  });

  describe('Integration with ImageUpload', () => {
    it('should upload compressed image to Supabase', async () => {
      const compressedUri = 'file:///compressed/image.jpg';
      const userId = 'user123';

      const mockUpload = jest.fn().mockResolvedValue({
        data: { path: mockFilePath },
        error: null,
      });

      const mockGetPublicUrl = jest.fn().mockReturnValue({
        data: { publicUrl: mockPublicUrl },
        error: null,
      });

      const mockFrom = jest.fn().mockReturnValue({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
      });

      (supabaseClient.storage.from as jest.Mock).mockImplementation(mockFrom);

      global.fetch = jest.fn().mockResolvedValue({
        blob: jest.fn().mockResolvedValue(new Blob(['compressed image'], { type: 'image/jpeg' })),
      }) as jest.Mock;

      const uploadResult = await uploadImageToSupabase(compressedUri, userId);
      
      expect(uploadResult.success).toBe(true);
      expect(uploadResult.path).toBeDefined();

      // Get public URL
      const publicUrl = getImagePublicUrl(uploadResult.path!);
      expect(publicUrl).toBe(mockPublicUrl);
    });
  });
});