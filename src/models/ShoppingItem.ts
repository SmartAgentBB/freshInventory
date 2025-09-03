/**
 * Shopping Item model interface for shopping list management
 */
export interface ShoppingItem {
  /** Unique identifier (UUID) */
  id: string;
  
  /** Name of the shopping item */
  name: string;
  
  /** Quantity to purchase */
  quantity: number;
  
  /** Unit of measurement (pieces, kg, liters, etc.) */
  unit: string;
  
  /** Shopping category */
  category: 'fruits' | 'vegetables' | 'meat' | 'dairy' | 'grains' | 'beverages' | 'condiments' | 'frozen' | 'household' | 'other';
  
  /** Priority level for shopping */
  priority: 'low' | 'normal' | 'high' | 'urgent';
  
  /** Whether this item is still todo (true) or completed (false) */
  todo: boolean;
  
  /** Optional memo/notes about the item */
  memo?: string;
  
  /** Store where to buy this item */
  store?: string;
  
  /** Expected or actual price */
  price?: number;
  
  /** User ID who owns this shopping item */
  userId: string;
  
  /** Timestamp when record was created */
  createdAt: Date;
  
  /** Timestamp when record was last updated */
  updatedAt: Date;
  
  /** Timestamp when item was marked as completed (null if still todo) */
  completedAt: Date | null;
}

/**
 * Type for creating a new ShoppingItem (without auto-generated fields)
 */
export type CreateShoppingItemInput = Omit<ShoppingItem, 'id' | 'createdAt' | 'updatedAt' | 'completedAt'>;

/**
 * Type for updating an existing ShoppingItem
 */
export type UpdateShoppingItemInput = Partial<Omit<ShoppingItem, 'id' | 'createdAt' | 'updatedAt'>>;

/**
 * Valid shopping categories
 */
export const SHOPPING_CATEGORIES = [
  'fruits',
  'vegetables', 
  'meat',
  'dairy',
  'grains',
  'beverages',
  'condiments',
  'frozen',
  'household',
  'other'
] as const;

/**
 * Valid shopping priority levels
 */
export const SHOPPING_PRIORITIES = [
  'low',
  'normal',
  'high',
  'urgent'
] as const;