import { FoodItem } from '../src/models/FoodItem';
import { ShoppingItem } from '../src/models/ShoppingItem';
import { Recipe } from '../src/models/Recipe';

describe('Database Models', () => {
  describe('FoodItem model should have correct TypeScript interface', () => {
    it('should have correct required properties', () => {
      // Test that FoodItem interface has all required properties
      const mockFoodItem: FoodItem = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Apple',
        quantity: 5,
        unit: 'pieces',
        category: 'fruits',
        addedDate: new Date('2023-01-15T10:00:00Z'),
        expiryDate: new Date('2023-01-25T10:00:00Z'),
        status: 'fresh',
        memo: 'Red apples from the market',
        userId: 'user123',
        createdAt: new Date('2023-01-15T10:00:00Z'),
        updatedAt: new Date('2023-01-15T10:00:00Z')
      };

      // Test that all required properties exist
      expect(mockFoodItem.id).toBeDefined();
      expect(mockFoodItem.name).toBeDefined();
      expect(mockFoodItem.quantity).toBeDefined();
      expect(mockFoodItem.unit).toBeDefined();
      expect(mockFoodItem.category).toBeDefined();
      expect(mockFoodItem.addedDate).toBeDefined();
      expect(mockFoodItem.expiryDate).toBeDefined();
      expect(mockFoodItem.status).toBeDefined();
      expect(mockFoodItem.userId).toBeDefined();
      expect(mockFoodItem.createdAt).toBeDefined();
      expect(mockFoodItem.updatedAt).toBeDefined();
    });

    it('should have correct data types for all properties', () => {
      const mockFoodItem: FoodItem = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Apple',
        quantity: 5,
        unit: 'pieces',
        category: 'fruits',
        addedDate: new Date(),
        expiryDate: new Date(),
        status: 'fresh',
        memo: 'Test memo',
        userId: 'user123',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Test data types
      expect(typeof mockFoodItem.id).toBe('string');
      expect(typeof mockFoodItem.name).toBe('string');
      expect(typeof mockFoodItem.quantity).toBe('number');
      expect(typeof mockFoodItem.unit).toBe('string');
      expect(typeof mockFoodItem.category).toBe('string');
      expect(mockFoodItem.addedDate).toBeInstanceOf(Date);
      expect(mockFoodItem.expiryDate).toBeInstanceOf(Date);
      expect(typeof mockFoodItem.status).toBe('string');
      expect(typeof mockFoodItem.memo).toBe('string');
      expect(typeof mockFoodItem.userId).toBe('string');
      expect(mockFoodItem.createdAt).toBeInstanceOf(Date);
      expect(mockFoodItem.updatedAt).toBeInstanceOf(Date);
    });

    it('should support valid status values', () => {
      // Test that status accepts valid enum values
      const validStatuses: Array<FoodItem['status']> = [
        'fresh',
        'expired',
        'consumed',
        'frozen',
        'disposed'
      ];

      validStatuses.forEach(status => {
        const mockFoodItem: FoodItem = {
          id: '123',
          name: 'Test',
          quantity: 1,
          unit: 'piece',
          category: 'other',
          addedDate: new Date(),
          expiryDate: new Date(),
          status: status,
          memo: '',
          userId: 'user123',
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        expect(mockFoodItem.status).toBe(status);
      });
    });

    it('should support common categories', () => {
      // Test that category accepts common food categories
      const validCategories: Array<FoodItem['category']> = [
        'fruits',
        'vegetables',
        'meat',
        'dairy',
        'grains',
        'beverages',
        'condiments',
        'frozen',
        'other'
      ];

      validCategories.forEach(category => {
        const mockFoodItem: FoodItem = {
          id: '123',
          name: 'Test',
          quantity: 1,
          unit: 'piece',
          category: category,
          addedDate: new Date(),
          expiryDate: new Date(),
          status: 'fresh',
          memo: '',
          userId: 'user123',
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        expect(mockFoodItem.category).toBe(category);
      });
    });

    it('should support optional properties correctly', () => {
      // Test that memo can be optional/nullable
      const mockFoodItemWithoutMemo: Partial<FoodItem> = {
        id: '123',
        name: 'Test',
        quantity: 1,
        unit: 'piece',
        category: 'fruits',
        addedDate: new Date(),
        expiryDate: new Date(),
        status: 'fresh',
        userId: 'user123',
        createdAt: new Date(),
        updatedAt: new Date()
        // memo is optional
      };

      expect(mockFoodItemWithoutMemo.memo).toBeUndefined();
    });
  });

  describe('ShoppingItem model should have correct TypeScript interface', () => {
    it('should have correct required properties', () => {
      // Test that ShoppingItem interface has all required properties
      const mockShoppingItem: ShoppingItem = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Milk',
        quantity: 2,
        unit: 'liters',
        category: 'dairy',
        priority: 'normal',
        todo: true,
        memo: 'Get organic milk',
        store: 'Supermarket',
        price: 4.50,
        userId: 'user123',
        createdAt: new Date('2023-01-15T10:00:00Z'),
        updatedAt: new Date('2023-01-15T10:00:00Z'),
        completedAt: null
      };

      // Test that all required properties exist
      expect(mockShoppingItem.id).toBeDefined();
      expect(mockShoppingItem.name).toBeDefined();
      expect(mockShoppingItem.quantity).toBeDefined();
      expect(mockShoppingItem.unit).toBeDefined();
      expect(mockShoppingItem.category).toBeDefined();
      expect(mockShoppingItem.priority).toBeDefined();
      expect(mockShoppingItem.todo).toBeDefined();
      expect(mockShoppingItem.userId).toBeDefined();
      expect(mockShoppingItem.createdAt).toBeDefined();
      expect(mockShoppingItem.updatedAt).toBeDefined();
      expect(mockShoppingItem.completedAt).toBeDefined();
    });

    it('should have correct data types for all properties', () => {
      const mockShoppingItem: ShoppingItem = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Bread',
        quantity: 1,
        unit: 'loaf',
        category: 'grains',
        priority: 'high',
        todo: false,
        memo: 'Whole wheat bread',
        store: 'Bakery',
        price: 3.25,
        userId: 'user123',
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: new Date()
      };

      // Test data types
      expect(typeof mockShoppingItem.id).toBe('string');
      expect(typeof mockShoppingItem.name).toBe('string');
      expect(typeof mockShoppingItem.quantity).toBe('number');
      expect(typeof mockShoppingItem.unit).toBe('string');
      expect(typeof mockShoppingItem.category).toBe('string');
      expect(typeof mockShoppingItem.priority).toBe('string');
      expect(typeof mockShoppingItem.todo).toBe('boolean');
      expect(typeof mockShoppingItem.memo).toBe('string');
      expect(typeof mockShoppingItem.store).toBe('string');
      expect(typeof mockShoppingItem.price).toBe('number');
      expect(typeof mockShoppingItem.userId).toBe('string');
      expect(mockShoppingItem.createdAt).toBeInstanceOf(Date);
      expect(mockShoppingItem.updatedAt).toBeInstanceOf(Date);
      expect(mockShoppingItem.completedAt).toBeInstanceOf(Date);
    });

    it('should support valid priority values', () => {
      // Test that priority accepts valid enum values
      const validPriorities: Array<ShoppingItem['priority']> = [
        'low',
        'normal',
        'high',
        'urgent'
      ];

      validPriorities.forEach(priority => {
        const mockShoppingItem: ShoppingItem = {
          id: '123',
          name: 'Test Item',
          quantity: 1,
          unit: 'piece',
          category: 'other',
          priority: priority,
          todo: true,
          memo: '',
          store: '',
          price: 0,
          userId: 'user123',
          createdAt: new Date(),
          updatedAt: new Date(),
          completedAt: null
        };
        
        expect(mockShoppingItem.priority).toBe(priority);
      });
    });

    it('should support common shopping categories', () => {
      // Test that category accepts common shopping categories  
      const validCategories: Array<ShoppingItem['category']> = [
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
      ];

      validCategories.forEach(category => {
        const mockShoppingItem: ShoppingItem = {
          id: '123',
          name: 'Test Item',
          quantity: 1,
          unit: 'piece',
          category: category,
          priority: 'normal',
          todo: true,
          memo: '',
          store: '',
          price: 0,
          userId: 'user123',
          createdAt: new Date(),
          updatedAt: new Date(),
          completedAt: null
        };
        
        expect(mockShoppingItem.category).toBe(category);
      });
    });

    it('should support todo status and completion tracking', () => {
      // Test todo item
      const todoItem: ShoppingItem = {
        id: '123',
        name: 'Eggs',
        quantity: 1,
        unit: 'dozen',
        category: 'dairy',
        priority: 'normal',
        todo: true,
        memo: '',
        store: '',
        price: 0,
        userId: 'user123',
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: null
      };

      expect(todoItem.todo).toBe(true);
      expect(todoItem.completedAt).toBeNull();

      // Test completed item
      const completedItem: ShoppingItem = {
        id: '456',
        name: 'Butter',
        quantity: 1,
        unit: 'pack',
        category: 'dairy',
        priority: 'low',
        todo: false,
        memo: '',
        store: 'Grocery Store',
        price: 2.50,
        userId: 'user123',
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: new Date()
      };

      expect(completedItem.todo).toBe(false);
      expect(completedItem.completedAt).toBeInstanceOf(Date);
    });

    it('should support optional properties correctly', () => {
      // Test that optional fields can be undefined/null
      const mockShoppingItemMinimal: Partial<ShoppingItem> = {
        id: '123',
        name: 'Test Item',
        quantity: 1,
        unit: 'piece',
        category: 'other',
        priority: 'normal',
        todo: true,
        userId: 'user123',
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: null
        // memo, store, price are optional
      };

      expect(mockShoppingItemMinimal.memo).toBeUndefined();
      expect(mockShoppingItemMinimal.store).toBeUndefined();
      expect(mockShoppingItemMinimal.price).toBeUndefined();
    });
  });

  describe('Recipe model should have correct TypeScript interface', () => {
    it('should have correct required properties', () => {
      // Test that Recipe interface has all required properties
      const mockRecipe: Recipe = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Korean Kimchi Fried Rice',
        description: 'Delicious fried rice made with kimchi and vegetables',
        difficulty: 'easy',
        cookingTime: 25,
        servings: 4,
        ingredients: [
          { name: 'Rice', quantity: 2, unit: 'cups', required: true },
          { name: 'Kimchi', quantity: 1, unit: 'cup', required: true },
          { name: 'Egg', quantity: 2, unit: 'pieces', required: false }
        ],
        instructions: [
          'Heat oil in a large pan',
          'Add rice and stir-fry for 3 minutes',
          'Add kimchi and cook for 5 minutes',
          'Crack eggs and scramble with rice'
        ],
        tags: ['korean', 'rice', 'vegetarian'],
        category: 'main-dish',
        cuisine: 'korean',
        isBookmarked: false,
        rating: 4.5,
        reviewCount: 12,
        userId: 'user123',
        createdAt: new Date('2023-01-15T10:00:00Z'),
        updatedAt: new Date('2023-01-15T10:00:00Z')
      };

      // Test that all required properties exist
      expect(mockRecipe.id).toBeDefined();
      expect(mockRecipe.title).toBeDefined();
      expect(mockRecipe.description).toBeDefined();
      expect(mockRecipe.difficulty).toBeDefined();
      expect(mockRecipe.cookingTime).toBeDefined();
      expect(mockRecipe.servings).toBeDefined();
      expect(mockRecipe.ingredients).toBeDefined();
      expect(mockRecipe.instructions).toBeDefined();
      expect(mockRecipe.tags).toBeDefined();
      expect(mockRecipe.category).toBeDefined();
      expect(mockRecipe.cuisine).toBeDefined();
      expect(mockRecipe.isBookmarked).toBeDefined();
      expect(mockRecipe.userId).toBeDefined();
      expect(mockRecipe.createdAt).toBeDefined();
      expect(mockRecipe.updatedAt).toBeDefined();
    });

    it('should have correct data types for all properties', () => {
      const mockRecipe: Recipe = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Pasta Carbonara',
        description: 'Classic Italian pasta dish',
        difficulty: 'medium',
        cookingTime: 20,
        servings: 2,
        ingredients: [
          { name: 'Pasta', quantity: 200, unit: 'g', required: true }
        ],
        instructions: ['Boil pasta', 'Mix with sauce'],
        tags: ['italian', 'pasta'],
        category: 'main-dish',
        cuisine: 'italian',
        isBookmarked: true,
        rating: 4.8,
        reviewCount: 25,
        userId: 'user123',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Test data types
      expect(typeof mockRecipe.id).toBe('string');
      expect(typeof mockRecipe.title).toBe('string');
      expect(typeof mockRecipe.description).toBe('string');
      expect(typeof mockRecipe.difficulty).toBe('string');
      expect(typeof mockRecipe.cookingTime).toBe('number');
      expect(typeof mockRecipe.servings).toBe('number');
      expect(Array.isArray(mockRecipe.ingredients)).toBe(true);
      expect(Array.isArray(mockRecipe.instructions)).toBe(true);
      expect(Array.isArray(mockRecipe.tags)).toBe(true);
      expect(typeof mockRecipe.category).toBe('string');
      expect(typeof mockRecipe.cuisine).toBe('string');
      expect(typeof mockRecipe.isBookmarked).toBe('boolean');
      expect(typeof mockRecipe.rating).toBe('number');
      expect(typeof mockRecipe.reviewCount).toBe('number');
      expect(typeof mockRecipe.userId).toBe('string');
      expect(mockRecipe.createdAt).toBeInstanceOf(Date);
      expect(mockRecipe.updatedAt).toBeInstanceOf(Date);
    });

    it('should support valid difficulty levels', () => {
      // Test that difficulty accepts valid enum values
      const validDifficulties: Array<Recipe['difficulty']> = [
        'easy',
        'medium', 
        'hard'
      ];

      validDifficulties.forEach(difficulty => {
        const mockRecipe: Recipe = {
          id: '123',
          title: 'Test Recipe',
          description: 'Test description',
          difficulty: difficulty,
          cookingTime: 10,
          servings: 1,
          ingredients: [],
          instructions: [],
          tags: [],
          category: 'appetizer',
          cuisine: 'other',
          isBookmarked: false,
          rating: 0,
          reviewCount: 0,
          userId: 'user123',
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        expect(mockRecipe.difficulty).toBe(difficulty);
      });
    });

    it('should support recipe categories', () => {
      // Test that category accepts valid recipe categories
      const validCategories: Array<Recipe['category']> = [
        'appetizer',
        'main-dish',
        'dessert',
        'beverage',
        'soup',
        'salad',
        'snack',
        'other'
      ];

      validCategories.forEach(category => {
        const mockRecipe: Recipe = {
          id: '123',
          title: 'Test Recipe',
          description: 'Test description', 
          difficulty: 'easy',
          cookingTime: 10,
          servings: 1,
          ingredients: [],
          instructions: [],
          tags: [],
          category: category,
          cuisine: 'other',
          isBookmarked: false,
          rating: 0,
          reviewCount: 0,
          userId: 'user123',
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        expect(mockRecipe.category).toBe(category);
      });
    });

    it('should support ingredient structure with required field', () => {
      const mockRecipe: Recipe = {
        id: '123',
        title: 'Test Recipe',
        description: 'Test description',
        difficulty: 'easy',
        cookingTime: 10,
        servings: 1,
        ingredients: [
          { name: 'Sugar', quantity: 100, unit: 'g', required: true },
          { name: 'Salt', quantity: 1, unit: 'tsp', required: false }
        ],
        instructions: ['Mix ingredients'],
        tags: ['sweet'],
        category: 'dessert',
        cuisine: 'other',
        isBookmarked: false,
        rating: 0,
        reviewCount: 0,
        userId: 'user123',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Test ingredient structure
      expect(mockRecipe.ingredients).toHaveLength(2);
      expect(mockRecipe.ingredients[0].name).toBe('Sugar');
      expect(mockRecipe.ingredients[0].quantity).toBe(100);
      expect(mockRecipe.ingredients[0].unit).toBe('g');
      expect(mockRecipe.ingredients[0].required).toBe(true);
      expect(mockRecipe.ingredients[1].required).toBe(false);
    });

    it('should support bookmark functionality', () => {
      // Test bookmarked recipe
      const bookmarkedRecipe: Recipe = {
        id: '123',
        title: 'Bookmarked Recipe',
        description: 'A favorite recipe',
        difficulty: 'easy',
        cookingTime: 15,
        servings: 2,
        ingredients: [],
        instructions: [],
        tags: [],
        category: 'main-dish',
        cuisine: 'korean',
        isBookmarked: true,
        rating: 5.0,
        reviewCount: 50,
        userId: 'user123',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(bookmarkedRecipe.isBookmarked).toBe(true);
      expect(bookmarkedRecipe.rating).toBe(5.0);
      expect(bookmarkedRecipe.reviewCount).toBe(50);

      // Test non-bookmarked recipe
      const normalRecipe: Recipe = {
        id: '456',
        title: 'Normal Recipe',
        description: 'A regular recipe',
        difficulty: 'medium',
        cookingTime: 30,
        servings: 4,
        ingredients: [],
        instructions: [],
        tags: [],
        category: 'soup',
        cuisine: 'italian',
        isBookmarked: false,
        rating: 3.2,
        reviewCount: 8,
        userId: 'user123',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(normalRecipe.isBookmarked).toBe(false);
    });

    it('should support optional properties correctly', () => {
      // Test that optional fields can be undefined
      const mockRecipeMinimal: Partial<Recipe> = {
        id: '123',
        title: 'Minimal Recipe',
        description: 'Basic recipe',
        difficulty: 'easy',
        cookingTime: 5,
        servings: 1,
        ingredients: [],
        instructions: ['Do something'],
        tags: [],
        category: 'snack',
        cuisine: 'other',
        isBookmarked: false,
        userId: 'user123',
        createdAt: new Date(),
        updatedAt: new Date()
        // rating, reviewCount can be optional
      };

      expect(mockRecipeMinimal.rating).toBeUndefined();
      expect(mockRecipeMinimal.reviewCount).toBeUndefined();
    });
  });
});