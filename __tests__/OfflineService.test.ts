import { InventoryService } from '../src/services/InventoryService';
import { ShoppingService } from '../src/services/ShoppingService';
import { initializeSupabase } from '../src/services/supabaseClient';

// Set up test environment variables
process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://fwoykfbumwsbodrconeo.supabase.co';
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3b3lrZmJ1bXdzYm9kcmNvbmVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5MTQxMDEsImV4cCI6MjA3MTQ5MDEwMX0.rxwnJK2xqYSqohmaRJq0x5n9RMOGEchF4r7XifqO2h0';

// Initialize Supabase client and services
const supabase = initializeSupabase();
const inventoryService = new InventoryService(supabase);
const shoppingService = new ShoppingService(supabase);

describe('Database service should handle offline scenarios', () => {
  describe('Network connectivity issues', () => {
    it('should handle complete network disconnection gracefully', async () => {
      // Simulate complete network disconnection for InventoryService (single .eq())
      const offlineInventorySupabase = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockRejectedValue(new Error('Network request failed'))
            })
          })
        })
      };

      // Simulate complete network disconnection for ShoppingService (double .eq())
      const offlineShoppingSupabase = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockRejectedValue(new Error('Network request failed'))
              })
            })
          })
        })
      };

      const offlineInventoryService = new InventoryService(offlineInventorySupabase as any);
      const offlineShoppingService = new ShoppingService(offlineShoppingSupabase as any);
      
      // Both services should handle offline gracefully
      const inventoryItems = await offlineInventoryService.getItems('offline-user');
      const shoppingItems = await offlineShoppingService.getTodoItems('offline-user');
      
      expect(Array.isArray(inventoryItems)).toBe(true);
      expect(inventoryItems.length).toBe(0);
      expect(Array.isArray(shoppingItems)).toBe(true);
      expect(shoppingItems.length).toBe(0);
    });

    it('should handle intermittent network connection failures', async () => {
      // Simulate intermittent network failures
      let callCount = 0;
      const intermittentSupabase = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockImplementation(() => {
                callCount++;
                if (callCount % 2 === 0) {
                  return Promise.reject(new Error('Connection timeout'));
                }
                return Promise.resolve({ data: [], error: null });
              })
            })
          })
        })
      };

      const intermittentInventoryService = new InventoryService(intermittentSupabase as any);
      
      // First call should fail, second should succeed
      const result1 = await intermittentInventoryService.getItems('test-user');
      const result2 = await intermittentInventoryService.getItems('test-user');
      
      expect(Array.isArray(result1)).toBe(true);
      expect(result1.length).toBe(0);
      expect(Array.isArray(result2)).toBe(true);
      expect(result2.length).toBe(0);
    });

    it('should handle slow network connections without timeout errors', async () => {
      // Simulate slow network connection
      const slowSupabase = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockImplementation(() => 
                new Promise((resolve) => {
                  setTimeout(() => {
                    resolve({ data: [], error: null });
                  }, 100); // Simulate slow response
                })
              )
            })
          })
        })
      };

      const slowInventoryService = new InventoryService(slowSupabase as any);
      
      const startTime = Date.now();
      const result = await slowInventoryService.getItems('slow-user');
      const endTime = Date.now();
      
      // Should handle slow connections gracefully
      expect(Array.isArray(result)).toBe(true);
      expect(endTime - startTime).toBeGreaterThan(50); // Took some time
      expect(result.length).toBe(0);
    });
  });

  describe('Connection state detection', () => {
    it('should detect when database is unreachable', async () => {
      // Test with unreachable database
      const unreachableSupabase = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockRejectedValue(new Error('ENOTFOUND'))
            })
          })
        })
      };

      const unreachableService = new InventoryService(unreachableSupabase as any);
      const result = await unreachableService.getItems('unreachable-user');
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it('should handle DNS resolution failures', async () => {
      // Simulate DNS resolution failure
      const dnsFailSupabase = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockRejectedValue(new Error('getaddrinfo ENOTFOUND'))
              })
            })
          })
        })
      };

      const dnsFailService = new ShoppingService(dnsFailSupabase as any);
      const result = await dnsFailService.getTodoItems('dns-fail-user');
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it('should handle SSL certificate errors in offline mode', async () => {
      // Simulate SSL certificate errors
      const sslErrorSupabase = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockRejectedValue(new Error('CERT_HAS_EXPIRED'))
            })
          })
        })
      };

      const sslErrorService = new InventoryService(sslErrorSupabase as any);
      const result = await sslErrorService.getItems('ssl-error-user');
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  describe('Service availability and degradation', () => {
    it('should handle Supabase service unavailability', async () => {
      // Simulate Supabase service being completely unavailable  
      const serviceDownInventorySupabase = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockRejectedValue(new Error('Service Temporarily Unavailable'))
            })
          })
        })
      };

      const serviceDownShoppingSupabase = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockRejectedValue(new Error('Service Temporarily Unavailable'))
              })
            })
          })
        })
      };

      const serviceDownInventory = new InventoryService(serviceDownInventorySupabase as any);
      const serviceDownShopping = new ShoppingService(serviceDownShoppingSupabase as any);
      
      // Both services should handle service downtime gracefully
      const inventoryResult = await serviceDownInventory.getItems('service-down-user');
      const shoppingResult = await serviceDownShopping.getTodoItems('service-down-user');
      
      expect(Array.isArray(inventoryResult)).toBe(true);
      expect(inventoryResult.length).toBe(0);
      expect(Array.isArray(shoppingResult)).toBe(true);
      expect(shoppingResult.length).toBe(0);
    });

    it('should handle rate limiting during high traffic', async () => {
      // Simulate rate limiting errors
      const rateLimitSupabase = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockRejectedValue(new Error('Too Many Requests'))
              })
            })
          })
        })
      };

      const rateLimitService = new ShoppingService(rateLimitSupabase as any);
      const result = await rateLimitService.getTodoItems('rate-limit-user');
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it('should handle API quota exceeded scenarios', async () => {
      // Simulate API quota exceeded
      const quotaExceededSupabase = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockRejectedValue(new Error('Quota exceeded'))
            })
          })
        })
      };

      const quotaService = new InventoryService(quotaExceededSupabase as any);
      const result = await quotaService.getItems('quota-exceeded-user');
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  describe('Cross-service offline behavior', () => {
    it('should maintain consistent offline behavior across all inventory methods', async () => {
      // Test all inventory service methods in offline mode
      const offlineSupabase = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockRejectedValue(new Error('Network offline')),
              lte: jest.fn().mockRejectedValue(new Error('Network offline'))
            })
          }),
          single: jest.fn().mockRejectedValue(new Error('Network offline'))
        })
      };

      const offlineInventoryService = new InventoryService(offlineSupabase as any);
      
      // Test all major methods
      const allItems = await offlineInventoryService.getItems('offline-user');
      const freshItems = await offlineInventoryService.getItemsByStatus('offline-user', 'fresh');
      const fruitItems = await offlineInventoryService.getItemsByCategory('offline-user', 'fruits');
      const singleItem = await offlineInventoryService.getItemById('offline-item-id');
      const searchResults = await offlineInventoryService.searchItems('offline-user', 'apple');
      const sortedItems = await offlineInventoryService.getItemsSortedByExpiry('offline-user');
      const expiringItems = await offlineInventoryService.getExpiringSoon('offline-user');
      const stats = await offlineInventoryService.getInventoryStats('offline-user');
      
      // All should handle offline gracefully
      expect(Array.isArray(allItems)).toBe(true);
      expect(allItems.length).toBe(0);
      expect(Array.isArray(freshItems)).toBe(true);
      expect(freshItems.length).toBe(0);
      expect(Array.isArray(fruitItems)).toBe(true);
      expect(fruitItems.length).toBe(0);
      expect(singleItem).toBeNull();
      expect(Array.isArray(searchResults)).toBe(true);
      expect(searchResults.length).toBe(0);
      expect(Array.isArray(sortedItems)).toBe(true);
      expect(sortedItems.length).toBe(0);
      expect(Array.isArray(expiringItems)).toBe(true);
      expect(expiringItems.length).toBe(0);
      expect(stats.totalItems).toBe(0);
      expect(stats.freshItems).toBe(0);
    });

    it('should maintain consistent offline behavior across all shopping methods', async () => {
      // Test all shopping service methods in offline mode
      const offlineSupabase = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockRejectedValue(new Error('Network offline')),
                limit: jest.fn().mockRejectedValue(new Error('Network offline'))
              })
            })
          }),
          single: jest.fn().mockRejectedValue(new Error('Network offline'))
        })
      };

      const offlineShoppingService = new ShoppingService(offlineSupabase as any);
      
      // Test all major methods
      const todoItems = await offlineShoppingService.getTodoItems('offline-user');
      const completedItems = await offlineShoppingService.getCompletedItems('offline-user');
      const urgentItems = await offlineShoppingService.getItemsByPriority('offline-user', 'urgent');
      const dairyItems = await offlineShoppingService.getItemsByCategory('offline-user', 'dairy');
      const singleItem = await offlineShoppingService.getItemById('offline-shopping-id');
      const searchResults = await offlineShoppingService.searchItems('offline-user', 'milk');
      const sortedItems = await offlineShoppingService.getItemsSortedByPriority('offline-user');
      const storeItems = await offlineShoppingService.getItemsByStore('offline-user', 'Supermarket');
      const recentItems = await offlineShoppingService.getRecentlyCompleted('offline-user');
      const stats = await offlineShoppingService.getShoppingStats('offline-user');
      
      // All should handle offline gracefully
      expect(Array.isArray(todoItems)).toBe(true);
      expect(todoItems.length).toBe(0);
      expect(Array.isArray(completedItems)).toBe(true);
      expect(completedItems.length).toBe(0);
      expect(Array.isArray(urgentItems)).toBe(true);
      expect(urgentItems.length).toBe(0);
      expect(Array.isArray(dairyItems)).toBe(true);
      expect(dairyItems.length).toBe(0);
      expect(singleItem).toBeNull();
      expect(Array.isArray(searchResults)).toBe(true);
      expect(searchResults.length).toBe(0);
      expect(Array.isArray(sortedItems)).toBe(true);
      expect(sortedItems.length).toBe(0);
      expect(Array.isArray(storeItems)).toBe(true);
      expect(storeItems.length).toBe(0);
      expect(Array.isArray(recentItems)).toBe(true);
      expect(recentItems.length).toBe(0);
      expect(stats.totalItems).toBe(0);
      expect(stats.todoItems).toBe(0);
    });
  });

  describe('Error recovery and resilience', () => {
    it('should provide meaningful error context for debugging offline issues', async () => {
      // Test error logging in offline scenarios
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      const debugSupabase = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockRejectedValue(new Error('Network connection lost'))
              })
            })
          })
        })
      };

      const debugService = new InventoryService(debugSupabase as any);
      
      // Trigger offline error
      await debugService.getItems('debug-user');
      
      // Should log meaningful error information
      expect(consoleSpy).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error fetching inventory items:'),
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });

    it('should handle multiple concurrent offline requests without degradation', async () => {
      // Test concurrent offline requests
      const concurrentInventorySupabase = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockRejectedValue(new Error('Offline'))
            })
          })
        })
      };

      const concurrentShoppingSupabase = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockRejectedValue(new Error('Offline'))
              })
            })
          })
        })
      };

      const concurrentInventoryService = new InventoryService(concurrentInventorySupabase as any);
      const concurrentShoppingService = new ShoppingService(concurrentShoppingSupabase as any);
      
      // Make multiple concurrent requests
      const promises = [
        concurrentInventoryService.getItems('concurrent-user-1'),
        concurrentInventoryService.getItems('concurrent-user-2'),
        concurrentShoppingService.getTodoItems('concurrent-user-1'),
        concurrentShoppingService.getTodoItems('concurrent-user-2'),
        concurrentInventoryService.getItemsByStatus('concurrent-user-1', 'fresh'),
        concurrentShoppingService.getItemsByPriority('concurrent-user-1', 'urgent')
      ];
      
      const results = await Promise.all(promises);
      
      // All should handle offline gracefully
      results.forEach(result => {
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBe(0);
      });
    });
  });
});