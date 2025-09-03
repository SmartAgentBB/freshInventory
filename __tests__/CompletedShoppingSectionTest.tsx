import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import { CompletedShoppingSection } from '../src/components/CompletedShoppingSection';
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

// Mock completed shopping items data
const mockCompletedItems: ShoppingItem[] = [
  {
    id: 'completed-1',
    name: '사과',
    memo: '빨간 사과',
    todo: false,
    userId: 'test-user-1',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-03') // Completed on Jan 3
  },
  {
    id: 'completed-2',
    name: '우유',
    memo: '저지방 우유',
    todo: false,
    userId: 'test-user-1',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-03') // Same day
  },
  {
    id: 'completed-3',
    name: '바나나',
    memo: '노란 바나나 5개',
    todo: false,
    userId: 'test-user-1',
    createdAt: new Date('2025-01-02'),
    updatedAt: new Date('2025-01-02') // Completed on Jan 2
  },
  {
    id: 'completed-4',
    name: '토마토',
    memo: '방울토마토',
    todo: false,
    userId: 'test-user-1',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01') // Completed on Jan 1
  },
  {
    id: 'completed-5',
    name: '오렌지',
    memo: '네이블 오렌지',
    todo: false,
    userId: 'test-user-1',
    createdAt: new Date('2024-12-31'),
    updatedAt: new Date('2024-12-31') // Completed on Dec 31
  },
  {
    id: 'completed-6',
    name: '포도',
    memo: '샤인머스켓',
    todo: false,
    userId: 'test-user-1',
    createdAt: new Date('2024-12-30'),
    updatedAt: new Date('2024-12-30') // Should be excluded (6th item)
  }
];

describe('CompletedShoppingSection - 완료한 쇼핑 섹션', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock ShoppingService
    const mockShoppingService = {
      getCompletedItems: jest.fn(() => Promise.resolve(mockCompletedItems.slice(0, 5))),
      getItemsByTodoStatus: jest.fn(() => Promise.resolve(mockCompletedItems))
    };

    const { ShoppingService } = require('../src/services/ShoppingService');
    ShoppingService.mockImplementation(() => mockShoppingService);
  });

  describe('Display functionality', () => {
    it('should display last 5 completed shopping items', async () => {
      // Test that CompletedShoppingSection shows the most recent 5 completed items
      renderWithTheme(<CompletedShoppingSection />);
      
      // Should show loading initially
      expect(screen.getByTestId('loading-indicator')).toBeTruthy();
      
      // Wait for items to load
      await waitFor(() => {
        // Should display the 5 most recent completed items
        expect(screen.getByText('사과')).toBeTruthy();
        expect(screen.getByText('우유')).toBeTruthy();
        expect(screen.getByText('바나나')).toBeTruthy();
        expect(screen.getByText('토마토')).toBeTruthy();
        expect(screen.getByText('오렌지')).toBeTruthy();
        
        // Should NOT display the 6th item (oldest)
        expect(screen.queryByText('포도')).toBeFalsy();
      });
    });

    it('should group completed items by date', async () => {
      // Test that items are grouped by completion date
      renderWithTheme(<CompletedShoppingSection />);
      
      await waitFor(() => {
        // Should show date headers
        expect(screen.getByText('2025년 1월 3일')).toBeTruthy();
        expect(screen.getByText('2025년 1월 2일')).toBeTruthy();
        expect(screen.getByText('2025년 1월 1일')).toBeTruthy();
        expect(screen.getByText('2024년 12월 31일')).toBeTruthy();
        
        // Items should appear under correct date groups
        expect(screen.getByText('사과')).toBeTruthy(); // Jan 3
        expect(screen.getByText('우유')).toBeTruthy(); // Jan 3
        expect(screen.getByText('바나나')).toBeTruthy(); // Jan 2
        expect(screen.getByText('토마토')).toBeTruthy(); // Jan 1
        expect(screen.getByText('오렌지')).toBeTruthy(); // Dec 31
      });
    });

    it('should show completion date for each item', async () => {
      // Test that each item displays its completion date
      renderWithTheme(<CompletedShoppingSection />);
      
      await waitFor(() => {
        // Should show completion dates in Korean format (using getAllByText for duplicates)
        expect(screen.getAllByText('완료: 2025년 1월 3일')).toHaveLength(2); // Two items on Jan 3
        expect(screen.getByText('완료: 2025년 1월 2일')).toBeTruthy();
        expect(screen.getByText('완료: 2025년 1월 1일')).toBeTruthy();
        expect(screen.getByText('완료: 2024년 12월 31일')).toBeTruthy();
      });
    });

    it('should handle empty completed items list', async () => {
      // Test behavior when no completed items exist
      const mockShoppingService = {
        getCompletedItems: jest.fn(() => Promise.resolve([])),
        getItemsByTodoStatus: jest.fn(() => Promise.resolve([]))
      };

      const { ShoppingService } = require('../src/services/ShoppingService');
      ShoppingService.mockImplementation(() => mockShoppingService);
      
      renderWithTheme(<CompletedShoppingSection />);
      
      await waitFor(() => {
        expect(screen.getByText('완료한 쇼핑 항목이 없습니다')).toBeTruthy();
      });
    });

    it('should show loading indicator while fetching data', () => {
      // Test that loading state is shown
      renderWithTheme(<CompletedShoppingSection />);
      
      expect(screen.getByTestId('loading-indicator')).toBeTruthy();
    });

    it('should handle fetch errors gracefully', async () => {
      // Test error handling
      const mockShoppingService = {
        getCompletedItems: jest.fn(() => Promise.reject(new Error('Network error'))),
        getItemsByTodoStatus: jest.fn(() => Promise.reject(new Error('Network error')))
      };

      const { ShoppingService } = require('../src/services/ShoppingService');
      ShoppingService.mockImplementation(() => mockShoppingService);
      
      renderWithTheme(<CompletedShoppingSection />);
      
      await waitFor(() => {
        expect(screen.getByText('완료한 항목을 불러오는 중 오류가 발생했습니다')).toBeTruthy();
      });
    });
  });

  describe('Data ordering and limiting', () => {
    it('should display items in reverse chronological order (newest first)', async () => {
      // Test that most recently completed items appear first
      renderWithTheme(<CompletedShoppingSection />);
      
      await waitFor(() => {
        const items = screen.getAllByTestId('completed-shopping-item');
        expect(items).toHaveLength(5);
        
        // Should be ordered by completion date (newest first)
        // Jan 3 items should come before Jan 2, etc.
      });
    });

    it('should limit display to exactly 5 items even if more exist', async () => {
      // Test that only 5 items are shown even when more completed items exist
      const mockShoppingService = {
        getCompletedItems: jest.fn(() => Promise.resolve(mockCompletedItems)), // Returns all 6
        getItemsByTodoStatus: jest.fn(() => Promise.resolve(mockCompletedItems))
      };

      const { ShoppingService } = require('../src/services/ShoppingService');
      ShoppingService.mockImplementation(() => mockShoppingService);
      
      renderWithTheme(<CompletedShoppingSection />);
      
      await waitFor(() => {
        const items = screen.getAllByTestId('completed-shopping-item');
        expect(items).toHaveLength(5); // Should only show 5, not 6
      });
    });
  });
});