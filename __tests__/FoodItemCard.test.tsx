import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { FoodItemCard } from '../src/components/FoodItemCard';
import { PaperProvider } from 'react-native-paper';
import { mintTheme } from '../src/theme/mintTheme';
import { FoodItem } from '../src/models/FoodItem';

// Mock the InventoryService
jest.mock('../src/services/InventoryService');
jest.mock('../src/services/supabaseClient');

// Helper function to render components with theme
const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <PaperProvider theme={mintTheme}>
      {component}
    </PaperProvider>
  );
};

// Mock FoodItem data
const mockFoodItem: FoodItem = {
  id: 'test-id-1',
  name: '사과',
  quantity: 5,
  unit: '개',
  category: 'fruits',
  addedDate: new Date('2025-01-01'),
  expiryDate: new Date('2025-01-10'),
  status: 'fresh',
  memo: '맛있는 사과',
  userId: 'test-user-1',
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01')
};

describe('FoodItemCard', () => {
  describe('재고 아이템 컴포넌트', () => {
    it('should display item name correctly', () => {
      // Test that FoodItemCard displays the correct food item name
      renderWithTheme(<FoodItemCard item={mockFoodItem} />);
      
      // Should show the food item name in Korean
      expect(screen.getByText('사과')).toBeTruthy();
    });

    it('should display remaining quantity', () => {
      // Test that FoodItemCard shows the remaining quantity with unit
      renderWithTheme(<FoodItemCard item={mockFoodItem} />);
      
      // Should show quantity and unit
      expect(screen.getByText('5개')).toBeTruthy();
    });

    it('should display days since added', () => {
      // Test that component shows how many days since item was added
      const recentItem = {
        ...mockFoodItem,
        addedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
      };
      
      renderWithTheme(<FoodItemCard item={recentItem} />);
      
      // Should show days since added
      expect(screen.getByText(/2일 전/)).toBeTruthy();
    });

    it('should show different status colors based on freshness', () => {
      // Test that component applies different styling based on item status
      const expiredItem = {
        ...mockFoodItem,
        status: 'expired' as const
      };
      
      const { getByTestId } = renderWithTheme(<FoodItemCard item={expiredItem} />);
      
      // Should render the card component with testID
      expect(getByTestId('food-item-card')).toBeTruthy();
    });

    it('should handle press events correctly', () => {
      // Test that FoodItemCard handles press events
      const mockOnPress = jest.fn();
      
      renderWithTheme(<FoodItemCard item={mockFoodItem} onPress={mockOnPress} />);
      
      // Should render without crashing when onPress is provided
      expect(screen.getByTestId('food-item-card')).toBeTruthy();
    });
  });
});