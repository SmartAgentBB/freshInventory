import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import { InventoryScreen } from '../src/screens/InventoryScreen';
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

// Mock food items data
const mockFreshItems: FoodItem[] = [
  {
    id: 'fresh-1',
    name: '사과',
    quantity: 5,
    unit: '개',
    category: 'fruits',
    addedDate: new Date('2025-01-01'),
    expiryDate: new Date('2025-01-10'),
    status: 'fresh',
    userId: 'test-user-1',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01')
  }
];

const mockFrozenItems: FoodItem[] = [
  {
    id: 'frozen-1',
    name: '냉동 만두',
    quantity: 1,
    unit: '봉지',
    category: 'frozen',
    addedDate: new Date('2025-01-01'),
    expiryDate: new Date('2025-03-01'),
    status: 'frozen',
    userId: 'test-user-1',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-02')
  },
  {
    id: 'frozen-2',
    name: '냉동 베리',
    quantity: 2,
    unit: 'kg',
    category: 'fruits',
    addedDate: new Date('2024-12-20'),
    expiryDate: new Date('2025-06-01'),
    status: 'frozen',
    userId: 'test-user-1',
    createdAt: new Date('2024-12-20'),
    updatedAt: new Date('2025-01-03')
  }
];

const mockConsumedItems: FoodItem[] = [
  {
    id: 'consumed-1',
    name: '양파',
    quantity: 0,
    unit: '개',
    category: 'vegetables',
    addedDate: new Date('2024-12-25'),
    expiryDate: new Date('2025-01-05'),
    status: 'consumed',
    userId: 'test-user-1',
    createdAt: new Date('2024-12-25'),
    updatedAt: new Date('2025-01-04')
  }
];

describe('InventoryScreen - 냉동 보관 탭', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock InventoryService to return different items based on status
    const mockInventoryService = {
      getItemsByStatus: jest.fn((userId: string, status: string) => {
        switch (status) {
          case 'fresh':
            return Promise.resolve(mockFreshItems);
          case 'frozen':
            return Promise.resolve(mockFrozenItems);
          case 'consumed':
            return Promise.resolve(mockConsumedItems);
          default:
            return Promise.resolve([]);
        }
      }),
      getItems: jest.fn(() => Promise.resolve([...mockFreshItems, ...mockFrozenItems, ...mockConsumedItems]))
    };

    // Mock the service
    const { InventoryService } = require('../src/services/InventoryService');
    InventoryService.mockImplementation(() => mockInventoryService);
  });

  describe('Tab Navigation', () => {
    it('should display frozen items in separate tab', async () => {
      // Test that frozen items are shown in a separate tab
      renderWithTheme(<InventoryScreen />);
      
      // Wait for loading to complete - check for content instead of loading indicator
      await waitFor(() => {
        expect(screen.getByText('재고목록')).toBeTruthy();
        expect(screen.getByText('냉동보관')).toBeTruthy();
        expect(screen.getByText('지난기록')).toBeTruthy();
      });
      
      // Should be on fresh items tab by default and show fresh items
      expect(screen.getByText('사과')).toBeTruthy();
      
      // Click on frozen tab
      const frozenTab = screen.getByText('냉동보관');
      fireEvent.press(frozenTab);
      
      // Should show frozen items
      await waitFor(() => {
        expect(screen.getByText('냉동 만두')).toBeTruthy();
        expect(screen.getByText('냉동 베리')).toBeTruthy();
      });
    });

    it('should allow moving items from frozen back to regular inventory', async () => {
      // Test that frozen items can be moved back to fresh status
      const mockOnStatusChange = jest.fn();
      
      renderWithTheme(<InventoryScreen onStatusChange={mockOnStatusChange} />);
      
      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('재고목록')).toBeTruthy();
      });
      
      // Click on frozen tab
      const frozenTab = screen.getByText('냉동보관');
      fireEvent.press(frozenTab);
      
      // Should show frozen items with unfreeze option
      await waitFor(() => {
        expect(screen.getByText('냉동 만두')).toBeTruthy();
      });
      
      // Should have unfreeze button
      const unfreezeButton = screen.getByTestId('unfreeze-button-frozen-1');
      fireEvent.press(unfreezeButton);
      
      // Should call status change to move back to fresh
      expect(mockOnStatusChange).toHaveBeenCalledWith('frozen-1', 'fresh');
    });

    it('should show frozen date for each item', async () => {
      // Test that frozen items display when they were frozen
      renderWithTheme(<InventoryScreen />);
      
      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('재고목록')).toBeTruthy();
      });
      
      // Click on frozen tab
      const frozenTab = screen.getByText('냉동보관');
      fireEvent.press(frozenTab);
      
      // Should show frozen dates
      await waitFor(() => {
        expect(screen.getAllByText(/냉동 날짜/)).toHaveLength(2); // One for each frozen item
      });
    });

    it('should display different tabs correctly', async () => {
      // Test that all three tabs work correctly
      renderWithTheme(<InventoryScreen />);
      
      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('재고목록')).toBeTruthy();
      });
      
      // Should start on fresh items tab
      expect(screen.getByText('사과')).toBeTruthy();
      
      // Click frozen tab
      const frozenTab = screen.getByText('냉동보관');
      fireEvent.press(frozenTab);
      await waitFor(() => {
        expect(screen.getByText('냉동 만두')).toBeTruthy();
      });
      
      // Click past records tab
      const pastTab = screen.getByText('지난기록');
      fireEvent.press(pastTab);
      await waitFor(() => {
        expect(screen.getByText('양파')).toBeTruthy();
      });
    });

    it('should show empty state for frozen tab when no frozen items', async () => {
      // Test empty state for frozen tab
      const mockInventoryServiceEmpty = {
        getItemsByStatus: jest.fn((userId: string, status: string) => {
          switch (status) {
            case 'fresh':
              return Promise.resolve(mockFreshItems);
            case 'frozen':
              return Promise.resolve([]); // No frozen items
            case 'consumed':
              return Promise.resolve(mockConsumedItems);
            default:
              return Promise.resolve([]);
          }
        }),
        getItems: jest.fn(() => Promise.resolve([...mockFreshItems, ...mockConsumedItems]))
      };

      const { InventoryService } = require('../src/services/InventoryService');
      InventoryService.mockImplementation(() => mockInventoryServiceEmpty);
      
      renderWithTheme(<InventoryScreen />);
      
      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('재고목록')).toBeTruthy();
      });
      
      // Click on frozen tab
      const frozenTab = screen.getByText('냉동보관');
      fireEvent.press(frozenTab);
      
      // Should show empty state
      await waitFor(() => {
        expect(screen.getByText('냉동 보관 중인 재료가 없습니다')).toBeTruthy();
      });
    });
  });

  describe('Past Records Tab', () => {
    it('should display last 10 consumed items', async () => {
      // Test that past records tab shows consumed items
      renderWithTheme(<InventoryScreen />);
      
      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('재고목록')).toBeTruthy();
      });
      
      // Click on past records tab
      const pastTab = screen.getByText('지난기록');
      fireEvent.press(pastTab);
      
      // Should show consumed items
      await waitFor(() => {
        expect(screen.getByText('양파')).toBeTruthy();
      });
    });

    it('should remove duplicates by name (show latest only)', async () => {
      // Test that duplicate names show only the latest entry
      const duplicateConsumedItems = [
        ...mockConsumedItems,
        {
          ...mockConsumedItems[0],
          id: 'consumed-2',
          updatedAt: new Date('2025-01-02') // Earlier than consumed-1
        }
      ];

      const mockInventoryServiceDuplicates = {
        getItemsByStatus: jest.fn((userId: string, status: string) => {
          if (status === 'consumed') {
            return Promise.resolve(duplicateConsumedItems);
          }
          return Promise.resolve([]);
        }),
        getItems: jest.fn(() => Promise.resolve(duplicateConsumedItems))
      };

      const { InventoryService } = require('../src/services/InventoryService');
      InventoryService.mockImplementation(() => mockInventoryServiceDuplicates);
      
      renderWithTheme(<InventoryScreen />);
      
      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('재고목록')).toBeTruthy();
      });
      
      // Click on past records tab
      const pastTab = screen.getByText('지난기록');
      fireEvent.press(pastTab);
      
      // Should show only one "양파" (the latest one)
      await waitFor(() => {
        const onionItems = screen.getAllByText('양파');
        expect(onionItems).toHaveLength(1);
      });
    });

    it('should allow adding items back to shopping list from history', async () => {
      // Test that items from history can be added back to shopping list
      const mockOnAddToShopping = jest.fn();
      
      renderWithTheme(<InventoryScreen onAddToShopping={mockOnAddToShopping} />);
      
      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('재고목록')).toBeTruthy();
      });
      
      // Click on past records tab
      const pastTab = screen.getByText('지난기록');
      fireEvent.press(pastTab);
      
      // Should have add to shopping button
      await waitFor(() => {
        const addToShoppingButton = screen.getByTestId('add-to-shopping-consumed-1');
        fireEvent.press(addToShoppingButton);
        
        // Should call add to shopping function
        expect(mockOnAddToShopping).toHaveBeenCalledWith('양파');
      });
    });
  });
});