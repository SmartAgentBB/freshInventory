import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { InventoryScreen } from '../screens/InventoryScreen';
import { ItemDetailScreen } from '../screens/ItemDetailScreen';
import { FoodItem } from '../models/FoodItem';

export type InventoryStackParamList = {
  InventoryList: undefined;
  ItemDetail: { item: FoodItem };
};

const Stack = createStackNavigator<InventoryStackParamList>();

export const InventoryStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="InventoryList" component={InventoryScreen} />
      <Stack.Screen 
        name="ItemDetail" 
        component={ItemDetailScreen}
        options={{
          presentation: 'card',
          gestureEnabled: true,
          gestureDirection: 'horizontal',
        }}
      />
    </Stack.Navigator>
  );
};