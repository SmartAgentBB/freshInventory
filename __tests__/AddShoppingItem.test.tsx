import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { AddShoppingItemForm } from '../src/components/AddShoppingItemForm';
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

// Mock existing shopping items for duplicate checking
const mockExistingItems: ShoppingItem[] = [
  {
    id: 'existing-1',
    name: '사과',
    memo: '빨간 사과',
    todo: true,
    userId: 'test-user-1',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01')
  },
  {
    id: 'existing-2',
    name: '우유',
    memo: '저지방 우유',
    todo: false,
    userId: 'test-user-1',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-02')
  }
];

describe('AddShoppingItemForm - 새 쇼핑 항목 추가', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock ShoppingService
    const mockShoppingService = {
      addItem: jest.fn(() => Promise.resolve({ 
        id: 'new-item-1',
        name: '새 아이템',
        memo: '메모',
        todo: true,
        userId: 'test-user-1',
        createdAt: new Date(),
        updatedAt: new Date()
      })),
      getItems: jest.fn(() => Promise.resolve(mockExistingItems))
    };

    const { ShoppingService } = require('../src/services/ShoppingService');
    ShoppingService.mockImplementation(() => mockShoppingService);
  });

  describe('Form rendering', () => {
    it('should render add shopping item form', () => {
      // Test that the form renders with all necessary fields
      renderWithTheme(<AddShoppingItemForm />);
      
      // Should have form title
      expect(screen.getByText('새 쇼핑 항목 추가')).toBeTruthy();
      
      // Should have item name input
      expect(screen.getByPlaceholderText('쇼핑 항목 이름')).toBeTruthy();
      
      // Should have memo input
      expect(screen.getByPlaceholderText('메모 (선택사항)')).toBeTruthy();
      
      // Should have add button
      expect(screen.getByText('추가하기')).toBeTruthy();
    });

    it('should have proper input field labels', () => {
      // Test that input fields have proper Korean labels
      renderWithTheme(<AddShoppingItemForm />);
      
      // Check for input labels/placeholders
      expect(screen.getByPlaceholderText('쇼핑 항목 이름')).toBeTruthy();
      expect(screen.getByPlaceholderText('메모 (선택사항)')).toBeTruthy();
    });
  });

  describe('Form validation', () => {
    it('should validate item name is not empty', async () => {
      // Test that empty item name shows validation error
      const mockOnAdd = jest.fn();
      
      renderWithTheme(<AddShoppingItemForm onAdd={mockOnAdd} />);
      
      // Try to submit without entering item name
      const addButton = screen.getByText('추가하기');
      fireEvent.press(addButton);
      
      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText('항목 이름을 입력해주세요')).toBeTruthy();
      });
      
      // Should not call onAdd
      expect(mockOnAdd).not.toHaveBeenCalled();
    });

    it('should prevent adding duplicate items (show warning)', async () => {
      // Test duplicate item prevention
      const mockOnAdd = jest.fn();
      
      renderWithTheme(
        <AddShoppingItemForm 
          onAdd={mockOnAdd}
          existingItems={mockExistingItems}
        />
      );
      
      // Enter existing item name
      const nameInput = screen.getByPlaceholderText('쇼핑 항목 이름');
      fireEvent.changeText(nameInput, '사과');
      
      // Try to add duplicate item
      const addButton = screen.getByText('추가하기');
      fireEvent.press(addButton);
      
      // Should show duplicate warning
      await waitFor(() => {
        expect(screen.getByText('이미 목록에 있는 항목입니다')).toBeTruthy();
      });
      
      // Should not call onAdd
      expect(mockOnAdd).not.toHaveBeenCalled();
    });

    it('should allow adding items with same name if previous is completed', async () => {
      // Test that completed items don't prevent adding same name
      const mockOnAdd = jest.fn();
      
      renderWithTheme(
        <AddShoppingItemForm 
          onAdd={mockOnAdd}
          existingItems={mockExistingItems}
        />
      );
      
      // Enter name that exists but is completed (우유)
      const nameInput = screen.getByPlaceholderText('쇼핑 항목 이름');
      fireEvent.changeText(nameInput, '우유');
      
      const memoInput = screen.getByPlaceholderText('메모 (선택사항)');
      fireEvent.changeText(memoInput, '새로운 우유');
      
      // Should be able to add
      const addButton = screen.getByText('추가하기');
      fireEvent.press(addButton);
      
      // Should call onAdd
      await waitFor(() => {
        expect(mockOnAdd).toHaveBeenCalledWith({
          name: '우유',
          memo: '새로운 우유'
        });
      });
    });
  });

  describe('Form submission', () => {
    it('should add new shopping item successfully', async () => {
      // Test successful item addition
      const mockOnAdd = jest.fn();
      
      renderWithTheme(<AddShoppingItemForm onAdd={mockOnAdd} />);
      
      // Fill in form
      const nameInput = screen.getByPlaceholderText('쇼핑 항목 이름');
      fireEvent.changeText(nameInput, '바나나');
      
      const memoInput = screen.getByPlaceholderText('메모 (선택사항)');
      fireEvent.changeText(memoInput, '노란 바나나 5개');
      
      // Submit form
      const addButton = screen.getByText('추가하기');
      fireEvent.press(addButton);
      
      // Should call onAdd with correct data
      await waitFor(() => {
        expect(mockOnAdd).toHaveBeenCalledWith({
          name: '바나나',
          memo: '노란 바나나 5개'
        });
      });
    });

    it('should add item without memo', async () => {
      // Test adding item with only name (memo is optional)
      const mockOnAdd = jest.fn();
      
      renderWithTheme(<AddShoppingItemForm onAdd={mockOnAdd} />);
      
      // Fill in only name
      const nameInput = screen.getByPlaceholderText('쇼핑 항목 이름');
      fireEvent.changeText(nameInput, '토마토');
      
      // Submit form
      const addButton = screen.getByText('추가하기');
      fireEvent.press(addButton);
      
      // Should call onAdd with name and empty memo
      await waitFor(() => {
        expect(mockOnAdd).toHaveBeenCalledWith({
          name: '토마토',
          memo: ''
        });
      });
    });

    it('should clear form after successful submission', async () => {
      // Test that form clears after adding item
      const mockOnAdd = jest.fn();
      
      renderWithTheme(<AddShoppingItemForm onAdd={mockOnAdd} />);
      
      // Fill in form
      const nameInput = screen.getByPlaceholderText('쇼핑 항목 이름');
      const memoInput = screen.getByPlaceholderText('메모 (선택사항)');
      
      fireEvent.changeText(nameInput, '오렌지');
      fireEvent.changeText(memoInput, '달콤한 오렌지');
      
      // Submit form
      const addButton = screen.getByText('추가하기');
      fireEvent.press(addButton);
      
      // Form should clear
      await waitFor(() => {
        expect(nameInput.props.value).toBe('');
        expect(memoInput.props.value).toBe('');
      });
    });

    it('should handle submission without callback', () => {
      // Test that form doesn't crash when no callback is provided
      renderWithTheme(<AddShoppingItemForm />);
      
      const nameInput = screen.getByPlaceholderText('쇼핑 항목 이름');
      fireEvent.changeText(nameInput, '포도');
      
      const addButton = screen.getByText('추가하기');
      
      // Should not crash
      expect(() => fireEvent.press(addButton)).not.toThrow();
    });
  });

  describe('User experience', () => {
    it('should show loading state during submission', async () => {
      // Test loading state during form submission
      const mockOnAdd = jest.fn(() => new Promise(resolve => setTimeout(resolve, 50)));
      
      renderWithTheme(<AddShoppingItemForm onAdd={mockOnAdd} />);
      
      // Fill and submit form
      const nameInput = screen.getByPlaceholderText('쇼핑 항목 이름');
      fireEvent.changeText(nameInput, '키위');
      
      const addButton = screen.getByText('추가하기');
      fireEvent.press(addButton);
      
      // Should show loading state
      expect(screen.getByText('추가 중...')).toBeTruthy();
      
      // Should hide loading after completion
      await waitFor(() => {
        expect(screen.getByText('추가하기')).toBeTruthy();
      }, { timeout: 3000 });
    });
  });
});