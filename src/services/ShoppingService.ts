/**
 * Shopping Service for managing shopping list items in the database
 */
import { SupabaseClient } from '@supabase/supabase-js';
import { ShoppingItem, SHOPPING_CATEGORIES, SHOPPING_PRIORITIES } from '../models/ShoppingItem';

/**
 * Service class for shopping list management operations
 */
export class ShoppingService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Fetch all todo shopping items for a specific user (todo = true)
   */
  async getTodoItems(userId: string): Promise<ShoppingItem[]> {
    try {
      const { data, error } = await this.supabase
        .from('shopping_items')
        .select('*')
        .eq('user_id', userId)
        .eq('todo', true)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch todo shopping items: ${error.message}`);
      }

      return this.mapDatabaseItemsToShoppingItems(data || []);
    } catch (error) {
      console.error('Error fetching todo shopping items:', error);
      return [];
    }
  }

  /**
   * Fetch all completed shopping items for a specific user (todo = false)
   */
  async getCompletedItems(userId: string): Promise<ShoppingItem[]> {
    try {
      const { data, error } = await this.supabase
        .from('shopping_items')
        .select('*')
        .eq('user_id', userId)
        .eq('todo', false)
        .order('completed_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch completed shopping items: ${error.message}`);
      }

      return this.mapDatabaseItemsToShoppingItems(data || []);
    } catch (error) {
      console.error('Error fetching completed shopping items:', error);
      return [];
    }
  }

  /**
   * Fetch items filtered by priority
   */
  async getItemsByPriority(userId: string, priority: ShoppingItem['priority']): Promise<ShoppingItem[]> {
    try {
      const { data, error } = await this.supabase
        .from('shopping_items')
        .select('*')
        .eq('user_id', userId)
        .eq('priority', priority)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch items by priority: ${error.message}`);
      }

      return this.mapDatabaseItemsToShoppingItems(data || []);
    } catch (error) {
      console.error('Error fetching items by priority:', error);
      return [];
    }
  }

  /**
   * Fetch items filtered by category
   */
  async getItemsByCategory(userId: string, category: ShoppingItem['category']): Promise<ShoppingItem[]> {
    try {
      const { data, error } = await this.supabase
        .from('shopping_items')
        .select('*')
        .eq('user_id', userId)
        .eq('category', category)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch items by category: ${error.message}`);
      }

      return this.mapDatabaseItemsToShoppingItems(data || []);
    } catch (error) {
      console.error('Error fetching items by category:', error);
      return [];
    }
  }

  /**
   * Fetch a single item by ID
   */
  async getItemById(id: string): Promise<ShoppingItem | null> {
    try {
      const { data, error } = await this.supabase
        .from('shopping_items')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Item not found
          return null;
        }
        throw new Error(`Failed to fetch shopping item by ID: ${error.message}`);
      }

      const mapped = this.mapDatabaseItemsToShoppingItems([data]);
      return mapped.length > 0 ? mapped[0] : null;
    } catch (error) {
      console.error('Error fetching shopping item by ID:', error);
      return null;
    }
  }

  /**
   * Search items by name
   */
  async searchItems(userId: string, searchTerm: string): Promise<ShoppingItem[]> {
    try {
      const { data, error } = await this.supabase
        .from('shopping_items')
        .select('*')
        .eq('user_id', userId)
        .ilike('name', `%${searchTerm}%`)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to search shopping items: ${error.message}`);
      }

      return this.mapDatabaseItemsToShoppingItems(data || []);
    } catch (error) {
      console.error('Error searching shopping items:', error);
      return [];
    }
  }

  /**
   * Get items sorted by priority (urgent first, then high, normal, low)
   */
  async getItemsSortedByPriority(userId: string): Promise<ShoppingItem[]> {
    try {
      const { data, error } = await this.supabase
        .from('shopping_items')
        .select('*')
        .eq('user_id', userId)
        .order('priority', { ascending: true }); // Assuming database stores priorities as ordered values

      if (error) {
        throw new Error(`Failed to fetch items sorted by priority: ${error.message}`);
      }

      const items = this.mapDatabaseItemsToShoppingItems(data || []);
      
      // Custom sort by priority order (urgent > high > normal > low)
      const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
      return items.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    } catch (error) {
      console.error('Error fetching items sorted by priority:', error);
      return [];
    }
  }

  /**
   * Get items filtered by store
   */
  async getItemsByStore(userId: string, store: string): Promise<ShoppingItem[]> {
    try {
      const { data, error } = await this.supabase
        .from('shopping_items')
        .select('*')
        .eq('user_id', userId)
        .eq('store', store)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch items by store: ${error.message}`);
      }

      return this.mapDatabaseItemsToShoppingItems(data || []);
    } catch (error) {
      console.error('Error fetching items by store:', error);
      return [];
    }
  }

  /**
   * Get recently completed items (limited by count)
   */
  async getRecentlyCompleted(userId: string, limit: number = 10): Promise<ShoppingItem[]> {
    try {
      const { data, error } = await this.supabase
        .from('shopping_items')
        .select('*')
        .eq('user_id', userId)
        .eq('todo', false)
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(`Failed to fetch recently completed items: ${error.message}`);
      }

      return this.mapDatabaseItemsToShoppingItems(data || []);
    } catch (error) {
      console.error('Error fetching recently completed items:', error);
      return [];
    }
  }

  /**
   * Get comprehensive shopping statistics for user
   */
  async getShoppingStats(userId: string): Promise<{
    totalItems: number;
    todoItems: number;
    completedItems: number;
    priorityCounts: Record<string, number>;
    categoryCounts: Record<string, number>;
  }> {
    try {
      // Get all items for the user
      const todoItems = await this.getTodoItems(userId);
      const completedItems = await this.getCompletedItems(userId);
      const allItems = [...todoItems, ...completedItems];
      
      const stats = {
        totalItems: allItems.length,
        todoItems: todoItems.length,
        completedItems: completedItems.length,
        priorityCounts: {} as Record<string, number>,
        categoryCounts: {} as Record<string, number>
      };

      // Count items by priority
      SHOPPING_PRIORITIES.forEach(priority => {
        stats.priorityCounts[priority] = allItems.filter(item => item.priority === priority).length;
      });

      // Count items by category
      SHOPPING_CATEGORIES.forEach(category => {
        stats.categoryCounts[category] = allItems.filter(item => item.category === category).length;
      });

      return stats;
    } catch (error) {
      console.error('Error fetching shopping stats:', error);
      return {
        totalItems: 0,
        todoItems: 0,
        completedItems: 0,
        priorityCounts: {},
        categoryCounts: {}
      };
    }
  }

  /**
   * Map database items to ShoppingItem model
   * Handles the conversion from database snake_case to TypeScript camelCase
   */
  private mapDatabaseItemsToShoppingItems(databaseItems: any[]): ShoppingItem[] {
    return databaseItems
      .filter(item => item && item.id && item.name) // Filter out null/invalid items
      .map(item => ({
        id: item.id,
        name: item.name,
        quantity: parseFloat(item.quantity) || 0,
        unit: item.unit || '',
        category: item.category || 'other',
        priority: item.priority || 'normal',
        todo: Boolean(item.todo),
        memo: item.memo || undefined,
        store: item.store || undefined,
        price: item.price ? parseFloat(item.price) : undefined,
        userId: item.user_id || '',
        createdAt: new Date(item.created_at || new Date()),
        updatedAt: new Date(item.updated_at || new Date()),
        completedAt: item.completed_at ? new Date(item.completed_at) : null
      }));
  }

  /**
   * Map ShoppingItem to database format
   * Handles the conversion from TypeScript camelCase to database snake_case
   */
  private mapShoppingItemToDatabase(item: Omit<ShoppingItem, 'id' | 'createdAt' | 'updatedAt'>): any {
    return {
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      category: item.category,
      priority: item.priority,
      todo: item.todo,
      memo: item.memo || null,
      store: item.store || null,
      price: item.price || null,
      user_id: item.userId,
      completed_at: item.completedAt ? item.completedAt.toISOString() : null
    };
  }
}

/**
 * Initialize ShoppingService with the given Supabase client
 */
export function createShoppingService(supabase: SupabaseClient): ShoppingService {
  return new ShoppingService(supabase);
}