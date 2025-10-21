import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import { InventoryStackNavigator } from './InventoryStackNavigator';
import { CookingStackNavigator } from './CookingStackNavigator';
import { ShoppingScreen } from '../screens/ShoppingScreen';
import { ProfileStackNavigator } from './ProfileStackNavigator';
import { useShoppingCount } from '../contexts/ShoppingContext';

const Tab = createBottomTabNavigator();

export const BottomTabNavigation = () => {
  const { t } = useTranslation('common');
  const { activeItemCount } = useShoppingCount();
  const insets = useSafeAreaInsets();

  // 하단 네비게이션 바 스타일
  // 안드로이드: paddingBottom을 늘려서 시스템 버튼 위로 올림
  const tabBarStyle = {
    backgroundColor: Colors.background.paper,
    borderTopColor: Colors.border.light,
    borderTopWidth: 1,
    height: Platform.OS === 'android' ? 94 : 84, // 안드로이드는 높이 증가
    paddingBottom: Platform.OS === 'android' ? 50 : 24, // 안드로이드는 하단 패딩 증가
    paddingTop: 4,
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  };

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle,
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
          tabBarLabel: t('navigation.inventory'),
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
          tabBarLabel: t('navigation.cooking'),
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
          tabBarLabel: t('navigation.shopping'),
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
      <Tab.Screen
        name="Profile"
        component={ProfileStackNavigator}
        options={{
          tabBarLabel: 'MY',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="account-outline"
              size={size || 24}
              color={color}
            />
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