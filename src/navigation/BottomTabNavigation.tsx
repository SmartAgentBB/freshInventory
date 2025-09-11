import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../constants/colors';
import { getTranslation } from '../constants/translations';
import { InventoryStackNavigator } from './InventoryStackNavigator';
import { CookingScreen } from '../screens/CookingScreen';
import { ShoppingScreen } from '../screens/ShoppingScreen';

const Tab = createBottomTabNavigator();

export const BottomTabNavigation = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.background.paper,
          borderTopColor: Colors.border.light,
          borderTopWidth: 1,
          height: 84,
          paddingBottom: 20,
          paddingTop: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 10,
          elevation: 10,
        },
        tabBarActiveTintColor: Colors.primary.main,  // 선택된 탭: 민트색 포인트
        tabBarInactiveTintColor: Colors.text.secondary, // 선택 안된 탭: 회색
        tabBarLabelStyle: {
          fontSize: 12,
          fontFamily: 'OpenSans-Medium',
        },
      }}
    >
      <Tab.Screen
        name="Inventory"
        component={InventoryStackNavigator}
        options={{
          tabBarLabel: getTranslation('navigation.inventory'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons 
              name="fridge-outline" 
              size={size || 24} 
              color={color} 
            />
          ),
        }}
      />
      <Tab.Screen
        name="Cooking"
        component={CookingScreen}
        options={{
          tabBarLabel: getTranslation('navigation.cooking'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons 
              name="chef-hat" 
              size={size || 24} 
              color={color} 
            />
          ),
        }}
      />
      <Tab.Screen
        name="Shopping"
        component={ShoppingScreen}
        options={{
          tabBarLabel: getTranslation('navigation.shopping'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons 
              name="cart-outline" 
              size={size || 24} 
              color={color} 
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};