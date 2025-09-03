import React, { useState } from 'react';
import { View } from 'react-native';
import { Surface, TouchableRipple, Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../constants/colors';
import { getTranslation } from '../constants/translations';
import { InventoryScreen } from '../screens/InventoryScreen';
import { CookingScreen } from '../screens/CookingScreen';
import { ShoppingScreen } from '../screens/ShoppingScreen';

type TabType = 'inventory' | 'cooking' | 'shopping';

export const BottomTabNavigation = () => {
  const [activeTab, setActiveTab] = useState<TabType>('inventory');

  const renderScreen = () => {
    switch (activeTab) {
      case 'inventory':
        return <InventoryScreen />;
      case 'cooking':
        return <CookingScreen />;
      case 'shopping':
        return <ShoppingScreen />;
      default:
        return <InventoryScreen />;
    }
  };

  const getTabStyle = (tab: TabType) => ({
    flex: 1, 
    justifyContent: 'center' as const, 
    alignItems: 'center' as const,
    paddingVertical: 8,
    backgroundColor: activeTab === tab ? Colors.primary.container : 'transparent'
  });

  const getIconName = (tab: TabType) => {
    switch (tab) {
      case 'inventory':
        return 'fridge-outline';
      case 'cooking':
        return 'chef-hat';
      case 'shopping':
        return 'cart-outline';
      default:
        return 'home';
    }
  };

  return (
    <View style={{ flex: 1 }} testID="bottom-tab-navigation-outer-layer">
      {renderScreen()}
      
      <Surface 
        style={{ 
          flexDirection: 'row', 
          height: 72, 
          backgroundColor: Colors.background.paper,
          elevation: 2 
        }}
        testID="bottom-tab-navigation"
      >
        <TouchableRipple
          style={getTabStyle('inventory')}
          testID="inventory-tab"
          onPress={() => setActiveTab('inventory')}
        >
          <View style={{ alignItems: 'center' }}>
            <MaterialCommunityIcons
              name={getIconName('inventory')}
              size={24}
              color={activeTab === 'inventory' ? Colors.primary.main : Colors.text.secondary}
            />
            <Text 
              variant="labelSmall" 
              style={{ 
                color: activeTab === 'inventory' ? Colors.primary.main : Colors.text.secondary,
                marginTop: 4
              }}
            >
              {getTranslation('navigation.inventory')}
            </Text>
          </View>
        </TouchableRipple>
        
        <TouchableRipple
          style={getTabStyle('cooking')}
          testID="cooking-tab"
          onPress={() => setActiveTab('cooking')}
        >
          <View style={{ alignItems: 'center' }}>
            <MaterialCommunityIcons
              name={getIconName('cooking')}
              size={24}
              color={activeTab === 'cooking' ? Colors.primary.main : Colors.text.secondary}
            />
            <Text 
              variant="labelSmall" 
              style={{ 
                color: activeTab === 'cooking' ? Colors.primary.main : Colors.text.secondary,
                marginTop: 4
              }}
            >
              {getTranslation('navigation.cooking')}
            </Text>
          </View>
        </TouchableRipple>
        
        <TouchableRipple
          style={getTabStyle('shopping')}
          testID="shopping-tab"
          onPress={() => setActiveTab('shopping')}
        >
          <View style={{ alignItems: 'center' }}>
            <MaterialCommunityIcons
              name={getIconName('shopping')}
              size={24}
              color={activeTab === 'shopping' ? Colors.primary.main : Colors.text.secondary}
            />
            <Text 
              variant="labelSmall" 
              style={{ 
                color: activeTab === 'shopping' ? Colors.primary.main : Colors.text.secondary,
                marginTop: 4
              }}
            >
              {getTranslation('navigation.shopping')}
            </Text>
          </View>
        </TouchableRipple>
      </Surface>
    </View>
  );
};