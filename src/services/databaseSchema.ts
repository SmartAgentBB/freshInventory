/**
 * Database Schema Service for creating and managing Supabase tables
 */
import { SupabaseClient } from '@supabase/supabase-js';

/**
 * SQL statements for creating database tables
 */
export const CREATE_FOOD_ITEMS_TABLE = `
  CREATE TABLE IF NOT EXISTS food_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('fruits', 'vegetables', 'meat', 'dairy', 'grains', 'beverages', 'condiments', 'frozen', 'other')),
    added_date TIMESTAMPTZ NOT NULL,
    expiry_date TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'fresh' CHECK (status IN ('fresh', 'expired', 'consumed', 'frozen', 'disposed')),
    memo TEXT,
    user_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );
`;

export const CREATE_SHOPPING_ITEMS_TABLE = `
  CREATE TABLE IF NOT EXISTS shopping_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('fruits', 'vegetables', 'meat', 'dairy', 'grains', 'beverages', 'condiments', 'frozen', 'household', 'other')),
    priority VARCHAR(20) NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    todo BOOLEAN NOT NULL DEFAULT true,
    memo TEXT,
    store VARCHAR(255),
    price DECIMAL(10,2),
    user_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
  );
`;

export const CREATE_RECIPES_TABLE = `
  CREATE TABLE IF NOT EXISTS recipes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
    cooking_time INTEGER NOT NULL,
    servings INTEGER NOT NULL,
    ingredients JSONB NOT NULL,
    instructions TEXT[] NOT NULL,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    category VARCHAR(50) NOT NULL CHECK (category IN ('appetizer', 'main-dish', 'dessert', 'beverage', 'soup', 'salad', 'snack', 'other')),
    cuisine VARCHAR(50) NOT NULL CHECK (cuisine IN ('korean', 'italian', 'chinese', 'japanese', 'american', 'mexican', 'french', 'indian', 'other')),
    is_bookmarked BOOLEAN NOT NULL DEFAULT false,
    rating DECIMAL(2,1),
    review_count INTEGER DEFAULT 0,
    user_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );
`;

/**
 * SQL statements for creating indexes for better performance
 */
export const CREATE_INDEXES = [
  'CREATE INDEX IF NOT EXISTS idx_food_items_user_id ON food_items(user_id);',
  'CREATE INDEX IF NOT EXISTS idx_food_items_status ON food_items(status);',
  'CREATE INDEX IF NOT EXISTS idx_food_items_category ON food_items(category);',
  'CREATE INDEX IF NOT EXISTS idx_shopping_items_user_id ON shopping_items(user_id);',
  'CREATE INDEX IF NOT EXISTS idx_shopping_items_todo ON shopping_items(todo);',
  'CREATE INDEX IF NOT EXISTS idx_shopping_items_priority ON shopping_items(priority);',
  'CREATE INDEX IF NOT EXISTS idx_recipes_user_id ON recipes(user_id);',
  'CREATE INDEX IF NOT EXISTS idx_recipes_category ON recipes(category);',
  'CREATE INDEX IF NOT EXISTS idx_recipes_cuisine ON recipes(cuisine);',
  'CREATE INDEX IF NOT EXISTS idx_recipes_is_bookmarked ON recipes(is_bookmarked);'
];

/**
 * SQL statements for creating updated_at triggers
 */
export const CREATE_UPDATED_AT_TRIGGERS = [
  `
  CREATE OR REPLACE FUNCTION update_updated_at_column()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
  END;
  $$ language 'plpgsql';
  `,
  `
  CREATE TRIGGER update_food_items_updated_at 
  BEFORE UPDATE ON food_items 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  `,
  `
  CREATE TRIGGER update_shopping_items_updated_at 
  BEFORE UPDATE ON shopping_items 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  `,
  `
  CREATE TRIGGER update_recipes_updated_at 
  BEFORE UPDATE ON recipes 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  `
];

/**
 * Service class for managing database schema
 */
export class DatabaseSchemaService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Create all required tables for the application
   * Note: For testing purposes, we'll assume tables exist or are created via migrations
   */
  async createTables(): Promise<{ success: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      // For now, we'll verify tables exist by attempting to access them
      // In a real application, tables would be created via Supabase migrations
      const verification = await this.verifyTablesExist();
      
      if (!verification.allExist) {
        // In a real app, we would run migrations here
        // For testing, we'll assume the tables will be created externally
        errors.push('Some tables do not exist - would run migrations in production');
      }

      return {
        success: verification.allExist,
        errors
      };
    } catch (error) {
      errors.push(`Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
      return {
        success: false,
        errors
      };
    }
  }

  /**
   * Check if all required tables exist
   */
  async verifyTablesExist(): Promise<{ 
    foodItems: boolean; 
    shoppingItems: boolean; 
    recipes: boolean; 
    allExist: boolean;
  }> {
    try {
      // Test food_items table - try to access with minimal columns
      const { error: foodError } = await this.supabase
        .from('food_items')
        .select('id')
        .limit(1);

      // Test shopping_items table
      const { error: shoppingError } = await this.supabase
        .from('shopping_items')
        .select('id')
        .limit(1);

      // Test recipes table
      const { error: recipesError } = await this.supabase
        .from('recipes')
        .select('id')
        .limit(1);

      const foodItems = !foodError;
      const shoppingItems = !shoppingError;
      const recipes = !recipesError;

      return {
        foodItems,
        shoppingItems,
        recipes,
        allExist: foodItems && shoppingItems && recipes
      };
    } catch (error) {
      return {
        foodItems: false,
        shoppingItems: false,
        recipes: false,
        allExist: false
      };
    }
  }

  /**
   * Get current database schema information
   */
  async getSchemaInfo(): Promise<{
    tablesExist: { foodItems: boolean; shoppingItems: boolean; recipes: boolean };
    schemaReady: boolean;
    message: string;
  }> {
    const verification = await this.verifyTablesExist();
    
    return {
      tablesExist: {
        foodItems: verification.foodItems,
        shoppingItems: verification.shoppingItems,
        recipes: verification.recipes
      },
      schemaReady: verification.allExist,
      message: verification.allExist 
        ? 'All database tables are available'
        : 'Some database tables are missing or incomplete'
    };
  }

  /**
   * Drop all tables (for testing purposes)
   * Note: In production, this would be handled via migrations
   */
  async dropTables(): Promise<{ success: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      // In a real application, we would use migrations to drop tables
      // For now, we'll just report that this would be done via migrations
      errors.push('Drop tables would be handled via Supabase migrations');
      
      return {
        success: false, // Not implemented for safety
        errors
      };
    } catch (error) {
      errors.push(`Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
      return {
        success: false,
        errors
      };
    }
  }
}

/**
 * Initialize database schema with the given Supabase client
 */
export function initializeDatabaseSchema(supabase: SupabaseClient): DatabaseSchemaService {
  return new DatabaseSchemaService(supabase);
}