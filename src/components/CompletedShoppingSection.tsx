import React, { useState, useEffect } from 'react';
import { View, ScrollView } from 'react-native';
import { Text, ActivityIndicator, Card } from 'react-native-paper';
import { Colors } from '../constants/colors';
import { ShoppingItem } from '../models/ShoppingItem';
import { ShoppingService } from '../services/ShoppingService';

export const CompletedShoppingSection: React.FC = () => {
  const [completedItems, setCompletedItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadCompletedItems = async () => {
      setLoading(true);
      setError('');
      
      try {
        const shoppingService = new ShoppingService();
        const userId = 'test-user-1'; // In real app, this would come from auth context
        
        const completedData = await shoppingService.getItemsByTodoStatus(userId, false);
        
        // Sort by completion date (updatedAt) in descending order and take last 5
        const sortedItems = completedData
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
          .slice(0, 5);
        
        setCompletedItems(sortedItems);
      } catch (err) {
        console.error('Error loading completed shopping items:', err);
        setError('완료한 항목을 불러오는 중 오류가 발생했습니다');
        setCompletedItems([]);
      }
      
      setLoading(false);
    };

    loadCompletedItems();
  }, []);

  // Group items by completion date
  const groupItemsByDate = (items: ShoppingItem[]) => {
    const grouped: { [key: string]: ShoppingItem[] } = {};
    
    items.forEach(item => {
      const dateKey = new Date(item.updatedAt).toDateString();
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(item);
    });
    
    return grouped;
  };

  // Format date to Korean format
  const formatKoreanDate = (date: Date): string => {
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const groupedItems = groupItemsByDate(completedItems);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <ActivityIndicator 
          animating={true} 
          color={Colors.primary.main}
          testID="loading-indicator"
          style={{ marginBottom: 16 }}
        />
        <Text 
          variant="bodyMedium"
          style={{ 
            color: Colors.text.secondary,
            fontFamily: 'OpenSans-Regular',
            textAlign: 'center'
          }}
        >
          완료한 항목을 불러오는 중...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text 
          variant="bodyMedium"
          style={{ 
            color: Colors.error,
            fontFamily: 'OpenSans-Regular',
            textAlign: 'center'
          }}
        >
          {error}
        </Text>
      </View>
    );
  }

  if (completedItems.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text 
          variant="bodyMedium"
          style={{ 
            color: Colors.text.secondary,
            fontFamily: 'OpenSans-Regular',
            textAlign: 'center'
          }}
        >
          완료한 쇼핑 항목이 없습니다
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, padding: 16 }}>
      {Object.entries(groupedItems)
        .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
        .map(([dateKey, items]) => (
          <View key={dateKey} style={{ marginBottom: 24 }}>
            {/* Date Header */}
            <Text 
              variant="titleMedium"
              style={{
                color: Colors.text.primary,
                fontFamily: 'OpenSans-SemiBold',
                marginBottom: 12
              }}
            >
              {formatKoreanDate(new Date(dateKey))}
            </Text>
            
            {/* Items for this date */}
            {items.map(item => (
              <Card 
                key={item.id}
                style={{ 
                  marginBottom: 8,
                  backgroundColor: Colors.background.surface
                }}
                testID="completed-shopping-item"
              >
                <Card.Content style={{ padding: 16 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1 }}>
                      {/* Item Name */}
                      <Text 
                        variant="bodyLarge"
                        style={{
                          color: Colors.text.primary,
                          fontFamily: 'OpenSans-SemiBold',
                          marginBottom: item.memo ? 4 : 0
                        }}
                      >
                        {item.name}
                      </Text>
                      
                      {/* Item Memo */}
                      {item.memo && (
                        <Text 
                          variant="bodyMedium"
                          style={{
                            color: Colors.text.secondary,
                            fontFamily: 'OpenSans-Regular',
                            marginBottom: 4
                          }}
                        >
                          {item.memo}
                        </Text>
                      )}
                      
                      {/* Completion Date */}
                      <Text 
                        variant="bodySmall"
                        style={{
                          color: Colors.text.tertiary,
                          fontFamily: 'OpenSans-Regular'
                        }}
                      >
                        완료: {formatKoreanDate(new Date(item.updatedAt))}
                      </Text>
                    </View>
                  </View>
                </Card.Content>
              </Card>
            ))}
          </View>
        ))}
    </ScrollView>
  );
};