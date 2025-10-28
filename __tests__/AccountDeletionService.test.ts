import { AccountDeletionService } from '../src/services/AccountDeletionService';
import { supabaseClient } from '../src/services/supabaseClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mocks
jest.mock('../src/services/supabaseClient');
jest.mock('@react-native-async-storage/async-storage');

describe('AccountDeletionService', () => {
  let service: AccountDeletionService;
  const mockUserId = 'test-user-123';
  const mockUserEmail = 'test@example.com';

  beforeEach(() => {
    service = new AccountDeletionService();
    jest.clearAllMocks();
  });

  describe('deleteAccount', () => {
    it('should successfully delete user data and sign out', async () => {
      // Mock successful data deletion
      const mockFrom = jest.fn().mockReturnThis();
      const mockDelete = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnValue({ error: null });

      (supabaseClient as any).from = mockFrom;
      mockFrom.mockReturnValue({
        delete: mockDelete,
      });
      mockDelete.mockReturnValue({
        eq: mockEq,
      });

      // Mock successful sign out
      (supabaseClient as any).auth = {
        signOut: jest.fn().mockResolvedValue({ error: null }),
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: mockUserId, email: mockUserEmail } },
        }),
      };

      // Mock AsyncStorage
      (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);
      (AsyncStorage.getAllKeys as jest.Mock).mockResolvedValue([
        `@ez2cook_settings_${mockUserId}`,
        `@ez2cook_notifications_${mockUserId}`,
      ]);
      (AsyncStorage.multiRemove as jest.Mock).mockResolvedValue(undefined);

      const result = await service.deleteAccount(mockUserId, mockUserEmail);

      // Verify result
      expect(result.success).toBe(true);

      // Verify shopping_items deletion
      expect(mockFrom).toHaveBeenCalledWith('shopping_items');
      expect(mockDelete).toHaveBeenCalled();
      expect(mockEq).toHaveBeenCalledWith('user_id', mockUserId);

      // Verify recipes deletion
      expect(mockFrom).toHaveBeenCalledWith('recipes');

      // Verify sign out was called
      expect(supabaseClient.auth.signOut).toHaveBeenCalled();

      // Verify AsyncStorage cleanup
      expect(AsyncStorage.getAllKeys).toHaveBeenCalled();
      expect(AsyncStorage.multiRemove).toHaveBeenCalled();
    });

    it('should handle data deletion errors gracefully', async () => {
      // Mock failed data deletion
      const mockFrom = jest.fn().mockReturnThis();
      const mockDelete = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnValue({
        error: { message: 'Database error' },
      });

      (supabaseClient as any).from = mockFrom;
      mockFrom.mockReturnValue({
        delete: mockDelete,
      });
      mockDelete.mockReturnValue({
        eq: mockEq,
      });

      const result = await service.deleteAccount(mockUserId, mockUserEmail);

      // Verify error handling
      expect(result.success).toBe(false);
      expect(result.error).toContain('장보기 목록 삭제 중 오류가 발생했습니다');
    });

    it('should continue even if AsyncStorage cleanup fails', async () => {
      // Mock successful data deletion
      const mockFrom = jest.fn().mockReturnThis();
      const mockDelete = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnValue({ error: null });

      (supabaseClient as any).from = mockFrom;
      mockFrom.mockReturnValue({
        delete: mockDelete,
      });
      mockDelete.mockReturnValue({
        eq: mockEq,
      });

      // Mock successful sign out
      (supabaseClient as any).auth = {
        signOut: jest.fn().mockResolvedValue({ error: null }),
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: mockUserId, email: mockUserEmail } },
        }),
      };

      // Mock AsyncStorage error
      (AsyncStorage.getAllKeys as jest.Mock).mockRejectedValue(
        new Error('AsyncStorage error')
      );

      const result = await service.deleteAccount(mockUserId, mockUserEmail);

      // Should still succeed despite AsyncStorage error
      expect(result.success).toBe(true);
    });
  });

  describe('verifyEmail', () => {
    it('should return true when email matches', async () => {
      (supabaseClient as any).auth = {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { email: mockUserEmail } },
        }),
      };

      const result = await service.verifyEmail(mockUserEmail);

      expect(result).toBe(true);
    });

    it('should return true for case-insensitive match', async () => {
      (supabaseClient as any).auth = {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { email: mockUserEmail } },
        }),
      };

      const result = await service.verifyEmail('TEST@EXAMPLE.COM');

      expect(result).toBe(true);
    });

    it('should return false when email does not match', async () => {
      (supabaseClient as any).auth = {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { email: mockUserEmail } },
        }),
      };

      const result = await service.verifyEmail('different@example.com');

      expect(result).toBe(false);
    });

    it('should handle errors and return false', async () => {
      (supabaseClient as any).auth = {
        getUser: jest.fn().mockRejectedValue(new Error('Auth error')),
      };

      const result = await service.verifyEmail(mockUserEmail);

      expect(result).toBe(false);
    });
  });
});