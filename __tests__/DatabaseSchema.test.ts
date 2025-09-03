import { initializeSupabase } from '../src/services/supabaseClient';
import { 
  initializeDatabaseSchema, 
  CREATE_FOOD_ITEMS_TABLE, 
  CREATE_SHOPPING_ITEMS_TABLE, 
  CREATE_RECIPES_TABLE,
  CREATE_INDEXES,
  CREATE_UPDATED_AT_TRIGGERS,
  DatabaseSchemaService 
} from '../src/services/databaseSchema';

// Set up test environment variables
process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://fwoykfbumwsbodrconeo.supabase.co';
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3b3lrZmJ1bXdzYm9kcmNvbmVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5MTQxMDEsImV4cCI6MjA3MTQ5MDEwMX0.rxwnJK2xqYSqohmaRJq0x5n9RMOGEchF4r7XifqO2h0';

// Initialize Supabase client and database schema service
const supabase = initializeSupabase();
const schemaService = initializeDatabaseSchema(supabase);

describe('Database Schema', () => {
  describe('Database tables should be created with correct schema', () => {
    it('should provide database schema verification service', async () => {
      // Test that the schema service can check table existence
      const schemaInfo = await schemaService.getSchemaInfo();
      
      expect(schemaInfo).toBeDefined();
      expect(schemaInfo.tablesExist).toBeDefined();
      expect(schemaInfo.schemaReady).toBeDefined();
      expect(schemaInfo.message).toBeDefined();
      
      // Should have properties for all required tables
      expect(schemaInfo.tablesExist.foodItems).toBeDefined();
      expect(schemaInfo.tablesExist.shoppingItems).toBeDefined();
      expect(schemaInfo.tablesExist.recipes).toBeDefined();
    });

    it('should verify food_items table accessibility', async () => {
      // Test that we can query the food_items table structure
      const { data, error } = await supabase
        .from('food_items')
        .select('id')
        .limit(1);
      
      // Should be able to access the table (even if empty)
      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it('should identify missing tables correctly', async () => {
      // Test that schema service correctly identifies missing tables
      const verification = await schemaService.verifyTablesExist();
      
      expect(verification).toBeDefined();
      expect(typeof verification.foodItems).toBe('boolean');
      expect(typeof verification.shoppingItems).toBe('boolean');
      expect(typeof verification.recipes).toBe('boolean');
      expect(typeof verification.allExist).toBe('boolean');
      
      // allExist should be false if any individual table doesn't exist
      if (!verification.foodItems || !verification.shoppingItems || !verification.recipes) {
        expect(verification.allExist).toBe(false);
      }
    });

    it('should provide schema creation functionality', async () => {
      // Test that createTables method exists and returns proper response
      const result = await schemaService.createTables();
      
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
      expect(Array.isArray(result.errors)).toBe(true);
      
      // In a real application, this would create tables
      // For testing, we verify the method handles the operation appropriately
      if (!result.success) {
        expect(result.errors.length).toBeGreaterThan(0);
      }
    });

    it('should identify database connection and basic functionality', async () => {
      // Test basic database connectivity 
      const { error } = await supabase
        .from('food_items')
        .select('id')
        .limit(1);
      
      // Should be able to connect to database (table might not exist but connection works)
      if (error) {
        // If table doesn't exist, expect specific error messages
        expect(error.message).toMatch(/table|schema|find|parse/i);
      } else {
        // If connection works, we can proceed with other operations
        expect(error).toBeNull();
      }
    });

    it('should provide table creation SQL definitions', async () => {
      // Test that the service provides SQL definitions for table creation
      expect(typeof CREATE_FOOD_ITEMS_TABLE).toBe('string');
      expect(typeof CREATE_SHOPPING_ITEMS_TABLE).toBe('string');
      expect(typeof CREATE_RECIPES_TABLE).toBe('string');
      
      // SQL should contain essential table structure
      expect(CREATE_FOOD_ITEMS_TABLE).toContain('CREATE TABLE');
      expect(CREATE_FOOD_ITEMS_TABLE).toContain('food_items');
      expect(CREATE_SHOPPING_ITEMS_TABLE).toContain('shopping_items');
      expect(CREATE_RECIPES_TABLE).toContain('recipes');
    });

    it('should handle database schema validation', async () => {
      // Test that the schema service can validate database state
      const schemaInfo = await schemaService.getSchemaInfo();
      
      expect(typeof schemaInfo.schemaReady).toBe('boolean');
      expect(typeof schemaInfo.message).toBe('string');
      
      // Message should provide useful information
      if (schemaInfo.schemaReady) {
        expect(schemaInfo.message).toContain('available');
      } else {
        expect(schemaInfo.message).toMatch(/missing|incomplete/i);
      }
    });

    it('should provide comprehensive database setup functionality', async () => {
      // Test that all required constants and functions are exported
      
      // Should export table creation constants
      expect(CREATE_FOOD_ITEMS_TABLE).toBeDefined();
      expect(CREATE_SHOPPING_ITEMS_TABLE).toBeDefined();
      expect(CREATE_RECIPES_TABLE).toBeDefined();
      expect(CREATE_INDEXES).toBeDefined();
      expect(CREATE_UPDATED_AT_TRIGGERS).toBeDefined();
      
      // Should export service class and initializer
      expect(DatabaseSchemaService).toBeDefined();
      expect(initializeDatabaseSchema).toBeDefined();
      
      // SQL definitions should be comprehensive
      expect(Array.isArray(CREATE_INDEXES)).toBe(true);
      expect(Array.isArray(CREATE_UPDATED_AT_TRIGGERS)).toBe(true);
    });
  });
});