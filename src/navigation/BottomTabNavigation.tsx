import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../constants/colors';
import { getTranslation } from '../constants/translations';
import { InventoryStackNavigator } from './InventoryStackNavigator';
import { CookingStackNavigator } from './CookingStackNavigator';
import { ShoppingScreen } from '../screens/ShoppingScreen';
import { useShoppingCount } from '../contexts/ShoppingContext';

const Tab = createBottomTabNavigator();

export const BottomTabNavigation = () => {
  const { activeItemCount } = useShoppingCount();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.background.paper,
          borderTopColor: Colors.border.light,
          borderTopWidth: 1,
          height: 72,
          paddingBottom: 12,
          paddingTop: 6,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 10,
          elevation: 10,
        },
        tabBarActiveTintColor: Colors.primary.main,  // 선택된 탭: 민트색 포인트
        tabBarInactiveTintColor: Colors.text.secondary, // 선택 안된 탭: 회색
        tabBarLabelStyle: {
          fontSize: 10,
          fontFamily: 'OpenSans-Medium',
          marginTop: -2,
        },
        tabBarIconStyle: {
          marginBottom: -2,
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
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            // If already on Inventory tab, pop to root
            if (navigation.isFocused()) {
              navigation.navigate('Inventory', {
                screen: 'InventoryMain',
              });
            }
          },
        })}
      />
      <Tab.Screen
        name="Cooking"
        component={CookingStackNavigator}
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
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            // If already on Cooking tab, pop to root
            if (navigation.isFocused()) {
              navigation.navigate('Cooking', {
                screen: 'CookingMain',
              });
            }
          },
        })}
      />
      <Tab.Screen
        name="Shopping"
        component={ShoppingScreen}
        options={{
          tabBarLabel: getTranslation('navigation.shopping'),
          tabBarIcon: ({ color, size }) => (
            <View>
              <MaterialCommunityIcons
                name="cart-outline"
                size={size || 24}
                color={color}
              />
              {activeItemCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {activeItemCount > 99 ? '99+' : activeItemCount}
                  </Text>
                </View>
              )}
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    right: -6,
    top: -3,
    backgroundColor: '#FF5252',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontFamily: 'OpenSans-Bold',
    fontWeight: 'bold',
  },
});