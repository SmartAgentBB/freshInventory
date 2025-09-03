import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import { ShoppingScreen } from '../src/screens/ShoppingScreen';
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

// Mock shopping items data
const mockShoppingItems: ShoppingItem[] = [
  {
    id: 'shopping-1',
    name: '사과',
    memo: '빨간 사과 5개',
    todo: true,
    userId: 'test-user-1',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01')
  },
  {
    id: 'shopping-2',
    name: '우유',
    memo: '저지방 우유 1L',
    todo: true,
    userId: 'test-user-1',
    createdAt: new Date('2025-01-02'),
    updatedAt: new Date('2025-01-02')
  }
];

const mockCompletedItems: ShoppingItem[] = [
  {
    id: 'shopping-completed-1',
    name: '빵',
    memo: '식빵 1봉지',
    todo: false,
    userId: 'test-user-1',
    createdAt: new Date('2024-12-30'),
    updatedAt: new Date('2025-01-01')
  }
];

describe('ShoppingScreen - 장보기 목록 표시', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock ShoppingService to return different items based on todo status
    const mockShoppingService = {
      getItemsByTodoStatus: jest.fn((userId: string, todo: boolean) => {
        if (todo) {
          return Promise.resolve(mockShoppingItems);
        } else {
          return Promise.resolve(mockCompletedItems);
        }
      }),
      getItems: jest.fn(() => Promise.resolve([...mockShoppingItems, ...mockCompletedItems]))
    };

    // Mock the service
    const { ShoppingService } = require('../src/services/ShoppingService');
    ShoppingService.mockImplementation(() => mockShoppingService);
  });

  describe('Basic Display', () => {
    it('should display "장보기 목록" header', async () => {
      // Test that ShoppingScreen displays the correct Korean header
      renderWithTheme(<ShoppingScreen />);
      
      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('장보기 목록')).toBeTruthy();
      });
    });

    it('should show "쇼핑 목록이 없습니다" when list is empty', async () => {
      // Test empty state message
      const mockEmptyService = {
        getItemsByTodoStatus: jest.fn(() => Promise.resolve([])),
        getItems: jest.fn(() => Promise.resolve([]))
      };

      const { ShoppingService } = require('../src/services/ShoppingService');
      ShoppingService.mockImplementation(() => mockEmptyService);
      
      renderWithTheme(<ShoppingScreen />);
      
      // Should show empty state message
      await waitFor(() => {
        expect(screen.getByText('쇼핑 목록이 없습니다')).toBeTruthy();
      });
    });

    it('should display list of shopping items (todo=true)', async () => {
      // Test that shopping items with todo=true are displayed
      renderWithTheme(<ShoppingScreen />);
      
      // Wait for data to load and check items are displayed
      await waitFor(() => {
        expect(screen.getByText('사과')).toBeTruthy();
        expect(screen.getByText('우유')).toBeTruthy();
        expect(screen.getByText('빨간 사과 5개')).toBeTruthy();
        expect(screen.getByText('저지방 우유 1L')).toBeTruthy();
      });
    });

    it('should show loading indicator while fetching', async () => {
      // Test loading state
      renderWithTheme(<ShoppingScreen />);
      
      // Should initially show loading indicator
      expect(screen.getByTestId('loading-indicator')).toBeTruthy();
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByTestId('loading-indicator')).toBeNull();
      });
    });
  });
});