import React from 'react';
import { BottomTabNavigation } from './BottomTabNavigation';
import { ShoppingProvider } from '../contexts/ShoppingContext';

// Export the type from InventoryStackNavigator for backwards compatibility
export { InventoryStackParamList as RootStackParamList } from './InventoryStackNavigator';

export const MainNavigator = () => {
  return (
    <ShoppingProvider>
      <BottomTabNavigation />
    </ShoppingProvider>
  );
};