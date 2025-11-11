import React, { useState, useEffect } from 'react';
import { View, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Card, Text, ProgressBar, IconButton } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { FoodItem } from '../models/FoodItem';
import { Colors } from '../constants/colors';
import { Spacing } from '../constants/spacing';
import { format, differenceInDays } from 'date-fns';
import { ko, enUS } from 'date-fns/locale';

interface HistoryCardProps {
  item: FoodItem;
  onPress?: (item: FoodItem) => void;
  onAddToShopping?: (item: FoodItem, isAdded: boolean) => void;
  isInShoppingList?: boolean;
}

export const HistoryCard: React.FC<HistoryCardProps> = ({
  item,
  onPress,
  onAddToShopping,
  isInShoppingList = false
}) => {
  const [isAddedToShopping, setIsAddedToShopping] = useState(isInShoppingList);
  const { t, i18n } = useTranslation('inventory');

  useEffect(() => {
    setIsAddedToShopping(isInShoppingList);
  }, [isInShoppingList]);

  const handlePress = () => {
    onPress?.(item);
  };

  const handleToggleShopping = () => {
    const newState = !isAddedToShopping;
    setIsAddedToShopping(newState);
    onAddToShopping?.(item, newState);
  };

  // Format dates
  const addedDate = format(item.addedDate, i18n.language === 'en' ? 'MMM dd' : 'MM/dd', { locale: i18n.language === 'en' ? enUS : ko });
  const consumedDate = item.consumedAt ? format(item.consumedAt, i18n.language === 'en' ? 'MMM dd' : 'MM/dd', { locale: i18n.language === 'en' ? enUS : ko }) : '';
  
  // Calculate consumption period
  const consumptionDays = item.consumedAt 
    ? differenceInDays(item.consumedAt, item.addedDate) 
    : 0;
  
  // Calculate usage ratio
  const totalAmount = (item.totalUsed || 0) + (item.totalWasted || 0);
  const usageRatio = totalAmount > 0 ? (item.totalUsed || 0) / totalAmount : 1;
  const wasteRatio = totalAmount > 0 ? (item.totalWasted || 0) / totalAmount : 0;

  // Check if item was 100% consumed without waste
  const isFullyConsumed = usageRatio === 1 && wasteRatio === 0;

  return (
    <Card style={styles.container} mode="outlined">
      <View
        style={styles.content}
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
            {/* Checkmark for 100% consumed items */}
            {isFullyConsumed && (
              <View style={styles.checkmarkBadge}>
                <MaterialCommunityIcons
                  name="thumb-up-outline"
                  size={24}
                  color={Colors.primary.main}
                />
              </View>
            )}
          </View>

          {/* Item Details */}
          <View style={styles.detailsContainer}>
            {/* Name and Quantity Row */}
            <Text 
              variant="titleMedium" 
              style={styles.name}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {item.name} ({item.quantity}{i18n.language === 'en' && item.unit === '개' ? t('itemDetail.pieces') : i18n.language === 'en' && item.unit === '팩' ? t('itemDetail.packs') : item.unit})
            </Text>
            
            {/* Consumption Period Row */}
            <View style={styles.infoRow}>
              <Text variant="bodySmall" style={styles.infoText}>
                {i18n.language === 'en' ? 'Period' : '소비기간'}: {addedDate} ~ {consumedDate}
              </Text>
            </View>

            {/* Usage Ratio Bar */}
            <View style={styles.ratioBarContainer}>
              {/* Red background for waste */}
              <View style={styles.wasteBackground} />
              {/* Green overlay for usage */}
              <View style={[styles.usageOverlay, { width: `${usageRatio * 100}%` }]} />
            </View>

            {/* Usage Labels Row - Below the bar */}
            <View style={styles.usageLabelsRow}>
              <Text variant="bodySmall" style={[styles.usageLabel, { color: '#4CAF50' }]}>
                {i18n.language === 'en' ? 'Used' : '사용'} {Math.round(usageRatio * 100)}%
              </Text>
              {wasteRatio > 0 && (
                <Text variant="bodySmall" style={[styles.usageLabel, { color: '#F44336' }]}>
                  {i18n.language === 'en' ? 'Wasted' : '폐기'} {Math.round(wasteRatio * 100)}%
                </Text>
              )}
            </View>
          </View>
        </View>
        
        {/* Shopping Cart Button with Toggle */}
        <View style={styles.shoppingButtonContainer}>
          <IconButton
            icon="cart-outline"
            mode="outlined"
            iconColor={isAddedToShopping ? Colors.primary.main : Colors.text.disabled}
            size={24}
            onPress={handleToggleShopping}
            style={[
              styles.shoppingButton,
              !isAddedToShopping && styles.shoppingButtonInactive,
              isAddedToShopping && styles.shoppingButtonActive
            ]}
          />
          {/* Add/Check Badge */}
          <TouchableOpacity 
            style={[
              styles.addBadge,
              isAddedToShopping && styles.addBadgeActive
            ]}
            onPress={handleToggleShopping}
            activeOpacity={0.7}
          >
            <IconButton
              icon={isAddedToShopping ? "check" : "plus"}
              iconColor="white"
              size={12}
              style={styles.addBadgeIcon}
            />
          </TouchableOpacity>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background.paper,
    borderRadius: 12,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    position: 'relative',
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
    padding: Spacing.sm,  // Reduced padding from lg to sm
  },
  mainContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumbnailContainer: {
    marginRight: Spacing.md,
    position: 'relative',
  },
  thumbnail: {
    width: 64,
    height: 64,
    borderRadius: 8,
    opacity: 0.7, // Slightly faded for consumed items
  },
  placeholderThumbnail: {
    backgroundColor: Colors.background.default,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
    opacity: 0.7,
  },
  placeholderText: {
    fontSize: 18,
    color: Colors.text.secondary,
    fontFamily: 'OpenSans-SemiBold',
  },
  checkmarkBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsContainer: {
    flex: 1,
  },
  name: {
    color: Colors.text.secondary, // Grayed out for consumed items
    fontFamily: 'OpenSans-Bold',
    marginBottom: Spacing.xs,  // Reduced spacing
    fontSize: 14,  // Slightly smaller font
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,  // Reduced spacing
  },
  infoText: {
    color: Colors.text.secondary,
    fontFamily: 'OpenSans-Regular',
    fontSize: 11,  // Reduced font size
  },
  usageLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,  // Above the bar -> Below the bar
  },
  usageLabel: {
    fontFamily: 'OpenSans-Bold',
    fontSize: 10,  // Reduced font size
  },
  ratioBarContainer: {
    height: 6,  // Reduced height
    borderRadius: 3,
    backgroundColor: 'transparent',
    position: 'relative',
    overflow: 'hidden',
    marginTop: 4,  // Add spacing above the bar
  },
  wasteBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#F44336',  // Red - same as D-day
    borderRadius: 4,
  },
  usageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    backgroundColor: '#4CAF50',  // Green - same as D-day
    borderRadius: 4,
  },
  shoppingButtonContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.md,  // Same as thumbnail margin to balance layout
    position: 'relative',
  },
  shoppingButton: {
    margin: 0,
    width: 48,
    height: 48,
  },
  shoppingButtonInactive: {
    borderColor: Colors.text.disabled,  // Disabled color when not selected
  },
  shoppingButtonActive: {
    backgroundColor: '#EAF5F2',  // Light mint background when selected
    borderColor: Colors.primary.main,
  },
  addBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.text.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  addBadgeActive: {
    backgroundColor: Colors.primary.dark,
  },
  addBadgeIcon: {
    margin: 0,
    padding: 0,
  },
});