import React, { useState } from 'react';
import { View, Image, TouchableOpacity, StyleSheet, Alert, Platform, Pressable } from 'react-native';
import { Card, Text, IconButton, ProgressBar } from 'react-native-paper';
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
  const [imageError, setImageError] = useState(false);

  const handleDelete = () => {
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
    console.log('Card pressed for item:', item.name);
    onPress?.(item);
  };

  const formattedDate = format(item.addedDate, 'MM/dd', { locale: ko });
  const remainsPercent = (item.remains || 1) * 100;
  const isFrozen = item.status === 'frozen';

  // Calculate days until expiry using storageDays if available
  const today = new Date();
  today.setHours(0, 0, 0, 0); // 날짜만 비교하기 위해 시간 초기화

  // Calculate frozen date and days if frozen
  let frozenDate: Date | null = null;
  let frozenDays = 0;
  let formattedFrozenDate = '';

  if (isFrozen) {
    frozenDate = item.frozenDate ? new Date(item.frozenDate) : new Date(item.addedDate);
    frozenDate.setHours(0, 0, 0, 0);
    frozenDays = Math.floor((today.getTime() - frozenDate.getTime()) / (1000 * 60 * 60 * 24));
    formattedFrozenDate = format(frozenDate, 'MM/dd', { locale: ko });
  }

  // Calculate days remaining using storageDays (consistent with CookingScreen)
  const storageDays = item.storageDays || 7;
  const addedDate = new Date(item.addedDate);
  addedDate.setHours(0, 0, 0, 0);
  const daysElapsed = Math.floor((today.getTime() - addedDate.getTime()) / (1000 * 60 * 60 * 24));
  const daysRemaining = storageDays - daysElapsed;
  const percentRemaining = (daysRemaining / storageDays) * 100;

  // Format D-day display with color based on percentage
  let dDayText = '';
  let dDayBackgroundColor = '';
  let dDayTextColor = '#FFFFFF'; // White text on colored background

  if (daysRemaining < 0) {
    // Expired
    dDayText = `D+${Math.abs(daysRemaining)}`;
    dDayBackgroundColor = '#F44336'; // Red
  } else if (daysRemaining === 0) {
    dDayText = 'D-Day';
    dDayBackgroundColor = '#FF9800'; // Orange
  } else {
    dDayText = `D-${daysRemaining}`;

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
    <Card style={styles.container} mode="outlined">
      <Pressable
        style={styles.content}
        onPress={handlePress}
        android_ripple={{ color: 'rgba(0, 0, 0, 0.1)' }}
      >
        <View style={styles.mainContent}>
          {/* Thumbnail Image */}
          <View style={styles.thumbnailContainer}>
            {item.thumbnail && !imageError ? (
              <Image
                source={{ uri: item.thumbnail }}
                style={styles.thumbnail}
                resizeMode="cover"
                onError={(e) => {
                  console.error('Image loading error:', e.nativeEvent.error);
                  console.log('Failed to load image:', item.thumbnail);
                  console.log('Image URL type:', item.thumbnail?.startsWith('blob:') ? 'blob URL' :
                                                  item.thumbnail?.startsWith('http') ? 'HTTP URL' : 'Unknown');
                  setImageError(true);
                }}
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

            {/* Registration/Frozen Date and D-day/Frozen days Row */}
            <View style={[styles.infoRow, { flex: 1, alignItems: 'center' }]}>
              <Text variant="bodySmall" style={styles.infoText}>
                {isFrozen ? `냉동: ${formattedFrozenDate}` : `등록: ${formattedDate}`}
              </Text>
              {isFrozen ? (
                <View style={[styles.dDayBadge, { backgroundColor: '#4A90E2' }]}>
                  <Text
                    variant="bodySmall"
                    style={[styles.dDayText, { color: '#FFFFFF' }]}
                  >
                    {frozenDays}일
                  </Text>
                </View>
              ) : dDayText ? (
                <View style={[styles.dDayBadge, { backgroundColor: dDayBackgroundColor }]}>
                  <Text
                    variant="bodySmall"
                    style={[styles.dDayText, { color: dDayTextColor }]}
                  >
                    {dDayText}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Quantity and Remains Row */}
            <View style={styles.infoRow}>
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
              color={isFrozen ? '#4A90E2' : Colors.primary.main}
              style={styles.progressBar}
            />
          </View>
        </View>

        {/* Delete Button - positioned absolutely but inside Pressable */}
        {showControls && (
          <Pressable
            style={styles.deleteButtonWrapper}
            onPress={handleDelete}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <IconButton
              icon="close"
              size={20}
              iconColor={Colors.text.secondary}
              style={styles.deleteButton}
              disabled={true}
              pointerEvents="none"
            />
          </Pressable>
        )}
      </Pressable>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background.paper,
    borderRadius: 12,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border.light,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    position: 'relative',
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
    paddingRight: 30, // Make room for delete button
    justifyContent: 'space-between', // Distribute space evenly
    height: 128, // Match thumbnail height
  },
  name: {
    color: Colors.text.primary,
    fontFamily: 'OpenSans-Bold',
    marginBottom: 0, // Remove bottom margin
    marginTop: -2, // Fine tune alignment with thumbnail top
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 0, // Remove spacing
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
  deleteButtonWrapper: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
  },
  deleteButton: {
    margin: 0,
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