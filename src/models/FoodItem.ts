/**
 * Food Item model interface for inventory management
 */
export interface FoodItem {
  /** Unique identifier (UUID) */
  id: string;
  
  /** Name of the food item */
  name: string;
  
  /** Quantity amount */
  quantity: number;
  
  /** Unit of measurement (pieces, kg, liters, etc.) */
  unit: string;
  
  /** Food category */
  category: 'fruits' | 'vegetables' | 'meat' | 'dairy' | 'grains' | 'beverages' | 'condiments' | 'frozen' | 'other';
  
  /** Date when item was added to inventory */
  addedDate: Date;
  
  /** Expiry/best before date */
  expiryDate: Date;
  
  /** Current status of the food item */
  status: 'fresh' | 'expired' | 'consumed' | 'frozen' | 'disposed';
  
  /** Optional memo/notes about the item */
  memo?: string;
  
  /** User ID who owns this item */
  userId: string;
  
  /** Timestamp when record was created */
  createdAt: Date;
  
  /** Timestamp when record was last updated */
  updatedAt: Date;
}

/**
 * Type for creating a new FoodItem (without auto-generated fields)
 */
export type CreateFoodItemInput = Omit<FoodItem, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Type for updating an existing FoodItem
 */
export type UpdateFoodItemInput = Partial<Omit<FoodItem, 'id' | 'createdAt' | 'updatedAt'>>;

/**
 * Valid food categories
 */
export const FOOD_CATEGORIES = [
  'fruits',
  'vegetables', 
  'meat',
  'dairy',
  'grains',
  'beverages',
  'condiments',
  'frozen',
  'other'
] as const;

/**
 * Valid food item statuses
 */
export const FOOD_STATUSES = [
  'fresh',
  'expired', 
  'consumed',
  'frozen',
  'disposed'
] as const;