/**
 * Inventory Service for managing food items in the database
 */
import { SupabaseClient } from '@supabase/supabase-js';
import { FoodItem, FOOD_CATEGORIES, FOOD_STATUSES } from '../models/FoodItem';
import { StorageInfoService } from './StorageInfoService';

/**
 * Service class for inventory management operations
 */
export class InventoryService {
  private storageInfoService: StorageInfoService;
  
  constructor(private supabase: SupabaseClient, geminiApiKey?: string) {
    this.storageInfoService = new StorageInfoService(supabase, geminiApiKey);
  }

  /**
   * Fetch all food items for a specific user
   */
  async getItems(userId: string): Promise<FoodItem[]> {
    try {
      const { data, error } = await this.supabase
        .from('food_items')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch inventory items: ${error.message}`);
      }

      return this.mapDatabaseItemsToFoodItems(data || []);
    } catch (error) {
      console.error('Error fetching inventory items:', error);
      return [];
    }
  }

  /**
   * Fetch items filtered by status
   */
  async getItemsByStatus(userId: string, status: FoodItem['status']): Promise<FoodItem[]> {
    try {
      const { data, error } = await this.supabase
        .from('food_items')
        .select('*')
        .eq('user_id', userId)
        .eq('status', status)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(`Failed to fetch items by status: ${error.message}`);
      }

      return this.mapDatabaseItemsToFoodItems(data || []);
    } catch (error) {
      console.error('Error fetching items by status:', error);
      return [];
    }
  }

  /**
   * Fetch items filtered by category
   */
  async getItemsByCategory(userId: string, category: FoodItem['category']): Promise<FoodItem[]> {
    try {
      const { data, error } = await this.supabase
        .from('food_items')
        .select('*')
        .eq('user_id', userId)
        .eq('category', category)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch items by category: ${error.message}`);
      }

      return this.mapDatabaseItemsToFoodItems(data || []);
    } catch (error) {
      console.error('Error fetching items by category:', error);
      return [];
    }
  }

  /**
   * Fetch a single item by ID
   */
  async getItemById(id: string): Promise<FoodItem | null> {
    try {
      const { data, error } = await this.supabase
        .from('food_items')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Item not found
          return null;
        }
        throw new Error(`Failed to fetch item by ID: ${error.message}`);
      }

      const mapped = this.mapDatabaseItemsToFoodItems([data]);
      return mapped.length > 0 ? mapped[0] : null;
    } catch (error) {
      console.error('Error fetching item by ID:', error);
      return null;
    }
  }

  /**
   * Search items by name
   */
  async searchItems(userId: string, searchTerm: string): Promise<FoodItem[]> {
    try {
      const { data, error } = await this.supabase
        .from('food_items')
        .select('*')
        .eq('user_id', userId)
        .ilike('name', `%${searchTerm}%`)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to search items: ${error.message}`);
      }

      return this.mapDatabaseItemsToFoodItems(data || []);
    } catch (error) {
      console.error('Error searching items:', error);
      return [];
    }
  }

  /**
   * Get items sorted by expiry date (soonest first)
   */
  async getItemsSortedByExpiry(userId: string): Promise<FoodItem[]> {
    try {
      const { data, error } = await this.supabase
        .from('food_items')
        .select('*')
        .eq('user_id', userId)
        .order('expiry_date', { ascending: true });

      if (error) {
        throw new Error(`Failed to fetch items sorted by expiry: ${error.message}`);
      }

      return this.mapDatabaseItemsToFoodItems(data || []);
    } catch (error) {
      console.error('Error fetching items sorted by expiry:', error);
      return [];
    }
  }

  /**
   * Get items that are expiring soon (within specified days)
   */
  async getExpiringSoon(userId: string, daysAhead: number = 3): Promise<FoodItem[]> {
    try {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + daysAhead);

      const { data, error } = await this.supabase
        .from('food_items')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'fresh')
        .lte('expiry_date', futureDate.toISOString())
        .order('expiry_date', { ascending: true });

      if (error) {
        throw new Error(`Failed to fetch expiring items: ${error.message}`);
      }

      return this.mapDatabaseItemsToFoodItems(data || []);
    } catch (error) {
      console.error('Error fetching expiring items:', error);
      return [];
    }
  }

  /**
   * Add a new item to inventory
   */
  async addItem(item: Partial<FoodItem> & { name: string; quantity: number; userId?: string }): Promise<FoodItem | null> {
    try {
      if (!item.userId) {
        console.error('User ID is missing!');
        throw new Error('User ID is required to add an item');
      }
      
      // Remove duplicate check - allow multiple items with same name
      // This allows users to track items purchased at different times
      
      // Get storage info from storage_info table (with AI generation if needed)
      let storageDays = 7; // Default 7 days
      const storageInfo = await this.storageInfoService.getStorageInfo(item.name);
      
      if (storageInfo && storageInfo.storage_days) {
        storageDays = storageInfo.storage_days;
        console.log(`Using storage days ${storageDays} for ${item.name}`);
      } else {
        console.log(`Using default storage days for ${item.name}`);
      }
      
      const now = new Date();
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + storageDays);
      
      const newItem = {
        name: item.name,
        quantity: item.quantity,
        unit: item.unit || '개',
        category: item.category || 'other',
        addedDate: now,
        expiryDate: item.expiryDate || expiryDate,
        status: 'fresh' as const,
        memo: item.memo,
        thumbnail: item.thumbnail,
        remains: item.remains || 1,
        storageDays: storageDays, // Save storage_days to food_items table
        userId: item.userId,
      };

      const dbItem = this.mapFoodItemToDatabase(newItem);
      
      const { data, error } = await this.supabase
        .from('food_items')
        .insert([dbItem])
        .select()
        .single();

      if (error) {
        console.error('Supabase insert error:', error);
        throw new Error(`Failed to add item: ${error.message}`);
      }

      const mapped = this.mapDatabaseItemsToFoodItems([data]);
      return mapped.length > 0 ? mapped[0] : null;
    } catch (error) {
      console.error('Error adding item:', error);
      return null;
    }
  }

  /**
   * Update an existing item
   */
  async updateItem(id: string, updates: Partial<FoodItem>): Promise<FoodItem | null> {
    try {
      const { data, error } = await this.supabase
        .from('food_items')
        .update({
          name: updates.name,
          quantity: updates.quantity,
          unit: updates.unit,
          category: updates.category,
          status: updates.status,
          memo: updates.memo,
          thumbnail: updates.thumbnail,
          remains: updates.remains,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update item: ${error.message}`);
      }

      const mapped = this.mapDatabaseItemsToFoodItems([data]);
      return mapped.length > 0 ? mapped[0] : null;
    } catch (error) {
      console.error('Error updating item:', error);
      return null;
    }
  }

  /**
   * Delete an item from inventory
   */
  async deleteItem(id: string): Promise<boolean> {
    console.log('InventoryService.deleteItem called with id:', id);
    try {
      const { error } = await this.supabase
        .from('food_items')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Supabase delete error:', error);
        throw new Error(`Failed to delete item: ${error.message}`);
      }

      console.log('Item deleted successfully from database');
      return true;
    } catch (error) {
      console.error('Error deleting item:', error);
      return false;
    }
  }

  /**
   * Get summary statistics for user's inventory
   */
  async getInventoryStats(userId: string): Promise<{
    totalItems: number;
    freshItems: number;
    expiredItems: number;
    frozenItems: number;
    consumedItems: number;
    disposedItems: number;
    categoryCounts: Record<string, number>;
  }> {
    try {
      const items = await this.getItems(userId);
      
      const stats = {
        totalItems: items.length,
        freshItems: items.filter(item => item.status === 'fresh').length,
        expiredItems: items.filter(item => item.status === 'expired').length,
        frozenItems: items.filter(item => item.status === 'frozen').length,
        consumedItems: items.filter(item => item.status === 'consumed').length,
        disposedItems: items.filter(item => item.status === 'disposed').length,
        categoryCounts: {} as Record<string, number>
      };

      // Count items by category
      FOOD_CATEGORIES.forEach(category => {
        stats.categoryCounts[category] = items.filter(item => item.category === category).length;
      });

      return stats;
    } catch (error) {
      console.error('Error fetching inventory stats:', error);
      return {
        totalItems: 0,
        freshItems: 0,
        expiredItems: 0,
        frozenItems: 0,
        consumedItems: 0,
        disposedItems: 0,
        categoryCounts: {}
      };
    }
  }

  /**
   * Map database items to FoodItem model
   * Handles the conversion from database snake_case to TypeScript camelCase
   */
  private mapDatabaseItemsToFoodItems(databaseItems: any[]): FoodItem[] {
    return databaseItems
      .filter(item => item && item.id && item.name) // Filter out null/invalid items
      .map(item => {
        // Use expiry_date directly from database
        let expiryDate = item.expiry_date ? new Date(item.expiry_date) : new Date();
        
        // If no expiry_date, calculate from storage_days
        if (!item.expiry_date && item.storage_days) {
          expiryDate = new Date(item.added_date || item.created_at || new Date());
          expiryDate.setDate(expiryDate.getDate() + item.storage_days);
        } else if (!item.expiry_date) {
          // Default 7 days if no storage_days either
          expiryDate = new Date(item.added_date || item.created_at || new Date());
          expiryDate.setDate(expiryDate.getDate() + 7);
        }
        
        return {
          id: item.id,
          name: item.name,
          quantity: parseFloat(item.quantity) || 0,
          unit: item.unit || '',
          category: item.category || 'other',
          addedDate: new Date(item.added_date || new Date()),
          expiryDate: expiryDate,
          status: item.status || 'fresh',
          memo: item.memo || undefined,
          thumbnail: item.thumbnail || undefined,
          remains: item.remains !== undefined ? parseFloat(item.remains) : 1,
          storageDays: item.storage_days || 7,
          userId: item.user_id || '',
          createdAt: new Date(item.created_at || new Date()),
          updatedAt: new Date(item.updated_at || new Date())
        };
      });
  }

  /**
   * Map FoodItem to database format
   * Handles the conversion from TypeScript camelCase to database snake_case
   */
  private mapFoodItemToDatabase(item: Omit<FoodItem, 'id' | 'createdAt' | 'updatedAt'>): any {
    return {
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      category: item.category,
      added_date: item.addedDate.toISOString(),
      expiry_date: item.expiryDate.toISOString(),
      status: item.status,
      memo: item.memo || null,
      thumbnail: item.thumbnail || null,
      remains: item.remains || 1,
      storage_days: item.storageDays || 7,
      user_id: item.userId
    };
  }
}

/**
 * Initialize InventoryService with the given Supabase client
 */
export function createInventoryService(supabase: SupabaseClient): InventoryService {
  return new InventoryService(supabase);
}