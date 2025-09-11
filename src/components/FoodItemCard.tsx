import React from 'react';
import { View, Image, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import { Surface, Text, IconButton, ProgressBar } from 'react-native-paper';
import { FoodItem } from '../models/FoodItem';
import { Colors } from '../constants/colors';
import { Spacing } from '../constants/spacing';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface FoodItemCardProps {
  item: FoodItem;
  showControls?: boolean;
  onStatusChange?: (itemId: string, newStatus: FoodItem['status']) => void;
  onDelete?: (itemId: string) => void;
  onPress?: (item: FoodItem) => void;
}

export const FoodItemCard: React.FC<FoodItemCardProps> = ({ 
  item, 
  showControls = true,
  onStatusChange,
  onDelete,
  onPress
}) => {
  const handleDelete = (e?: any) => {
    // Prevent event bubbling
    e?.stopPropagation?.();
    
    console.log('Delete button clicked for item:', item.name, item.id);
    
    // For web, use window.confirm as a fallback
    if (Platform.OS === 'web') {
      const confirmDelete = window.confirm(`"${item.name}"을(를) 삭제하시겠습니까?`);
      if (confirmDelete) {
        console.log('Calling onDelete for item:', item.id);
        onDelete?.(item.id);
      }
    } else {
      // For mobile, use React Native Alert
      Alert.alert(
        '삭제 확인',
        `"${item.name}"을(를) 삭제하시겠습니까?`,
        [
          {
            text: '취소',
            style: 'cancel',
          },
          {
            text: '삭제',
            onPress: () => {
              console.log('Calling onDelete for item:', item.id);
              onDelete?.(item.id);
            },
            style: 'destructive',
          },
        ],
      );
    }
  };

  const handlePress = () => {
    onPress?.(item);
  };

  const formattedDate = format(item.addedDate, 'MM/dd', { locale: ko });
  const remainsPercent = (item.remains || 1) * 100;

  // Calculate days until expiry using storageDays if available
  const today = new Date();
  today.setHours(0, 0, 0, 0); // 날짜만 비교하기 위해 시간 초기화
  
  let expiryDate: Date;
  if (item.storageDays && item.addedDate) {
    // Calculate expiry date from addedDate + storageDays
    expiryDate = new Date(item.addedDate);
    expiryDate.setDate(expiryDate.getDate() + item.storageDays);
  } else {
    // Use the provided expiryDate
    expiryDate = new Date(item.expiryDate);
  }
  expiryDate.setHours(0, 0, 0, 0);
  
  const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  // Calculate percentage of storage days remaining
  const storageDays = item.storageDays || 7;
  const daysElapsed = Math.floor((today.getTime() - new Date(item.addedDate).getTime()) / (1000 * 60 * 60 * 24));
  const daysRemaining = storageDays - daysElapsed;
  const percentRemaining = (daysRemaining / storageDays) * 100;
  
  // Format D-day display with color based on percentage
  let dDayText = '';
  let dDayBackgroundColor = '';
  let dDayTextColor = '#FFFFFF'; // White text on colored background
  
  if (daysUntilExpiry < 0) {
    // Expired
    dDayText = `D+${Math.abs(daysUntilExpiry)}`;
    dDayBackgroundColor = '#F44336'; // Red
  } else if (daysUntilExpiry === 0) {
    dDayText = 'D-Day';
    dDayBackgroundColor = '#FF9800'; // Orange
  } else {
    dDayText = `D-${daysUntilExpiry}`;
    
    if (percentRemaining > 50) {
      // Fresh (> 50%)
      dDayBackgroundColor = '#4CAF50'; // Green
    } else if (percentRemaining > 20) {
      // Caution (20-50%)
      dDayBackgroundColor = '#FFC107'; // Yellow
      dDayTextColor = '#000000'; // Black text on yellow background
    } else {
      // Warning (<= 20%)
      dDayBackgroundColor = '#FF9800'; // Orange
    }
  }

  return (
    <Surface style={styles.container} elevation={1}>
      {/* Delete Button - positioned absolutely at top-right */}
      {showControls && (
        <IconButton
          icon="close"
          size={20}
          iconColor={Colors.text.secondary}
          onPress={handleDelete}
          style={styles.deleteButton}
        />
      )}
      
      <TouchableOpacity 
        style={styles.content}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <View style={styles.mainContent}>
          {/* Thumbnail Image */}
          <View style={styles.thumbnailContainer}>
            {item.thumbnail ? (
              <Image
                source={{ uri: item.thumbnail }}
                style={styles.thumbnail}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.thumbnail, styles.placeholderThumbnail]}>
                <Text style={styles.placeholderText}>
                  {item.name.charAt(0)}
                </Text>
              </View>
            )}
          </View>

          {/* Item Details */}
          <View style={styles.detailsContainer}>
            {/* Name Row */}
            <Text 
              variant="titleMedium" 
              style={styles.name}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {item.name}
            </Text>
            
            {/* Registration Date and D-day Row */}
            <View style={styles.infoRow}>
              <Text variant="bodySmall" style={styles.infoText}>
                등록: {formattedDate}
              </Text>
              <View style={[styles.dDayBadge, { backgroundColor: dDayBackgroundColor }]}>
                <Text 
                  variant="bodySmall" 
                  style={[styles.dDayText, { color: dDayTextColor }]}
                >
                  {dDayText}
                </Text>
              </View>
            </View>
            
            {/* Quantity and Remains Row */}
            <View style={[styles.infoRow, { marginBottom: 2 }]}>
              <Text variant="bodySmall" style={styles.infoText}>
                수량: {item.quantity}{item.unit}
              </Text>
              <Text variant="bodySmall" style={styles.infoText}>
                {Math.round(remainsPercent)}%
              </Text>
            </View>

            {/* Progress Bar */}
            <ProgressBar 
              progress={item.remains || 1} 
              color={Colors.primary.main}
              style={styles.progressBar}
            />
          </View>
        </View>
      </TouchableOpacity>
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background.paper,
    borderRadius: 16,
    marginBottom: 2,
    marginHorizontal: Spacing.sm,
    position: 'relative',
    borderWidth: 1,
    borderColor: Colors.border.light,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  mainContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumbnailContainer: {
    marginRight: Spacing.md,
  },
  thumbnail: {
    width: 128,
    height: 128,
    borderRadius: 12,
  },
  placeholderThumbnail: {
    backgroundColor: Colors.background.level3,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  placeholderText: {
    fontSize: 28,
    color: Colors.text.secondary,
    fontFamily: 'OpenSans-SemiBold',
  },
  detailsContainer: {
    flex: 1,
    // Removed paddingRight - the content padding handles the spacing symmetrically
  },
  name: {
    color: Colors.text.primary,
    fontFamily: 'OpenSans-Bold',
    marginBottom: Spacing.lg,  // Increased to match and be 1.2x wider
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,  // Same spacing as name for consistency
  },
  infoText: {
    color: Colors.text.secondary,
    fontFamily: 'OpenSans-Regular',
    fontSize: 13,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.border.light,
    marginTop: 8,
    overflow: 'hidden',
  },
  deleteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    margin: 0,
    zIndex: 1,
  },
  dDayBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  dDayText: {
    fontFamily: 'OpenSans-Bold',
    fontSize: 12,
    fontWeight: '600',
  },
});