import { InventoryService } from '../src/services/InventoryService';
import { initializeSupabase } from '../src/services/supabaseClient';
import { FoodItem } from '../src/models/FoodItem';

// Set up test environment variables
process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://fwoykfbumwsbodrconeo.supabase.co';
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3b3lrZmJ1bXdzYm9kcmNvbmVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5MTQxMDEsImV4cCI6MjA3MTQ5MDEwMX0.rxwnJK2xqYSqohmaRJq0x5n9RMOGEchF4r7XifqO2h0';

// Initialize Supabase client and InventoryService
const supabase = initializeSupabase();
const inventoryService = new InventoryService(supabase);

describe('InventoryService', () => {
  describe('InventoryService should fetch items successfully', () => {
    it('should initialize with Supabase client', () => {
      // Test that InventoryService can be instantiated with Supabase client
      expect(inventoryService).toBeDefined();
      expect(inventoryService).toBeInstanceOf(InventoryService);
    });

    it('should have getItems method that returns array', async () => {
      // Test that getItems method exists and returns an array
      const result = await inventoryService.getItems('test-user-123');
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should fetch food items with correct structure', async () => {
      // Test that fetched items have correct FoodItem structure
      const items = await inventoryService.getItems('test-user-123');
      
      // Each item should match FoodItem interface
      items.forEach(item => {
        expect(item).toHaveProperty('id');
        expect(item).toHaveProperty('name');
        expect(item).toHaveProperty('quantity');
        expect(item).toHaveProperty('unit');
        expect(item).toHaveProperty('category');
        expect(item).toHaveProperty('addedDate');
        expect(item).toHaveProperty('expiryDate');
        expect(item).toHaveProperty('status');
        expect(item).toHaveProperty('userId');
        expect(item).toHaveProperty('createdAt');
        expect(item).toHaveProperty('updatedAt');
        
        // Test data types
        expect(typeof item.id).toBe('string');
        expect(typeof item.name).toBe('string');
        expect(typeof item.quantity).toBe('number');
        expect(typeof item.unit).toBe('string');
        expect(typeof item.category).toBe('string');
        expect(item.addedDate).toBeInstanceOf(Date);
        expect(item.expiryDate).toBeInstanceOf(Date);
        expect(typeof item.status).toBe('string');
        expect(typeof item.userId).toBe('string');
        expect(item.createdAt).toBeInstanceOf(Date);
        expect(item.updatedAt).toBeInstanceOf(Date);
      });
    });

    it('should fetch items filtered by user ID', async () => {
      // Test that items are filtered by the provided user ID
      const userId = 'test-user-123';
      const items = await inventoryService.getItems(userId);
      
      // All returned items should belong to the specified user
      items.forEach(item => {
        expect(item.userId).toBe(userId);
      });
    });

    it('should fetch items by status filter', async () => {
      // Test that service can filter items by status
      const freshItems = await inventoryService.getItemsByStatus('test-user-123', 'fresh');
      
      expect(Array.isArray(freshItems)).toBe(true);
      freshItems.forEach(item => {
        expect(item.status).toBe('fresh');
        expect(item.userId).toBe('test-user-123');
      });
    });

    it('should fetch items by category filter', async () => {
      // Test that service can filter items by category
      const fruitItems = await inventoryService.getItemsByCategory('test-user-123', 'fruits');
      
      expect(Array.isArray(fruitItems)).toBe(true);
      fruitItems.forEach(item => {
        expect(item.category).toBe('fruits');
        expect(item.userId).toBe('test-user-123');
      });
    });

    it('should handle empty results gracefully', async () => {
      // Test behavior when no items match the criteria
      const items = await inventoryService.getItems('nonexistent-user-999');
      
      expect(Array.isArray(items)).toBe(true);
      expect(items.length).toBe(0);
    });

    it('should provide getItemById method', async () => {
      // Test that individual items can be fetched by ID
      const testId = 'test-uuid-123';
      const item = await inventoryService.getItemById(testId);
      
      if (item) {
        // If item exists, should have correct structure
        expect(item).toHaveProperty('id');
        expect(item.id).toBe(testId);
        expect(typeof item.name).toBe('string');
        expect(typeof item.quantity).toBe('number');
      } else {
        // If item doesn't exist, should return null
        expect(item).toBeNull();
      }
    });

    it('should provide search functionality', async () => {
      // Test that items can be searched by name
      const searchResults = await inventoryService.searchItems('test-user-123', 'apple');
      
      expect(Array.isArray(searchResults)).toBe(true);
      searchResults.forEach(item => {
        expect(item.name.toLowerCase()).toContain('apple');
        expect(item.userId).toBe('test-user-123');
      });
    });

    it('should sort items by expiry date', async () => {
      // Test that items can be sorted by expiry date (soonest first)
      const sortedItems = await inventoryService.getItemsSortedByExpiry('test-user-123');
      
      expect(Array.isArray(sortedItems)).toBe(true);
      
      // Verify items are sorted by expiry date (ascending)
      for (let i = 1; i < sortedItems.length; i++) {
        const currentExpiry = new Date(sortedItems[i].expiryDate).getTime();
        const previousExpiry = new Date(sortedItems[i - 1].expiryDate).getTime();
        expect(currentExpiry).toBeGreaterThanOrEqual(previousExpiry);
      }
    });
  });

  describe('InventoryService should handle fetch errors', () => {
    it('should handle database connection errors gracefully', async () => {
      // Test behavior when database is unavailable or connection fails
      const mockSupabase = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockRejectedValue(new Error('Connection failed'))
            })
          })
        })
      };

      const errorService = new InventoryService(mockSupabase as any);
      const result = await errorService.getItems('test-user');
      
      // Should return empty array on connection error
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it('should handle invalid user ID format gracefully', async () => {
      // Test with invalid UUID format
      const invalidUserId = 'invalid-uuid-format';
      const result = await inventoryService.getItems(invalidUserId);
      
      // Should return empty array for invalid user ID
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it('should handle network timeout errors', async () => {
      // Simulate network timeout
      const mockSupabase = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockRejectedValue(new Error('Network timeout'))
            })
          })
        })
      };

      const timeoutService = new InventoryService(mockSupabase as any);
      const result = await timeoutService.getItems('test-user');
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it('should handle malformed database response', async () => {
      // Test with corrupted/malformed data from database
      const mockSupabase = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: [
                  { id: null, name: null }, // Invalid data
                  { invalid: 'structure' }, // Missing required fields
                  null // Null item
                ],
                error: null
              })
            })
          })
        })
      };

      const malformedService = new InventoryService(mockSupabase as any);
      const result = await malformedService.getItems('test-user');
      
      // Should handle malformed data gracefully
      expect(Array.isArray(result)).toBe(true);
      // Service should filter out invalid items or handle them gracefully
    });

    it('should handle database permission errors', async () => {
      // Test unauthorized access to database
      const mockSupabase = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: null,
                error: { 
                  code: '42501', 
                  message: 'permission denied for table food_items' 
                }
              })
            })
          })
        })
      };

      const permissionService = new InventoryService(mockSupabase as any);
      const result = await permissionService.getItems('test-user');
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it('should handle table not found errors', async () => {
      // Test when table doesn't exist
      const mockSupabase = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: null,
                error: { 
                  code: 'PGRST205', 
                  message: "Could not find the table 'food_items' in the schema cache" 
                }
              })
            })
          })
        })
      };

      const noTableService = new InventoryService(mockSupabase as any);
      const result = await noTableService.getItems('test-user');
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it('should handle getItemById errors for invalid IDs', async () => {
      // Test getItemById with invalid UUID
      const result = await inventoryService.getItemById('invalid-uuid');
      
      expect(result).toBeNull();
    });

    it('should handle search errors with special characters', async () => {
      // Test search with SQL injection attempts or special characters
      const maliciousSearch = "'; DROP TABLE food_items; --";
      const result = await inventoryService.searchItems('test-user', maliciousSearch);
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it('should handle category filter errors with invalid category', async () => {
      // Test with invalid category that doesn't exist in enum
      const result = await inventoryService.getItemsByCategory('test-user', 'invalid-category' as any);
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it('should handle status filter errors with invalid status', async () => {
      // Test with invalid status that doesn't exist in enum
      const result = await inventoryService.getItemsByStatus('test-user', 'invalid-status' as any);
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it('should provide error logging for debugging', async () => {
      // Test that errors are properly logged for debugging
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Trigger an error to test logging
      await inventoryService.getItems('invalid-format-user-id');
      
      // Should have logged the error
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    it('should handle concurrent request errors gracefully', async () => {
      // Test multiple simultaneous requests
      const userId = 'concurrent-test-user';
      const promises = [
        inventoryService.getItems(userId),
        inventoryService.getItemsByStatus(userId, 'fresh'),
        inventoryService.getItemsByCategory(userId, 'fruits'),
        inventoryService.searchItems(userId, 'test')
      ];
      
      const results = await Promise.all(promises);
      
      // All requests should complete without throwing errors
      results.forEach(result => {
        expect(Array.isArray(result)).toBe(true);
      });
    });

    it('should handle very large dataset queries without memory issues', async () => {
      // Test service behavior with potentially large datasets
      const result = await inventoryService.getItems('user-with-many-items');
      
      // Should not throw memory errors and return valid array
      expect(Array.isArray(result)).toBe(true);
      expect(typeof result.length).toBe('number');
    });
  });
});