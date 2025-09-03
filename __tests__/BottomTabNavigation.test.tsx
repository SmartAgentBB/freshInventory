import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';
import { BottomTabNavigation } from '../src/navigation/BottomTabNavigation';
import { mintLightTheme } from '../src/theme/mintTheme';

describe('Bottom Tab Navigation', () => {
  const renderWithProvider = (component: React.ReactElement) => {
    return render(
      <PaperProvider theme={mintLightTheme}>
        {component}
      </PaperProvider>
    );
  };

  describe('Should render three main tabs', () => {
    it('should render bottom tab navigation with three main tabs', () => {
      renderWithProvider(<BottomTabNavigation />);
      
      // Check for the three main navigation tabs
      expect(screen.getByText('재고')).toBeTruthy();
      expect(screen.getByText('요리')).toBeTruthy();
      expect(screen.getByText('장보기')).toBeTruthy();
    });

    it('should have proper tab structure with Material Design 3 styling', () => {
      renderWithProvider(<BottomTabNavigation />);
      
      // Check that navigation container exists
      expect(screen.getByTestId('bottom-tab-navigation')).toBeTruthy();
      
      // Check each tab exists as a touchable element
      expect(screen.getByTestId('inventory-tab')).toBeTruthy();
      expect(screen.getByTestId('cooking-tab')).toBeTruthy();
      expect(screen.getByTestId('shopping-tab')).toBeTruthy();
    });

    it('should display tabs with correct Korean labels from translations', () => {
      renderWithProvider(<BottomTabNavigation />);
      
      // Verify Korean labels match translations
      expect(screen.getByText('재고')).toBeTruthy(); // inventory
      expect(screen.getByText('요리')).toBeTruthy(); // cooking  
      expect(screen.getByText('장보기')).toBeTruthy(); // shopping
    });
  });

  describe('Should navigate to screens when tabs are pressed', () => {
    it('should navigate to Inventory screen when inventory tab is pressed', () => {
      renderWithProvider(<BottomTabNavigation />);
      
      const inventoryTab = screen.getByTestId('inventory-tab');
      fireEvent.press(inventoryTab);
      
      // Should display InventoryScreen content
      expect(screen.getByText('재고 목록')).toBeTruthy();
      expect(screen.getByTestId('inventory-screen')).toBeTruthy();
    });

    it('should show inventory tab as active after press', () => {
      renderWithProvider(<BottomTabNavigation />);
      
      const inventoryTab = screen.getByTestId('inventory-tab');
      fireEvent.press(inventoryTab);
      
      // Check active state styling or indicator
      expect(screen.getByTestId('inventory-tab')).toHaveStyle({
        backgroundColor: expect.any(String)
      });
    });

    it('should navigate to Cooking screen when cooking tab is pressed', () => {
      renderWithProvider(<BottomTabNavigation />);
      
      const cookingTab = screen.getByTestId('cooking-tab');
      fireEvent.press(cookingTab);
      
      // Should display CookingScreen content
      expect(screen.getByText('요리 추천')).toBeTruthy();
      expect(screen.getByTestId('cooking-screen')).toBeTruthy();
    });

    it('should show cooking tab as active after press', () => {
      renderWithProvider(<BottomTabNavigation />);
      
      const cookingTab = screen.getByTestId('cooking-tab');
      fireEvent.press(cookingTab);
      
      // Check active state styling
      expect(screen.getByTestId('cooking-tab')).toHaveStyle({
        backgroundColor: expect.any(String)
      });
    });

    it('should navigate to Shopping screen when shopping tab is pressed', () => {
      renderWithProvider(<BottomTabNavigation />);
      
      const shoppingTab = screen.getByTestId('shopping-tab');
      fireEvent.press(shoppingTab);
      
      // Should display ShoppingScreen content
      expect(screen.getByText('장보기 목록')).toBeTruthy();
      expect(screen.getByTestId('shopping-screen')).toBeTruthy();
    });

    it('should show shopping tab as active after press', () => {
      renderWithProvider(<BottomTabNavigation />);
      
      const shoppingTab = screen.getByTestId('shopping-tab');
      fireEvent.press(shoppingTab);
      
      // Check active state styling
      expect(screen.getByTestId('shopping-tab')).toHaveStyle({
        backgroundColor: expect.any(String)
      });
    });
  });

  describe('Active tab should be highlighted correctly', () => {
    it('should highlight inventory tab as active by default', () => {
      renderWithProvider(<BottomTabNavigation />);
      
      const inventoryTab = screen.getByTestId('inventory-tab');
      const cookingTab = screen.getByTestId('cooking-tab');
      const shoppingTab = screen.getByTestId('shopping-tab');
      
      // Inventory should be active by default
      expect(inventoryTab).toHaveStyle({
        backgroundColor: '#B2DFDB' // Colors.primary.container
      });
      
      // Other tabs should not be active
      expect(cookingTab).toHaveStyle({
        backgroundColor: 'transparent'
      });
      expect(shoppingTab).toHaveStyle({
        backgroundColor: 'transparent'
      });
    });

    it('should highlight active tab text with primary color', () => {
      renderWithProvider(<BottomTabNavigation />);
      
      // Check default inventory tab text color
      const inventoryTabText = screen.getByText('재고');
      expect(inventoryTabText).toHaveStyle({
        color: '#26A69A' // Colors.primary.main
      });
      
      // Switch to cooking tab
      const cookingTab = screen.getByTestId('cooking-tab');
      fireEvent.press(cookingTab);
      
      const cookingTabText = screen.getByText('요리');
      expect(cookingTabText).toHaveStyle({
        color: '#26A69A' // Colors.primary.main
      });
    });

    it('should only have one active tab at a time', () => {
      renderWithProvider(<BottomTabNavigation />);
      
      // Switch to shopping tab
      const shoppingTab = screen.getByTestId('shopping-tab');
      fireEvent.press(shoppingTab);
      
      const inventoryTab = screen.getByTestId('inventory-tab');
      const cookingTab = screen.getByTestId('cooking-tab');
      
      // Shopping should be active
      expect(shoppingTab).toHaveStyle({
        backgroundColor: '#B2DFDB' // Colors.primary.container
      });
      
      // Others should not be active
      expect(inventoryTab).toHaveStyle({
        backgroundColor: 'transparent'
      });
      expect(cookingTab).toHaveStyle({
        backgroundColor: 'transparent'
      });
    });

    it('should maintain active state when switching between tabs', () => {
      renderWithProvider(<BottomTabNavigation />);
      
      const inventoryTab = screen.getByTestId('inventory-tab');
      const cookingTab = screen.getByTestId('cooking-tab');
      const shoppingTab = screen.getByTestId('shopping-tab');
      
      // Start with inventory (default)
      expect(inventoryTab).toHaveStyle({ backgroundColor: '#B2DFDB' });
      
      // Switch to cooking
      fireEvent.press(cookingTab);
      expect(cookingTab).toHaveStyle({ backgroundColor: '#B2DFDB' });
      expect(inventoryTab).toHaveStyle({ backgroundColor: 'transparent' });
      
      // Switch to shopping
      fireEvent.press(shoppingTab);
      expect(shoppingTab).toHaveStyle({ backgroundColor: '#B2DFDB' });
      expect(cookingTab).toHaveStyle({ backgroundColor: 'transparent' });
      
      // Switch back to inventory
      fireEvent.press(inventoryTab);
      expect(inventoryTab).toHaveStyle({ backgroundColor: '#B2DFDB' });
      expect(shoppingTab).toHaveStyle({ backgroundColor: 'transparent' });
    });
  });
});