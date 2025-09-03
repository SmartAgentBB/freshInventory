import React, { useState, useEffect } from 'react';
import { View, ScrollView } from 'react-native';
import { Surface, Text, ActivityIndicator } from 'react-native-paper';
import { Colors } from '../constants/colors';
import { getTranslation } from '../constants/translations';
import { ShoppingItem } from '../models/ShoppingItem';
import { ShoppingService } from '../services/ShoppingService';
import { ShoppingItemCard } from '../components/ShoppingItemCard';

interface ShoppingScreenProps {
  onStatusChange?: (itemId: string, newTodoStatus: boolean) => void;
}

export const ShoppingScreen: React.FC<ShoppingScreenProps> = ({ onStatusChange }) => {
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      
      try {
        const shoppingService = new ShoppingService();
        const userId = 'test-user-1'; // In real app, this would come from auth context
        
        const todoItems = await shoppingService.getItemsByTodoStatus(userId, true);
        setShoppingItems(todoItems);
      } catch (error) {
        console.error('Error loading shopping data:', error);
        setShoppingItems([]);
      }
      
      setLoading(false);
    };

    loadData();
  }, []);

  const handleStatusChange = (itemId: string, newTodoStatus: boolean) => {
    onStatusChange?.(itemId, newTodoStatus);
    // In real app, this would update the item in the database
    // and refresh the shopping list
  };

  return (
    <Surface 
      style={{ 
        flex: 1, 
        backgroundColor: Colors.background.default,
        padding: 16
      }}
      testID="shopping-screen"
    >
      {/* Header */}
      <Text 
        variant="headlineSmall" 
        style={{ 
          color: Colors.text.primary,
          marginBottom: 16,
          fontFamily: 'OpenSans-Bold',
          textAlign: 'center'
        }}
      >
        장보기 목록
      </Text>

      {/* Content */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator 
            animating={true} 
            color={Colors.primary}
            testID="loading-indicator"
            style={{ marginBottom: 16 }}
          />
        </View>
      ) : (
        <ScrollView 
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
        >
          {shoppingItems.length === 0 ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 40 }}>
              <Text 
                variant="bodyMedium"
                style={{ 
                  color: Colors.text.secondary,
                  fontFamily: 'OpenSans-Regular',
                  textAlign: 'center'
                }}
              >
                쇼핑 목록이 없습니다
              </Text>
            </View>
          ) : (
            shoppingItems.map(item => (
              <ShoppingItemCard 
                key={item.id}
                item={item}
                onStatusChange={handleStatusChange}
              />
            ))
          )}
        </ScrollView>
      )}
    </Surface>
  );
};