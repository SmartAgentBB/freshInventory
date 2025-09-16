import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CookingScreen } from '../screens/CookingScreen';
import { RecipeDetailScreen } from '../screens/RecipeDetailScreen';
import { Recipe } from '../services/AIService';

export type CookingStackParamList = {
  CookingMain: undefined;
  RecipeDetail: { recipe: Recipe };
};

const Stack = createNativeStackNavigator<CookingStackParamList>();

export const CookingStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="CookingMain" component={CookingScreen} />
      <Stack.Screen name="RecipeDetail" component={RecipeDetailScreen} />
    </Stack.Navigator>
  );
};