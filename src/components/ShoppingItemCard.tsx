import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Card, Text, Checkbox } from 'react-native-paper';
import { ShoppingItem } from '../models/ShoppingItem';
import { Colors } from '../constants/colors';

interface ShoppingItemCardProps {
  item: ShoppingItem;
  onPress?: () => void;
  onStatusChange?: (itemId: string, newTodoStatus: boolean) => void;
}

export const ShoppingItemCard: React.FC<ShoppingItemCardProps> = ({ 
  item, 
  onPress,
  onStatusChange 
}) => {
  // Handle checkbox toggle
  const handleCheckboxPress = () => {
    onStatusChange?.(item.id, !item.todo);
  };

  const cardContent = (
    <Card 
      style={{ 
        margin: 8,
        backgroundColor: Colors.background.surface,
        borderLeftWidth: 4,
        borderLeftColor: item.todo ? Colors.primary.main : Colors.success,
        opacity: item.todo ? 1 : 0.7
      }}
      testID="shopping-item-card"
    >
      <Card.Content style={{ padding: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1, marginRight: 12 }}>
            {/* Item Name */}
            <Text 
              variant="titleMedium" 
              style={{ 
                color: Colors.text.primary,
                fontFamily: 'OpenSans-Bold',
                marginBottom: item.memo ? 4 : 0,
                textDecorationLine: item.todo ? 'none' : 'line-through'
              }}
            >
              {item.name}
            </Text>

            {/* Memo */}
            {item.memo && (
              <Text 
                variant="bodyMedium"
                style={{ 
                  color: Colors.text.secondary,
                  fontFamily: 'OpenSans-Regular',
                  textDecorationLine: item.todo ? 'none' : 'line-through'
                }}
              >
                {item.memo}
              </Text>
            )}
          </View>

          {/* Checkbox */}
          <Checkbox
            status={item.todo ? 'unchecked' : 'checked'}
            onPress={handleCheckboxPress}
            testID="shopping-item-checkbox"
            color={Colors.primary.main}
            uncheckedColor={Colors.text.secondary}
          />
        </View>
      </Card.Content>
    </Card>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress}>
        {cardContent}
      </TouchableOpacity>
    );
  }

  return cardContent;
};