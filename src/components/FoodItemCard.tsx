import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { FoodItem } from '../models/FoodItem';
import { Colors } from '../constants/colors';

interface FoodItemCardProps {
  item: FoodItem;
  onPress?: () => void;
  showControls?: boolean;
  onQuantityUpdate?: (itemId: string, newQuantity: number) => void;
  onStatusChange?: (itemId: string, newStatus: FoodItem['status']) => void;
}

export const FoodItemCard: React.FC<FoodItemCardProps> = ({ 
  item, 
  onPress, 
  showControls = false, 
  onQuantityUpdate, 
  onStatusChange 
}) => {
  // Calculate days since added
  const calculateDaysSinceAdded = (addedDate: Date): number => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - addedDate.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Get status color based on item status
  const getStatusColor = (status: FoodItem['status']): string => {
    switch (status) {
      case 'fresh':
        return Colors.success;
      case 'expired':
        return Colors.error;
      case 'frozen':
        return Colors.info;
      case 'consumed':
        return Colors.text.secondary;
      case 'disposed':
        return Colors.error;
      default:
        return Colors.text.primary;
    }
  };

  const daysSinceAdded = calculateDaysSinceAdded(item.addedDate);
  const statusColor = getStatusColor(item.status);

  // Calculate consumption period for consumed items
  const calculateConsumptionPeriod = (): number => {
    if (item.status === 'consumed') {
      const diffTime = Math.abs(item.updatedAt.getTime() - item.createdAt.getTime());
      return Math.floor(diffTime / (1000 * 60 * 60 * 24));
    }
    return 0;
  };

  // Handle consume button press
  const handleConsume = () => {
    const newQuantity = Math.max(0, item.quantity - 1);
    
    if (newQuantity === 0) {
      // Move to consumed when quantity reaches 0
      onStatusChange?.(item.id, 'consumed');
    } else {
      // Update quantity
      onQuantityUpdate?.(item.id, newQuantity);
    }
  };

  // Handle freeze button press
  const handleFreeze = () => {
    onStatusChange?.(item.id, 'frozen');
  };

  // Handle dispose button press
  const handleDispose = () => {
    onStatusChange?.(item.id, 'disposed');
  };

  const cardContent = (
    <Card 
      style={{ 
        margin: 8,
        backgroundColor: Colors.background.surface,
        borderLeftWidth: 4,
        borderLeftColor: statusColor
      }}
      testID="food-item-card"
    >
      <Card.Content style={{ padding: 16 }}>
        {/* Item Name */}
        <Text 
          variant="titleMedium" 
          style={{ 
            color: Colors.text.primary,
            fontFamily: 'OpenSans-Bold',
            marginBottom: 8
          }}
        >
          {item.name}
        </Text>

        {/* Quantity */}
        <Text 
          variant="bodyMedium"
          style={{ 
            color: Colors.text.secondary,
            fontFamily: 'OpenSans-Regular',
            marginBottom: 4
          }}
        >
          {item.quantity}{item.unit}
        </Text>

        {/* Days since added or consumption period */}
        <Text 
          variant="bodySmall"
          style={{ 
            color: Colors.text.secondary,
            fontFamily: 'OpenSans-Regular',
            marginBottom: showControls ? 12 : 0
          }}
        >
          {item.status === 'consumed' 
            ? `${calculateConsumptionPeriod()}일 동안 소비`
            : `${daysSinceAdded}일 전 추가`
          }
        </Text>

        {/* Control Buttons */}
        {showControls && item.status === 'fresh' && (
          <View 
            style={{ 
              flexDirection: 'row', 
              justifyContent: 'space-around',
              marginTop: 8
            }}
          >
            {/* Consume Button */}
            <TouchableOpacity
              onPress={handleConsume}
              testID="consume-button"
              style={{
                backgroundColor: Colors.primary,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 4,
                flex: 1,
                marginRight: 4,
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
                소비
              </Text>
            </TouchableOpacity>

            {/* Freeze Button */}
            <TouchableOpacity
              onPress={handleFreeze}
              testID="freeze-button"
              style={{
                backgroundColor: Colors.info,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 4,
                flex: 1,
                marginHorizontal: 2,
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
                냉동
              </Text>
            </TouchableOpacity>

            {/* Dispose Button */}
            <TouchableOpacity
              onPress={handleDispose}
              testID="dispose-button"
              style={{
                backgroundColor: Colors.error,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 4,
                flex: 1,
                marginLeft: 4,
                alignItems: 'center'
              }}
            >
              <Text 
                variant="bodySmall" 
                style={{ 
                  color: Colors.onError,
                  fontFamily: 'OpenSans-SemiBold'
                }}
              >
                폐기
              </Text>
            </TouchableOpacity>
          </View>
        )}
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