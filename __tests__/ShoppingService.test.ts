import { ShoppingService } from '../src/services/ShoppingService';
import { initializeSupabase } from '../src/services/supabaseClient';
import { ShoppingItem } from '../src/models/ShoppingItem';

// Set up test environment variables
process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://fwoykfbumwsbodrconeo.supabase.co';
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3b3lrZmJ1bXdzYm9kcmNvbmVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5MTQxMDEsImV4cCI6MjA3MTQ5MDEwMX0.rxwnJK2xqYSqohmaRJq0x5n9RMOGEchF4r7XifqO2h0';

// Initialize Supabase client and ShoppingService
const supabase = initializeSupabase();
const shoppingService = new ShoppingService(supabase);

describe('ShoppingService', () => {
  describe('ShoppingService should fetch items successfully', () => {
    it('should initialize with Supabase client', () => {
      // Test that ShoppingService can be instantiated with Supabase client
      expect(shoppingService).toBeDefined();
      expect(shoppingService).toBeInstanceOf(ShoppingService);
    });

    it('should have getTodoItems method that returns array', async () => {
      // Test that getTodoItems method exists and returns an array
      const result = await shoppingService.getTodoItems('test-user-123');
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should fetch shopping items with correct structure', async () => {
      // Test that fetched items have correct ShoppingItem structure
      const items = await shoppingService.getTodoItems('test-user-123');
      
      // Each item should match ShoppingItem interface
      items.forEach(item => {
        expect(item).toHaveProperty('id');
        expect(item).toHaveProperty('name');
        expect(item).toHaveProperty('quantity');
        expect(item).toHaveProperty('unit');
        expect(item).toHaveProperty('category');
        expect(item).toHaveProperty('priority');
        expect(item).toHaveProperty('todo');
        expect(item).toHaveProperty('userId');
        expect(item).toHaveProperty('createdAt');
        expect(item).toHaveProperty('updatedAt');
        expect(item).toHaveProperty('completedAt');
        
        // Test data types
        expect(typeof item.id).toBe('string');
        expect(typeof item.name).toBe('string');
        expect(typeof item.quantity).toBe('number');
        expect(typeof item.unit).toBe('string');
        expect(typeof item.category).toBe('string');
        expect(typeof item.priority).toBe('string');
        expect(typeof item.todo).toBe('boolean');
        expect(typeof item.userId).toBe('string');
        expect(item.createdAt).toBeInstanceOf(Date);
        expect(item.updatedAt).toBeInstanceOf(Date);
        // completedAt can be Date or null
        if (item.completedAt !== null) {
          expect(item.completedAt).toBeInstanceOf(Date);
        }
      });
    });

    it('should fetch items filtered by user ID', async () => {
      // Test that items are filtered by the provided user ID
      const userId = 'test-user-123';
      const items = await shoppingService.getTodoItems(userId);
      
      // All returned items should belong to the specified user
      items.forEach(item => {
        expect(item.userId).toBe(userId);
      });
    });

    it('should fetch todo items only (todo=true)', async () => {
      // Test that getTodoItems returns only incomplete items
      const todoItems = await shoppingService.getTodoItems('test-user-123');
      
      todoItems.forEach(item => {
        expect(item.todo).toBe(true);
        expect(item.completedAt).toBeNull();
      });
    });

    it('should fetch completed items only (todo=false)', async () => {
      // Test that getCompletedItems returns only completed items
      const completedItems = await shoppingService.getCompletedItems('test-user-123');
      
      expect(Array.isArray(completedItems)).toBe(true);
      completedItems.forEach(item => {
        expect(item.todo).toBe(false);
        expect(item.completedAt).toBeInstanceOf(Date);
      });
    });

    it('should fetch items by priority filter', async () => {
      // Test that service can filter items by priority
      const urgentItems = await shoppingService.getItemsByPriority('test-user-123', 'urgent');
      
      expect(Array.isArray(urgentItems)).toBe(true);
      urgentItems.forEach(item => {
        expect(item.priority).toBe('urgent');
        expect(item.userId).toBe('test-user-123');
      });
    });

    it('should fetch items by category filter', async () => {
      // Test that service can filter items by category
      const groceryItems = await shoppingService.getItemsByCategory('test-user-123', 'dairy');
      
      expect(Array.isArray(groceryItems)).toBe(true);
      groceryItems.forEach(item => {
        expect(item.category).toBe('dairy');
        expect(item.userId).toBe('test-user-123');
      });
    });

    it('should handle empty results gracefully', async () => {
      // Test behavior when no items match the criteria
      const items = await shoppingService.getTodoItems('nonexistent-user-999');
      
      expect(Array.isArray(items)).toBe(true);
      expect(items.length).toBe(0);
    });

    it('should provide getItemById method', async () => {
      // Test that individual items can be fetched by ID
      const testId = 'test-shopping-uuid-123';
      const item = await shoppingService.getItemById(testId);
      
      if (item) {
        // If item exists, should have correct structure
        expect(item).toHaveProperty('id');
        expect(item.id).toBe(testId);
        expect(typeof item.name).toBe('string');
        expect(typeof item.quantity).toBe('number');
        expect(typeof item.todo).toBe('boolean');
      } else {
        // If item doesn't exist, should return null
        expect(item).toBeNull();
      }
    });

    it('should provide search functionality', async () => {
      // Test that items can be searched by name
      const searchResults = await shoppingService.searchItems('test-user-123', 'milk');
      
      expect(Array.isArray(searchResults)).toBe(true);
      searchResults.forEach(item => {
        expect(item.name.toLowerCase()).toContain('milk');
        expect(item.userId).toBe('test-user-123');
      });
    });

    it('should sort items by priority (urgent first)', async () => {
      // Test that items can be sorted by priority level
      const sortedItems = await shoppingService.getItemsSortedByPriority('test-user-123');
      
      expect(Array.isArray(sortedItems)).toBe(true);
      
      // Verify items are sorted by priority (urgent > high > normal > low)
      const priorityOrder = ['urgent', 'high', 'normal', 'low'];
      let lastPriorityIndex = -1;
      
      sortedItems.forEach(item => {
        const currentPriorityIndex = priorityOrder.indexOf(item.priority);
        expect(currentPriorityIndex).toBeGreaterThanOrEqual(lastPriorityIndex);
        lastPriorityIndex = currentPriorityIndex;
      });
    });

    it('should provide shopping statistics', async () => {
      // Test that service provides comprehensive shopping statistics
      const stats = await shoppingService.getShoppingStats('test-user-123');
      
      expect(stats).toBeDefined();
      expect(typeof stats.totalItems).toBe('number');
      expect(typeof stats.todoItems).toBe('number');
      expect(typeof stats.completedItems).toBe('number');
      expect(typeof stats.priorityCounts).toBe('object');
      expect(typeof stats.categoryCounts).toBe('object');
      
      // Priority counts should have all priority levels
      expect(stats.priorityCounts).toHaveProperty('urgent');
      expect(stats.priorityCounts).toHaveProperty('high');
      expect(stats.priorityCounts).toHaveProperty('normal');
      expect(stats.priorityCounts).toHaveProperty('low');
      
      // Category counts should be defined
      expect(stats.categoryCounts).toBeDefined();
    });

    it('should handle store filter functionality', async () => {
      // Test filtering by store name
      const storeItems = await shoppingService.getItemsByStore('test-user-123', 'Supermarket');
      
      expect(Array.isArray(storeItems)).toBe(true);
      storeItems.forEach(item => {
        expect(item.store).toBe('Supermarket');
        expect(item.userId).toBe('test-user-123');
      });
    });

    it('should handle recent completions query', async () => {
      // Test getting recently completed items
      const recentItems = await shoppingService.getRecentlyCompleted('test-user-123', 5);
      
      expect(Array.isArray(recentItems)).toBe(true);
      expect(recentItems.length).toBeLessThanOrEqual(5);
      
      // Should be sorted by completion date (most recent first)
      recentItems.forEach((item, index) => {
        expect(item.todo).toBe(false);
        expect(item.completedAt).toBeInstanceOf(Date);
        
        if (index > 0) {
          const currentDate = new Date(item.completedAt!).getTime();
          const previousDate = new Date(recentItems[index - 1].completedAt!).getTime();
          expect(currentDate).toBeLessThanOrEqual(previousDate);
        }
      });
    });
  });

  describe('ShoppingService should handle fetch errors', () => {
    it('should handle database connection errors gracefully', async () => {
      // Test behavior when database is unavailable or connection fails
      const mockSupabase = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockRejectedValue(new Error('Connection failed'))
              })
            })
          })
        })
      };

      const errorService = new ShoppingService(mockSupabase as any);
      const result = await errorService.getTodoItems('test-user');
      
      // Should return empty array on connection error
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it('should handle invalid user ID format gracefully', async () => {
      // Test with invalid UUID format
      const invalidUserId = 'invalid-uuid-format';
      const result = await shoppingService.getTodoItems(invalidUserId);
      
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
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockRejectedValue(new Error('Network timeout'))
              })
            })
          })
        })
      };

      const timeoutService = new ShoppingService(mockSupabase as any);
      const result = await timeoutService.getTodoItems('test-user');
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it('should handle malformed database response', async () => {
      // Test with corrupted/malformed data from database
      const mockSupabase = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
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
        })
      };

      const malformedService = new ShoppingService(mockSupabase as any);
      const result = await malformedService.getTodoItems('test-user');
      
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
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockResolvedValue({
                  data: null,
                  error: { 
                    code: '42501', 
                    message: 'permission denied for table shopping_items' 
                  }
                })
              })
            })
          })
        })
      };

      const permissionService = new ShoppingService(mockSupabase as any);
      const result = await permissionService.getTodoItems('test-user');
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it('should handle table not found errors', async () => {
      // Test when table doesn't exist
      const mockSupabase = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockResolvedValue({
                  data: null,
                  error: { 
                    code: 'PGRST205', 
                    message: "Could not find the table 'shopping_items' in the schema cache" 
                  }
                })
              })
            })
          })
        })
      };

      const noTableService = new ShoppingService(mockSupabase as any);
      const result = await noTableService.getTodoItems('test-user');
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it('should handle getItemById errors for invalid IDs', async () => {
      // Test getItemById with invalid UUID
      const result = await shoppingService.getItemById('invalid-uuid');
      
      expect(result).toBeNull();
    });

    it('should handle search errors with special characters', async () => {
      // Test search with SQL injection attempts or special characters
      const maliciousSearch = "'; DROP TABLE shopping_items; --";
      const result = await shoppingService.searchItems('test-user', maliciousSearch);
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it('should handle priority filter errors with invalid priority', async () => {
      // Test with invalid priority that doesn't exist in enum
      const result = await shoppingService.getItemsByPriority('test-user', 'invalid-priority' as any);
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it('should handle category filter errors with invalid category', async () => {
      // Test with invalid category that doesn't exist in enum
      const result = await shoppingService.getItemsByCategory('test-user', 'invalid-category' as any);
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it('should provide error logging for debugging', async () => {
      // Test that errors are properly logged for debugging
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Trigger an error to test logging
      await shoppingService.getTodoItems('invalid-format-user-id');
      
      // Should have logged the error
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    it('should handle concurrent request errors gracefully', async () => {
      // Test multiple simultaneous requests
      const userId = 'concurrent-test-user';
      const promises = [
        shoppingService.getTodoItems(userId),
        shoppingService.getCompletedItems(userId),
        shoppingService.getItemsByPriority(userId, 'urgent'),
        shoppingService.searchItems(userId, 'test')
      ];
      
      const results = await Promise.all(promises);
      
      // All requests should complete without throwing errors
      results.forEach(result => {
        expect(Array.isArray(result)).toBe(true);
      });
    });

    it('should handle very large dataset queries without memory issues', async () => {
      // Test service behavior with potentially large datasets
      const result = await shoppingService.getTodoItems('user-with-many-shopping-items');
      
      // Should not throw memory errors and return valid array
      expect(Array.isArray(result)).toBe(true);
      expect(typeof result.length).toBe('number');
    });

    it('should handle shopping statistics errors gracefully', async () => {
      // Test getShoppingStats with database errors
      const mockSupabase = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockRejectedValue(new Error('Stats fetch failed'))
              })
            })
          })
        })
      };

      const errorService = new ShoppingService(mockSupabase as any);
      const stats = await errorService.getShoppingStats('test-user');
      
      // Should return default stats object on error
      expect(stats).toBeDefined();
      expect(typeof stats.totalItems).toBe('number');
      expect(typeof stats.todoItems).toBe('number');
      expect(typeof stats.completedItems).toBe('number');
      expect(stats.totalItems).toBe(0);
    });

    it('should handle store filter errors with undefined store', async () => {
      // Test getItemsByStore with undefined/null store value
      const result = await shoppingService.getItemsByStore('test-user', '');
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });
});