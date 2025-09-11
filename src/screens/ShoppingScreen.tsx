import React, { useState, useEffect } from 'react';
import { View, ScrollView } from 'react-native';
import { Surface, Text, ActivityIndicator } from 'react-native-paper';
import { Colors } from '../constants/colors';
import { getTranslation } from '../constants/translations';
import { ShoppingItem } from '../models/ShoppingItem';
import { ShoppingService } from '../services/ShoppingService';
import { supabaseClient } from '../services/supabaseClient';
import { ShoppingItemCard } from '../components/ShoppingItemCard';
import { useAuth } from '../hooks/useAuth';

interface ShoppingScreenProps {
  onStatusChange?: (itemId: string, newTodoStatus: boolean) => void;
}

export const ShoppingScreen: React.FC<ShoppingScreenProps> = ({ onStatusChange }) => {
  const { user } = useAuth();
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      
      if (!user?.id) {
        setLoading(false);
        return;
      }
      
      try {
        const shoppingService = new ShoppingService(supabaseClient);
        const userId = user.id;
        
        const todoItems = await shoppingService.getTodoItems(userId);
        setShoppingItems(todoItems);
      } catch (error) {
        console.error('Error loading shopping data:', error);
        setShoppingItems([]);
      }
      
      setLoading(false);
    };

    loadData();
  }, [user]);

  const handleStatusChange = (itemId: string, newTodoStatus: boolean) => {
    onStatusChange?.(itemId, newTodoStatus);
    // In real app, this would update the item in the database
    // and refresh the shopping list
  };

  return (
    <View 
      style={{ 
        flex: 1, 
        backgroundColor: Colors.background.default
      }}
      testID="shopping-screen"
    >
      {/* Header - Fixed at top */}
      <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
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
      </View>

      {/* Content - Scrollable */}
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
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
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
    </View>
  );
};