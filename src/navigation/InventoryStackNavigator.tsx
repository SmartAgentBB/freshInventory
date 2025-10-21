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
        // 안드로이드 메모리 관리 개선: 백그라운드 화면 유지
        detachInactiveScreens: false,
        // 화면 전환 시에도 상태 유지
        freezeOnBlur: false,
      }}
    >
      <Stack.Screen
        name="InventoryList"
        component={InventoryScreen}
        options={{
          // InventoryList는 절대 언마운트하지 않음 (스택 보존)
          unmountOnBlur: false,
        }}
      />
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