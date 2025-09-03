import React, { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { Surface, Text, ActivityIndicator } from 'react-native-paper';
import { Colors } from '../constants/colors';
import { getTranslation } from '../constants/translations';
import { FoodItem } from '../models/FoodItem';
import { FoodItemCard } from '../components/FoodItemCard';
import { InventoryService } from '../services/InventoryService';

interface InventoryScreenProps {
  onStatusChange?: (itemId: string, newStatus: FoodItem['status']) => void;
  onAddToShopping?: (itemName: string) => void;
}

type TabType = 'fresh' | 'frozen' | 'consumed';

export const InventoryScreen: React.FC<InventoryScreenProps> = ({ 
  onStatusChange, 
  onAddToShopping 
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('fresh');
  const [freshItems, setFreshItems] = useState<FoodItem[]>([]);
  const [frozenItems, setFrozenItems] = useState<FoodItem[]>([]);
  const [consumedItems, setConsumedItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      
      try {
        const inventoryService = new InventoryService();
        const userId = 'test-user-1'; // In real app, this would come from auth context
        
        const [freshData, frozenData, consumedData] = await Promise.all([
          inventoryService.getItemsByStatus(userId, 'fresh'),
          inventoryService.getItemsByStatus(userId, 'frozen'),
          inventoryService.getItemsByStatus(userId, 'consumed')
        ]);
        
        setFreshItems(freshData);
        setFrozenItems(frozenData);
        setConsumedItems(consumedData);
      } catch (error) {
        console.error('Error loading inventory data:', error);
        // Set empty arrays on error
        setFreshItems([]);
        setFrozenItems([]);
        setConsumedItems([]);
      }
      
      setLoading(false);
    };

    loadData();
  }, []);

  const handleStatusChange = (itemId: string, newStatus: FoodItem['status']) => {
    onStatusChange?.(itemId, newStatus);
    // In real app, this would update the item in the database
    // and refresh the appropriate lists
  };

  const handleAddToShopping = (itemName: string) => {
    onAddToShopping?.(itemName);
  };

  const removeDuplicatesByName = (items: FoodItem[]): FoodItem[] => {
    const uniqueItems = new Map<string, FoodItem>();
    
    // Sort by updatedAt descending to get latest first
    const sortedItems = [...items].sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
    
    // Keep only the latest item for each name
    sortedItems.forEach(item => {
      if (!uniqueItems.has(item.name)) {
        uniqueItems.set(item.name, item);
      }
    });
    
    return Array.from(uniqueItems.values());
  };

  const getCurrentItems = (): FoodItem[] => {
    switch (activeTab) {
      case 'fresh':
        return freshItems;
      case 'frozen':
        return frozenItems;
      case 'consumed':
        return removeDuplicatesByName(consumedItems).slice(0, 10); // Last 10, no duplicates
      default:
        return [];
    }
  };

  const getEmptyMessage = (): string => {
    switch (activeTab) {
      case 'fresh':
        return getTranslation('inventory.noItems');
      case 'frozen':
        return '냉동 보관 중인 재료가 없습니다';
      case 'consumed':
        return '지난 기록이 없습니다';
      default:
        return '항목이 없습니다';
    }
  };

  const TabButton: React.FC<{ tab: TabType; label: string }> = ({ tab, label }) => (
    <TouchableOpacity
      onPress={() => setActiveTab(tab)}
      style={{
        flex: 1,
        paddingVertical: 12,
        backgroundColor: activeTab === tab ? Colors.primary : Colors.background.surface,
        borderRadius: 8,
        marginHorizontal: 4,
        alignItems: 'center'
      }}
    >
      <Text
        variant="bodyMedium"
        style={{
          color: activeTab === tab ? Colors.onPrimary : Colors.text.primary,
          fontFamily: 'OpenSans-SemiBold'
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <Surface 
      style={{ 
        flex: 1, 
        backgroundColor: Colors.background.default,
        padding: 16
      }}
      testID="inventory-screen"
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
        재고 목록
      </Text>
      
      {/* Tab Navigation */}
      <View 
        style={{ 
          flexDirection: 'row', 
          marginBottom: 16,
          backgroundColor: Colors.background.surface,
          borderRadius: 12,
          padding: 4
        }}
      >
        <TabButton tab="fresh" label="재고목록" />
        <TabButton tab="frozen" label="냉동보관" />
        <TabButton tab="consumed" label="지난기록" />
      </View>

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
          {getCurrentItems().length === 0 ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 40 }}>
              <Text 
                variant="bodyMedium"
                style={{ 
                  color: Colors.text.secondary,
                  fontFamily: 'OpenSans-Regular',
                  textAlign: 'center'
                }}
              >
                {getEmptyMessage()}
              </Text>
            </View>
          ) : (
            getCurrentItems().map(item => (
              <View key={item.id}>
                <FoodItemCard 
                  item={item}
                  showControls={activeTab === 'fresh'}
                  onStatusChange={handleStatusChange}
                />
                
                {/* Frozen-specific controls */}
                {activeTab === 'frozen' && (
                  <View style={{ marginHorizontal: 16, marginBottom: 8 }}>
                    <Text 
                      variant="bodySmall" 
                      style={{ 
                        color: Colors.text.secondary,
                        marginBottom: 8
                      }}
                    >
                      냉동 날짜: {new Date(item.updatedAt).toLocaleDateString()}
                    </Text>
                    <TouchableOpacity
                      onPress={() => handleStatusChange(item.id, 'fresh')}
                      testID={`unfreeze-button-${item.id}`}
                      style={{
                        backgroundColor: Colors.success,
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        borderRadius: 4,
                        alignItems: 'center'
                      }}
                    >
                      <Text 
                        variant="bodySmall" 
                        style={{ 
                          color: Colors.onPrimary,
                          fontFamily: 'OpenSans-SemiBold'
                        }}
                      >
                        해동하기
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Consumed-specific controls */}
                {activeTab === 'consumed' && (
                  <View style={{ marginHorizontal: 16, marginBottom: 8 }}>
                    <TouchableOpacity
                      onPress={() => handleAddToShopping(item.name)}
                      testID={`add-to-shopping-${item.id}`}
                      style={{
                        backgroundColor: Colors.info,
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        borderRadius: 4,
                        alignItems: 'center'
                      }}
                    >
                      <Text 
                        variant="bodySmall" 
                        style={{ 
                          color: Colors.onPrimary,
                          fontFamily: 'OpenSans-SemiBold'
                        }}
                      >
                        장보기 목록에 추가
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))
          )}
        </ScrollView>
      )}
    </Surface>
  );
};