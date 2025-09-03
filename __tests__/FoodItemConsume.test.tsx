import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
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

describe('FoodItemCard - 재료 수정 및 소비', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Consume functionality', () => {
    it('should update remaining quantity when consume button is pressed', async () => {
      // Test that pressing consume button decreases quantity by 1
      const mockOnQuantityUpdate = jest.fn();
      
      renderWithTheme(
        <FoodItemCard 
          item={mockFoodItem} 
          onQuantityUpdate={mockOnQuantityUpdate}
          showControls={true}
        />
      );
      
      // Should show current quantity
      expect(screen.getByText('5개')).toBeTruthy();
      
      // Should have consume button
      const consumeButton = screen.getByTestId('consume-button');
      expect(consumeButton).toBeTruthy();
      
      // Press consume button
      fireEvent.press(consumeButton);
      
      // Should call onQuantityUpdate with decreased quantity
      expect(mockOnQuantityUpdate).toHaveBeenCalledWith(mockFoodItem.id, 4);
    });

    it('should move item to consumed list when quantity reaches zero', async () => {
      // Test that item is marked as consumed when quantity becomes 0
      const itemWithOneQuantity = {
        ...mockFoodItem,
        quantity: 1
      };
      
      const mockOnQuantityUpdate = jest.fn();
      const mockOnStatusChange = jest.fn();
      
      renderWithTheme(
        <FoodItemCard 
          item={itemWithOneQuantity}
          onQuantityUpdate={mockOnQuantityUpdate}
          onStatusChange={mockOnStatusChange}
          showControls={true}
        />
      );
      
      // Should show quantity 1
      expect(screen.getByText('1개')).toBeTruthy();
      
      // Press consume button
      const consumeButton = screen.getByTestId('consume-button');
      fireEvent.press(consumeButton);
      
      // Should call onStatusChange to mark as consumed when quantity reaches 0
      expect(mockOnStatusChange).toHaveBeenCalledWith(mockFoodItem.id, 'consumed');
    });

    it('should update item to frozen status when freeze button is pressed', async () => {
      // Test that pressing freeze button changes status to frozen
      const mockOnStatusChange = jest.fn();
      
      renderWithTheme(
        <FoodItemCard 
          item={mockFoodItem}
          onStatusChange={mockOnStatusChange}
          showControls={true}
        />
      );
      
      // Should have freeze button
      const freezeButton = screen.getByTestId('freeze-button');
      expect(freezeButton).toBeTruthy();
      
      // Press freeze button
      fireEvent.press(freezeButton);
      
      // Should call onStatusChange with frozen status
      expect(mockOnStatusChange).toHaveBeenCalledWith(mockFoodItem.id, 'frozen');
    });

    it('should move item to disposed list when dispose button is pressed', async () => {
      // Test that pressing dispose button changes status to disposed
      const mockOnStatusChange = jest.fn();
      
      renderWithTheme(
        <FoodItemCard 
          item={mockFoodItem}
          onStatusChange={mockOnStatusChange}
          showControls={true}
        />
      );
      
      // Should have dispose button
      const disposeButton = screen.getByTestId('dispose-button');
      expect(disposeButton).toBeTruthy();
      
      // Press dispose button
      fireEvent.press(disposeButton);
      
      // Should call onStatusChange with disposed status
      expect(mockOnStatusChange).toHaveBeenCalledWith(mockFoodItem.id, 'disposed');
    });

    it('should calculate consumption period correctly', () => {
      // Test that component calculates and displays consumption period
      const consumedItem = {
        ...mockFoodItem,
        status: 'consumed' as const,
        quantity: 0,
        updatedAt: new Date('2025-01-05') // 4 days after creation
      };
      
      renderWithTheme(<FoodItemCard item={consumedItem} />);
      
      // Should show consumption period
      expect(screen.getByText(/4일 동안 소비/)).toBeTruthy();
    });
  });

  describe('Control visibility', () => {
    it('should show controls when showControls is true', () => {
      // Test that control buttons are shown when explicitly enabled
      renderWithTheme(
        <FoodItemCard 
          item={mockFoodItem}
          showControls={true}
        />
      );
      
      // Should have control buttons
      expect(screen.getByTestId('consume-button')).toBeTruthy();
      expect(screen.getByTestId('freeze-button')).toBeTruthy();
      expect(screen.getByTestId('dispose-button')).toBeTruthy();
    });

    it('should hide controls when showControls is false', () => {
      // Test that control buttons are hidden by default
      renderWithTheme(
        <FoodItemCard 
          item={mockFoodItem}
          showControls={false}
        />
      );
      
      // Should not have control buttons
      expect(screen.queryByTestId('consume-button')).toBeFalsy();
      expect(screen.queryByTestId('freeze-button')).toBeFalsy();
      expect(screen.queryByTestId('dispose-button')).toBeFalsy();
    });
  });
});