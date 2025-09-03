import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { InventoryScreen } from '../src/screens/InventoryScreen';
import { PaperProvider } from 'react-native-paper';
import { mintTheme } from '../src/theme/mintTheme';

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

describe('InventoryScreen', () => {
  describe('재고 목록 표시', () => {
    it('should display "재고 목록" header', () => {
      // Test that InventoryScreen displays the correct Korean header
      renderWithTheme(<InventoryScreen />);
      
      // Should show the inventory header in Korean
      expect(screen.getByText('재고 목록')).toBeTruthy();
    });

    it('should show "재료가 없습니다" when inventory is empty', () => {
      // Test empty state display
      renderWithTheme(<InventoryScreen />);
      
      // Should show empty state message in Korean
      expect(screen.getByText('재료가 없습니다')).toBeTruthy();
    });

    it('should display list of food items when inventory has data', () => {
      // This test will be implemented when we have mock data
      // For now, just ensure the component renders without crashing
      const { getByTestId } = renderWithTheme(<InventoryScreen />);
      
      // Should render the main inventory container
      expect(getByTestId('inventory-screen')).toBeTruthy();
    });

    it('should show loading indicator while fetching data', () => {
      // Test loading state
      renderWithTheme(<InventoryScreen />);
      
      // Should show loading indicator initially
      expect(screen.getByTestId('loading-indicator')).toBeTruthy();
    });

    it('should display error message when fetch fails', () => {
      // Test error state - this will be implemented when we add error handling
      renderWithTheme(<InventoryScreen />);
      
      // Component should render without crashing even in error states
      expect(screen.getByTestId('inventory-screen')).toBeTruthy();
    });
  });
});