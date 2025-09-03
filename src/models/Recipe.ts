/**
 * Recipe model interface for cooking and meal planning
 */

/**
 * Recipe ingredient interface
 */
export interface RecipeIngredient {
  /** Name of the ingredient */
  name: string;
  
  /** Quantity needed */
  quantity: number;
  
  /** Unit of measurement (cups, grams, pieces, etc.) */
  unit: string;
  
  /** Whether this ingredient is required or optional */
  required: boolean;
}

/**
 * Recipe model interface
 */
export interface Recipe {
  /** Unique identifier (UUID) */
  id: string;
  
  /** Recipe title */
  title: string;
  
  /** Recipe description */
  description: string;
  
  /** Difficulty level */
  difficulty: 'easy' | 'medium' | 'hard';
  
  /** Cooking time in minutes */
  cookingTime: number;
  
  /** Number of servings this recipe makes */
  servings: number;
  
  /** List of ingredients with quantities */
  ingredients: RecipeIngredient[];
  
  /** Step-by-step cooking instructions */
  instructions: string[];
  
  /** Recipe tags for categorization and search */
  tags: string[];
  
  /** Recipe category */
  category: 'appetizer' | 'main-dish' | 'dessert' | 'beverage' | 'soup' | 'salad' | 'snack' | 'other';
  
  /** Cuisine type */
  cuisine: 'korean' | 'italian' | 'chinese' | 'japanese' | 'american' | 'mexican' | 'french' | 'indian' | 'other';
  
  /** Whether this recipe is bookmarked by the user */
  isBookmarked: boolean;
  
  /** Average rating (0-5) */
  rating?: number;
  
  /** Number of reviews/ratings */
  reviewCount?: number;
  
  /** User ID who created this recipe */
  userId: string;
  
  /** Timestamp when record was created */
  createdAt: Date;
  
  /** Timestamp when record was last updated */
  updatedAt: Date;
}

/**
 * Type for creating a new Recipe (without auto-generated fields)
 */
export type CreateRecipeInput = Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Type for updating an existing Recipe
 */
export type UpdateRecipeInput = Partial<Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>>;

/**
 * Valid recipe difficulty levels
 */
export const RECIPE_DIFFICULTIES = [
  'easy',
  'medium',
  'hard'
] as const;

/**
 * Valid recipe categories
 */
export const RECIPE_CATEGORIES = [
  'appetizer',
  'main-dish',
  'dessert',
  'beverage',
  'soup',
  'salad',
  'snack',
  'other'
] as const;

/**
 * Valid cuisine types
 */
export const CUISINE_TYPES = [
  'korean',
  'italian',
  'chinese',
  'japanese',
  'american',
  'mexican',
  'french',
  'indian',
  'other'
] as const;