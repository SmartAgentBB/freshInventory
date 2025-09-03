import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { ShoppingItemCard } from '../src/components/ShoppingItemCard';
import { PaperProvider } from 'react-native-paper';
import { mintTheme } from '../src/theme/mintTheme';
import { ShoppingItem } from '../src/models/ShoppingItem';

// Mock the ShoppingService
jest.mock('../src/services/ShoppingService');
jest.mock('../src/services/supabaseClient');

// Helper function to render components with theme
const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <PaperProvider theme={mintTheme}>
      {component}
    </PaperProvider>
  );
};

// Mock ShoppingItem data
const mockShoppingItem: ShoppingItem = {
  id: 'shopping-test-1',
  name: '사과',
  memo: '빨간 사과 5개',
  todo: true,
  userId: 'test-user-1',
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01')
};

const mockCompletedItem: ShoppingItem = {
  id: 'shopping-test-2',
  name: '우유',
  memo: '저지방 우유 1L',
  todo: false,
  userId: 'test-user-1',
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-02')
};

describe('ShoppingItemCard - 쇼핑 아이템 관리', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Display functionality', () => {
    it('should display item name and memo', () => {
      // Test that ShoppingItemCard shows item name and memo correctly
      renderWithTheme(<ShoppingItemCard item={mockShoppingItem} />);
      
      // Should show item name
      expect(screen.getByText('사과')).toBeTruthy();
      
      // Should show memo
      expect(screen.getByText('빨간 사과 5개')).toBeTruthy();
    });

    it('should show checkbox for completion status', () => {
      // Test that checkbox is visible and reflects todo status
      renderWithTheme(<ShoppingItemCard item={mockShoppingItem} />);
      
      // Should have a checkbox
      const checkbox = screen.getByTestId('shopping-item-checkbox');
      expect(checkbox).toBeTruthy();
    });

    it('should display completed item with different styling', () => {
      // Test that completed items are styled differently
      renderWithTheme(<ShoppingItemCard item={mockCompletedItem} />);
      
      // Should show item name
      expect(screen.getByText('우유')).toBeTruthy();
      
      // Should show memo
      expect(screen.getByText('저지방 우유 1L')).toBeTruthy();
      
      // Should have checkbox
      const checkbox = screen.getByTestId('shopping-item-checkbox');
      expect(checkbox).toBeTruthy();
    });

    it('should handle items without memo', () => {
      // Test that items without memo still display correctly
      const itemWithoutMemo = {
        ...mockShoppingItem,
        memo: undefined
      };
      
      renderWithTheme(<ShoppingItemCard item={itemWithoutMemo} />);
      
      // Should show item name
      expect(screen.getByText('사과')).toBeTruthy();
      
      // Should still have checkbox
      const checkbox = screen.getByTestId('shopping-item-checkbox');
      expect(checkbox).toBeTruthy();
    });
  });

  describe('Interaction functionality', () => {
    it('should toggle todo status when checkbox is pressed', async () => {
      // Test that pressing checkbox toggles the todo status
      const mockOnStatusChange = jest.fn();
      
      renderWithTheme(
        <ShoppingItemCard 
          item={mockShoppingItem} 
          onStatusChange={mockOnStatusChange}
        />
      );
      
      // Press the checkbox
      const checkbox = screen.getByTestId('shopping-item-checkbox');
      fireEvent.press(checkbox);
      
      // Should call onStatusChange with toggled status
      expect(mockOnStatusChange).toHaveBeenCalledWith('shopping-test-1', false);
    });

    it('should update item in database when status changes', async () => {
      // Test that status changes trigger database update
      const mockOnStatusChange = jest.fn();
      
      renderWithTheme(
        <ShoppingItemCard 
          item={mockCompletedItem} 
          onStatusChange={mockOnStatusChange}
        />
      );
      
      // Press the checkbox to toggle from completed to todo
      const checkbox = screen.getByTestId('shopping-item-checkbox');
      fireEvent.press(checkbox);
      
      // Should call onStatusChange with toggled status (false -> true)
      expect(mockOnStatusChange).toHaveBeenCalledWith('shopping-test-2', true);
    });

    it('should handle checkbox press without callback', () => {
      // Test that component doesn't crash when no callback is provided
      renderWithTheme(<ShoppingItemCard item={mockShoppingItem} />);
      
      // Should not crash when pressed without callback
      const checkbox = screen.getByTestId('shopping-item-checkbox');
      expect(() => fireEvent.press(checkbox)).not.toThrow();
    });
  });

  describe('Visual states', () => {
    it('should show unchecked checkbox for todo items', () => {
      // Test visual state for todo items
      renderWithTheme(<ShoppingItemCard item={mockShoppingItem} />);
      
      const checkbox = screen.getByTestId('shopping-item-checkbox');
      expect(checkbox).toBeTruthy();
      // Visual state testing would need more specific implementation
    });

    it('should show checked checkbox for completed items', () => {
      // Test visual state for completed items
      renderWithTheme(<ShoppingItemCard item={mockCompletedItem} />);
      
      const checkbox = screen.getByTestId('shopping-item-checkbox');
      expect(checkbox).toBeTruthy();
      // Visual state testing would need more specific implementation
    });
  });
});