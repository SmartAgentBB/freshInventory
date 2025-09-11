import React from 'react';
import { BottomTabNavigation } from './BottomTabNavigation';

// Export the type from InventoryStackNavigator for backwards compatibility
export { InventoryStackParamList as RootStackParamList } from './InventoryStackNavigator';

export const MainNavigator = () => {
  return <BottomTabNavigation />;
};