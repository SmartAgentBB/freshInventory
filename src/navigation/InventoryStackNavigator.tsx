import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { InventoryScreen } from '../screens/InventoryScreen';
import { ItemDetailScreen } from '../screens/ItemDetailScreen';
import { RecipeDetailScreen } from '../screens/RecipeDetailScreen';
import { FoodItem } from '../models/FoodItem';
import { Recipe } from '../services/AIService';

export type InventoryStackParamList = {
  InventoryList: { initialSortBy?: 'expiry' } | undefined;
  ItemDetail: { item: FoodItem };
  RecipeDetail: { recipe: Recipe; fromItemDetail?: boolean };
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
      <Stack.Screen
        name="RecipeDetail"
        component={RecipeDetailScreen}
        options={{
          presentation: 'card',
          gestureEnabled: true,
          gestureDirection: 'horizontal',
        }}
      />
    </Stack.Navigator>
  );
};