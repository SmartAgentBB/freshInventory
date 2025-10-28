import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { CookingScreen } from '../src/screens/CookingScreen';
import { AIService } from '../src/services/AIService';

// Mock dependencies
jest.mock('@react-navigation/native', () => ({
  useIsFocused: jest.fn(() => true),
  useRoute: jest.fn(() => ({ params: {} })),
  useNavigation: jest.fn(() => ({
    navigate: jest.fn(),
  })),
}));

jest.mock('../src/hooks/useAuth', () => ({
  useAuth: jest.fn(() => ({
    user: { id: 'test-user-id' },
  })),
}));

jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(() => ({
    t: (key: string) => key,
    i18n: { language: 'ko' },
  })),
}));

jest.mock('../src/services/supabaseClient', () => ({
  supabaseClient: {
    channel: jest.fn(() => ({
      on: jest.fn(() => ({
        subscribe: jest.fn(() => ({
          unsubscribe: jest.fn(),
        })),
      })),
    })),
  },
}));

jest.mock('../src/services/RecipeService', () => ({
  recipeService: {
    getBookmarkedRecipes: jest.fn(() => Promise.resolve([])),
    toggleBookmark: jest.fn(() => Promise.resolve({ success: true, bookmarked: true })),
  },
}));

jest.mock('../src/services/InventoryService', () => ({
  InventoryService: jest.fn().mockImplementation(() => ({
    getCookingIngredients: jest.fn(() => Promise.resolve([])),
  })),
}));

describe('CookingScreen', () => {
  it('should render without crashing', async () => {
    const { getByText } = render(<CookingScreen />);

    await waitFor(() => {
      // Check if the tab buttons are rendered
      expect(getByText('tabs.bookmarks')).toBeTruthy();
      expect(getByText('tabs.recommend')).toBeTruthy();
    });
  });

  it('should handle null AI service gracefully', async () => {
    // Mock AIService to return null
    jest.mock('../src/services/AIService', () => ({
      AIService: jest.fn(() => null),
    }));

    const { getByText } = render(<CookingScreen />);

    await waitFor(() => {
      expect(getByText('tabs.recommend')).toBeTruthy();
    });
  });

  it('should handle errors in loadIngredients gracefully', async () => {
    // Mock InventoryService to throw error
    const mockInventoryService = require('../src/services/InventoryService');
    mockInventoryService.InventoryService.mockImplementation(() => ({
      getCookingIngredients: jest.fn(() => Promise.reject(new Error('Test error'))),
    }));

    const { queryByText } = render(<CookingScreen />);

    await waitFor(() => {
      // Should not crash and should show tabs
      expect(queryByText('tabs.bookmarks')).toBeTruthy();
    });
  });
});

describe('AIService', () => {
  it('should handle missing API key gracefully', () => {
    // Remove API key from environment
    const originalKey = process.env.EXPO_PUBLIC_GOOGLE_GENERATIVE_AI_KEY;
    delete process.env.EXPO_PUBLIC_GOOGLE_GENERATIVE_AI_KEY;
    delete process.env.GOOGLE_GENERATIVE_AI_KEY;

    // Should not throw error
    const service = new AIService();
    expect(service).toBeDefined();

    // Restore API key
    process.env.EXPO_PUBLIC_GOOGLE_GENERATIVE_AI_KEY = originalKey;
  });

  it('should return error when model is not initialized', async () => {
    const service = new AIService();
    // Force model to be null
    (service as any).model = null;
    (service as any).genAI = null;

    const result = await service.generateRecipeSuggestions(['test']);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.recipes).toEqual([]);
  });

  it('should handle malformed ingredient data', async () => {
    const service = new AIService();

    // Test with null/undefined values
    const result1 = await service.generateRecipeSuggestions(null as any);
    expect(result1.success).toBe(false);

    const result2 = await service.generateRecipeSuggestions(undefined as any);
    expect(result2.success).toBe(false);

    const result3 = await service.generateRecipeSuggestions([]);
    expect(result3.success).toBe(false);
  });
});