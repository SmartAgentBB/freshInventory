import React, { useState, useEffect, useRef } from 'react';
import { View, ScrollView, StyleSheet, Image, Dimensions, Platform, Alert, TouchableOpacity } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { RecipeCard } from '../components/RecipeCard';
import {
  Surface,
  Text,
  IconButton,
  Button,
  Portal,
  Dialog,
  Paragraph,
  useTheme
} from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { FoodItem } from '../models/FoodItem';
import { InventoryService } from '../services/InventoryService';
import { StorageInfoService } from '../services/StorageInfoService';
import { RecipeService } from '../services/RecipeService';
import { Recipe, AIService } from '../services/AIService';
import { supabaseClient } from '../services/supabaseClient';
import { Colors } from '../constants/colors';
import { Spacing } from '../constants/spacing';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useAuth } from '../hooks/useAuth';

const { width: screenWidth } = Dimensions.get('window');

export const ItemDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const theme = useTheme();
  const { user } = useAuth();
  const [item, setItem] = useState<FoodItem | null>(null);
  const [currentRemains, setCurrentRemains] = useState(100);
  const [storageInfoModalVisible, setStorageInfoModalVisible] = useState(false);
  const [storageInfo, setStorageInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [relatedRecipes, setRelatedRecipes] = useState<Recipe[]>([]);
  const [isRecommending, setIsRecommending] = useState(false);

  const inventoryService = useRef(new InventoryService(
    supabaseClient,
    process.env.EXPO_PUBLIC_GEMINI_API_KEY
  )).current;

  const storageInfoService = useRef(new StorageInfoService(
    supabaseClient,
    process.env.EXPO_PUBLIC_GEMINI_API_KEY
  )).current;

  const recipeService = useRef(new RecipeService()).current;

  const aiService = useRef(new AIService(
    process.env.EXPO_PUBLIC_GEMINI_API_KEY || ''
  )).current;

  useEffect(() => {
    const params = route.params as { item?: FoodItem };
    if (params?.item) {
      setItem(params.item);
      setCurrentRemains(Math.round((params.item.remains || 1) * 100));
      loadStorageInfo(params.item.name);
      if (user?.id) {
        loadRelatedRecipes(params.item.name);
      }
    }
  }, [route.params, user]);

  const loadStorageInfo = async (itemName: string) => {
    try {
      const info = await storageInfoService.getStorageInfo(itemName);
      setStorageInfo(info);
    } catch (error) {
      console.error('Error loading storage info:', error);
    }
  };

  const loadRelatedRecipes = async (itemName: string) => {
    if (!user?.id) {
      return;
    }

    try {
      // Get all bookmarked recipes
      const bookmarkedRecipes = await recipeService.getBookmarkedRecipes(user.id);

      // Filter recipes that contain this ingredient
      const related = bookmarkedRecipes.filter(recipe => {
        const hasIngredient = recipe.ingredients.some(ingredient => {
          // Extract just the ingredient name (remove quantity and unit)
          // e.g., "표고버섯 2개" -> "표고버섯"
          const ingredientName = ingredient.split(/\s+\d+/)[0].trim();

          // Remove spaces and special characters for better matching
          const normalizedIngredient = ingredientName.replace(/\s+/g, '').toLowerCase();
          const normalizedItemName = itemName.replace(/\s+/g, '').toLowerCase();

          const matches = normalizedIngredient.includes(normalizedItemName) ||
                         normalizedItemName.includes(normalizedIngredient) ||
                         ingredientName.toLowerCase().includes(itemName.toLowerCase()) ||
                         itemName.toLowerCase().includes(ingredientName.toLowerCase());

          return matches;
        });
        return hasIngredient;
      });

      // Convert SavedRecipe to Recipe format
      const recipes: Recipe[] = related.map(r => ({
        name: r.name,
        ingredients: r.ingredients,
        difficulty: r.difficulty,
        cookingTime: r.cookingTime,
        instructions: r.instructions || []
      }));

      setRelatedRecipes(recipes);
    } catch (error) {
      console.error('Error loading related recipes:', error);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleGetRecommendations = async () => {
    if (!item) return;

    setIsRecommending(true);
    try {
      // Get recipe recommendations for this specific ingredient
      const result = await aiService.generateRecipeSuggestions([item.name]);
      const recommendations = result.success ? result.recipes : [];

      if (recommendations && recommendations.length > 0) {
        // Navigate to Cooking screen with recommendations
        navigation.navigate('Cooking' as never, {
          screen: 'CookingMain',
          params: {
            showRecommendations: true,
            recommendations: recommendations,
            fromIngredient: item.name
          }
        } as never);
      } else {
        Alert.alert('알림', '추천 레시피를 가져올 수 없습니다.');
      }
    } catch (error) {
      console.error('Error getting recommendations:', error);
      Alert.alert('오류', '레시피 추천 중 오류가 발생했습니다.');
    } finally {
      setIsRecommending(false);
    }
  };

  const handleSliderChange = (value: number) => {
    // 기존 남은양보다 작게만 조절 가능 (0 ~ 기존값 범위)
    const originalRemains = Math.round((item?.remains || 1) * 100);
    if (value >= 0 && value <= originalRemains) {
      setCurrentRemains(Math.round(value));
    }
  };

  const handleUpdateRemains = async () => {
    if (!item) return;
    
    setIsLoading(true);
    try {
      const newRemains = currentRemains / 100;
      const oldRemains = item.remains || 1;
      
      // Add history record if remains changed
      if (Math.abs(oldRemains - newRemains) > 0.01) {
        await inventoryService.addHistoryRecord(
          item.id,
          oldRemains,     // remain_before
          newRemains,     // remain_after
          false           // waste = false for normal consumption
        );
      }
      
      // Update item
      await inventoryService.updateItem(item.id, {
        remains: newRemains
      });
      
      // Navigate back with updated item
      navigation.goBack();
    } catch (error) {
      console.error('Error updating remains:', error);
      Alert.alert('오류', '남은 양 업데이트에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConsume = async () => {
    if (!item) return;
    
    const confirmMessage = Platform.OS === 'web' 
      ? window.confirm(`"${item.name}"을(를) 소비 처리하시겠습니까?`)
      : true;

    if (Platform.OS !== 'web') {
      Alert.alert(
        '소비 확인',
        `"${item.name}"을(를) 소비 처리하시겠습니까?`,
        [
          { text: '취소', style: 'cancel' },
          { 
            text: '소비', 
            onPress: async () => {
              await processConsume();
            }
          }
        ]
      );
    } else if (confirmMessage) {
      await processConsume();
    }
  };

  const processConsume = async () => {
    if (!item) return;
    
    setIsLoading(true);
    try {
      // Add history record for consumption
      await inventoryService.addHistoryRecord(
        item.id,
        item.remains || 1,  // remain_before
        0,                   // remain_after (consumed)
        false                // waste = false for normal consumption
      );
      
      // Update item status to consumed and set remains to 0
      await inventoryService.updateItem(item.id, {
        status: 'consumed',
        remains: 0
      });
      navigation.goBack();
    } catch (error) {
      console.error('Error consuming item:', error);
      Alert.alert('오류', '소비 처리에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFreeze = async () => {
    if (!item) return;
    
    setIsLoading(true);
    try {
      await inventoryService.updateItem(item.id, {
        status: 'frozen',
        frozenDate: new Date()
      });
      navigation.goBack();
    } catch (error) {
      console.error('Error freezing item:', error);
      Alert.alert('오류', '냉동 처리에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDispose = async () => {
    if (!item) return;
    
    const confirmMessage = Platform.OS === 'web' 
      ? window.confirm(`"${item.name}"을(를) 폐기 처리하시겠습니까?`)
      : true;

    if (Platform.OS !== 'web') {
      Alert.alert(
        '폐기 확인',
        `"${item.name}"을(를) 폐기 처리하시겠습니까?`,
        [
          { text: '취소', style: 'cancel' },
          { 
            text: '폐기', 
            onPress: async () => {
              await processDispose();
            },
            style: 'destructive'
          }
        ]
      );
    } else if (confirmMessage) {
      await processDispose();
    }
  };

  const processDispose = async () => {
    if (!item) return;
    
    setIsLoading(true);
    try {
      // Add history record for disposal
      await inventoryService.addHistoryRecord(
        item.id,
        item.remains || 1,  // remain_before
        0,                   // remain_after (disposed)
        true                 // waste = true for disposal
      );
      
      // Update item status
      await inventoryService.updateItem(item.id, {
        status: 'disposed',
        remains: 0
      });
      navigation.goBack();
    } catch (error) {
      console.error('Error disposing item:', error);
      Alert.alert('오류', '폐기 처리에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!item) {
    return (
      <Surface style={styles.container}>
        <Text>항목을 불러오는 중...</Text>
      </Surface>
    );
  }

  // Calculate D-day
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let expiryDate: Date;
  if (item.storageDays && item.addedDate) {
    expiryDate = new Date(item.addedDate);
    expiryDate.setDate(expiryDate.getDate() + item.storageDays);
  } else {
    expiryDate = new Date(item.expiryDate);
  }
  expiryDate.setHours(0, 0, 0, 0);
  
  const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const dDayText = daysUntilExpiry < 0 
    ? `D+${Math.abs(daysUntilExpiry)}일`
    : daysUntilExpiry === 0 
    ? 'D-Day' 
    : `D-${daysUntilExpiry}일`;

  // Calculate frozen days if item is frozen
  let frozenDays = 0;
  let frozenDateFormatted = '';
  const isFrozen = item.status === 'frozen';
  if (isFrozen && item.frozenDate) {
    const frozenDate = new Date(item.frozenDate);
    frozenDate.setHours(0, 0, 0, 0);
    // Add 1 to include today (day 0 for today)
    frozenDays = Math.floor((today.getTime() - frozenDate.getTime()) / (1000 * 60 * 60 * 24));
    frozenDateFormatted = format(frozenDate, 'MM/dd', { locale: ko });
  } else if (isFrozen && !item.frozenDate) {
    // If frozen but no frozen date, use added date as frozen date
    const frozenDate = new Date(item.addedDate);
    frozenDate.setHours(0, 0, 0, 0);
    // Add 1 to include today (day 0 for today)
    frozenDays = Math.floor((today.getTime() - frozenDate.getTime()) / (1000 * 60 * 60 * 24));
    frozenDateFormatted = format(frozenDate, 'MM/dd', { locale: ko });
  }

  return (
    <Surface style={styles.container}>
      {/* Header - Same height as InventoryScreen tabs */}
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={handleBack}
          style={styles.backButton}
        />
        <Text variant="labelLarge" style={styles.headerTitle}>
          {item.name}
        </Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Thumbnail Image */}
        <Surface style={styles.imageCard} elevation={1}>
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
        </Surface>

        {/* Info Table Card */}
        <Surface style={styles.infoCard} elevation={1}>
          <View style={styles.tableContainer}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <View style={[styles.tableCell, styles.tableCellSmall]}>
                <Text variant="labelMedium" style={styles.headerText}>
                  등록일
                </Text>
              </View>
              <View style={[styles.tableCell, styles.tableCellLarge, styles.tableCellBorder]}>
                <Text variant="labelMedium" style={styles.headerText}>
                  {isFrozen ? '냉동중❄️' : '소비기한'}
                </Text>
              </View>
              <View style={[styles.tableCell, styles.tableCellSmall, styles.tableCellBorder]}>
                <Text variant="labelMedium" style={styles.headerText}>
                  수량
                </Text>
              </View>
            </View>
            
            {/* Table Data */}
            <View style={styles.tableRow}>
              <View style={[styles.tableCell, styles.tableCellSmall]}>
                <Text variant="bodyLarge" style={styles.dataText}>
                  {format(item.addedDate, 'MM/dd', { locale: ko })}
                </Text>
              </View>
              <View style={[styles.tableCell, styles.tableCellLarge, styles.tableCellBorder]}>
                <View style={styles.expiryCell}>
                  {isFrozen ? (
                    <>
                      <Text variant="bodySmall" style={styles.expiryDateText}>
                        {frozenDateFormatted}부터
                      </Text>
                      <View style={styles.dDayContainer}>
                        <Text variant="bodyLarge" style={styles.dataText}>
                          {frozenDays}일
                        </Text>
                      </View>
                    </>
                  ) : (
                    <View style={styles.expiryContent}>
                      <Text variant="bodySmall" style={styles.expiryDateText}>
                        {format(expiryDate, 'MM/dd', { locale: ko })}까지
                      </Text>
                      <View style={styles.dDayWithIcon}>
                        <Text variant="bodyLarge" style={styles.dataText}>
                          {dDayText}
                        </Text>
                        <TouchableOpacity
                          onPress={() => setStorageInfoModalVisible(true)}
                          style={styles.helpButton}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          <MaterialCommunityIcons
                            name="help-circle-outline"
                            size={16}
                            color={Colors.text.secondary}
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              </View>
              <View style={[styles.tableCell, styles.tableCellSmall, styles.tableCellBorder]}>
                <Text variant="bodyLarge" style={styles.dataText}>
                  {item.quantity} {item.unit}
                </Text>
              </View>
            </View>
          </View>
        </Surface>

        {/* Remains Card */}
        <Surface style={styles.remainsCard} elevation={1}>
          <View style={styles.cardHeader}>
            <Text variant="labelMedium" style={styles.headerText}>
              남은 양
            </Text>
            <Button
              mode="outlined"
              onPress={handleUpdateRemains}
              loading={isLoading}
              disabled={isLoading || currentRemains >= Math.round((item.remains || 1) * 100)}
              style={[
                styles.updateButton,
                currentRemains < Math.round((item.remains || 1) * 100) && styles.updateButtonActive
              ]}
              labelStyle={[
                styles.updateButtonLabel,
                currentRemains < Math.round((item.remains || 1) * 100) && styles.updateButtonLabelActive
              ]}
              contentStyle={styles.updateButtonContent}
              compact
            >
              업데이트
            </Button>
          </View>
          <View style={styles.remainsContent}>
            <View style={styles.sliderRow}>
              <IconButton
                icon="minus"
                mode="contained"
                containerColor={isFrozen ? '#4A90E2' : Colors.primary.main}
                iconColor="white"
                size={20}
                onPress={() => {
                  const newValue = Math.max(0, currentRemains - 5);
                  handleSliderChange(newValue);
                }}
                disabled={currentRemains <= 0}
              />
              <View style={styles.percentageContainer}>
                <Text variant="titleMedium" style={[styles.percentText, isFrozen && { color: '#4A90E2' }]}>
                  {currentRemains}%
                </Text>
                <View style={styles.progressBarContainer}>
                  <View 
                    style={[
                      styles.progressBar,
                      { 
                        width: `${currentRemains}%`,
                        backgroundColor: isFrozen ? '#4A90E2' : Colors.primary.main
                      }
                    ]} 
                  />
                </View>
              </View>
              <IconButton
                icon="plus"
                mode="contained"
                containerColor={isFrozen ? '#4A90E2' : Colors.primary.main}
                iconColor="white"
                size={20}
                onPress={() => {
                  const originalRemains = Math.round((item.remains || 1) * 100);
                  const newValue = Math.min(originalRemains, currentRemains + 5);
                  handleSliderChange(newValue);
                }}
                disabled={currentRemains >= Math.round((item.remains || 1) * 100)}
              />
            </View>
          </View>
        </Surface>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Button
            mode="outlined"
            onPress={handleFreeze}
            icon="snowflake"
            style={[styles.actionButton, styles.freezeButton]}
            contentStyle={styles.actionButtonContent}
            disabled={isLoading || isFrozen}
            labelStyle={[styles.freezeButtonLabel, isFrozen && styles.disabledButtonLabel]}
          >
            {isFrozen ? "냉동중" : "냉동"}
          </Button>

          <Button
            mode="outlined"
            onPress={handleDispose}
            icon="trash-can-outline"
            style={[styles.actionButton, styles.disposeButton]}
            contentStyle={styles.actionButtonContent}
            disabled={isLoading}
            labelStyle={styles.disposeButtonLabel}
            textColor="#F44336"
          >
            폐기
          </Button>
        </View>

        {/* Recipe Recommendation Button */}
        <View style={styles.recommendSection}>
          <View style={styles.recommendButtonContainer}>
            <Button
              mode="contained"
              onPress={handleGetRecommendations}
              icon="chef-hat"
              style={styles.recommendButton}
              contentStyle={styles.recommendButtonContent}
              loading={isRecommending}
              disabled={isRecommending}
            >
              요리 추천받기
            </Button>
          </View>
        </View>

        {/* Related Recipes Section */}
        {relatedRecipes.length > 0 && (
          <>
            <View style={styles.recipesDivider} />
            <View style={styles.recipesHeader}>
              <Text variant="titleMedium" style={styles.recipesTitle}>
                이 재료로 만들 수 있는 요리
              </Text>
              <Text variant="bodySmall" style={styles.recipesSubtitle}>
                요리책에 저장된 레시피 중 이 재료를 사용하는 요리
              </Text>
            </View>
            <View style={styles.recipesContainer}>
              {relatedRecipes.map((recipe, index) => (
                <RecipeCard
                  key={index}
                  recipe={recipe}
                  ingredients={[]}  // Don't show ingredient status in this context
                  compact={true}
                  onPress={() => {
                    // Navigate to recipe detail screen from Cooking stack
                    navigation.navigate('Cooking' as never, {
                      screen: 'RecipeDetail',
                      params: { recipe, fromItemDetail: true }
                    } as never);
                  }}
                />
              ))}
            </View>
          </>
        )}
      </ScrollView>

      {/* Storage Info Modal */}
      <Portal>
        <Dialog 
          visible={storageInfoModalVisible} 
          onDismiss={() => setStorageInfoModalVisible(false)}
        >
          <Dialog.Title>보관 정보</Dialog.Title>
          <Dialog.Content>
            {storageInfo ? (
              <>
                <Paragraph>
                  <Text style={{ fontWeight: 'bold' }}>권장 소비기간: </Text>
                  {storageInfo.storage_desc || `${storageInfo.storage_days}일`}
                </Paragraph>
                <Paragraph style={{ marginTop: 8 }}>
                  <Text style={{ fontWeight: 'bold' }}>보관 방법: </Text>
                  {storageInfo.storage_method || '냉장 보관하세요'}
                </Paragraph>
              </>
            ) : (
              <Paragraph>보관 정보를 불러오는 중...</Paragraph>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setStorageInfoModalVisible(false)}>확인</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.default,
  },
  infoCard: {
    backgroundColor: Colors.background.paper,
    borderRadius: 16,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    padding: 0,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border.light,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  tableContainer: {
    width: '100%',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: Colors.background.level2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  tableRow: {
    flexDirection: 'row',
    minHeight: 60,
  },
  tableCell: {
    padding: Spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tableCellSmall: {
    flex: 3,
  },
  tableCellLarge: {
    flex: 5,
  },
  tableCellBorder: {
    borderLeftWidth: 1,
    borderLeftColor: Colors.border.light,
  },
  headerText: {
    color: Colors.text.secondary,
    fontFamily: 'OpenSans-SemiBold',
    textAlign: 'center',
  },
  dataText: {
    color: Colors.text.primary,
    fontFamily: 'OpenSans-Medium',
    textAlign: 'center',
  },
  expiryDateText: {
    color: Colors.text.secondary,
    fontFamily: 'OpenSans-Regular',
    textAlign: 'center',
    fontSize: 13,
  },
  expiryCell: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  expiryContent: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dDayWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    gap: 4,
  },
  dDayInTable: {
    color: Colors.primary.main,
    fontFamily: 'OpenSans-Medium',
    textAlign: 'center',
  },
  helpButton: {
    padding: 1,
    backgroundColor: Colors.background.paper,
    borderRadius: 8,
  },
  remainsCard: {
    backgroundColor: Colors.background.paper,
    borderRadius: 16,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,  // Reduced to 80% of original height
    borderWidth: 1,
    borderColor: Colors.border.light,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,  // Further reduced spacing
  },
  cardTitle: {
    color: Colors.text.primary,
    fontFamily: 'OpenSans-Bold',
  },
  remainsContent: {
    width: '100%',
  },
  updateButton: {
    minWidth: 80,
    height: 36,
    borderColor: Colors.border.light,
    borderRadius: 20,  // Pill shape
  },
  updateButtonActive: {
    borderColor: Colors.primary.main,
    backgroundColor: Colors.primary.main,
  },
  updateButtonContent: {
    height: 36,
    paddingHorizontal: 16,
  },
  updateButtonLabel: {
    color: Colors.text.secondary,
    fontFamily: 'OpenSans-SemiBold',
    fontSize: 14,
  },
  updateButtonLabelActive: {
    color: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 44,  // Status bar height
    paddingBottom: 0,  // No bottom padding
    backgroundColor: Colors.background.paper,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    marginHorizontal: 0,  // Full width for border
  },
  backButton: {
    marginLeft: Spacing.sm,  // Add some spacing from edge
    marginRight: 0,
    marginTop: Spacing.sm,  // Adjust vertical position
    marginBottom: Spacing.sm,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: Colors.text.primary,  // Changed to black
    fontFamily: 'OpenSans-Bold',
    fontWeight: '700',
    fontSize: 16,  // Increased from 14
    paddingTop: Spacing.lg,  // Same as tab
    paddingBottom: Spacing.md,  // Same as tab
  },
  content: {
    padding: Spacing.lg,
  },
  imageCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: Colors.background.paper,
    borderWidth: 1,
    borderColor: Colors.border.light,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  thumbnail: {
    width: '100%',
    aspectRatio: 1,
  },
  placeholderThumbnail: {
    backgroundColor: Colors.background.level3,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    aspectRatio: 1,
  },
  placeholderText: {
    fontSize: 64,
    color: Colors.text.secondary,
    fontFamily: 'OpenSans-SemiBold',
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  percentageContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: Spacing.md,
  },
  percentText: {
    color: Colors.primary.main,
    fontFamily: 'OpenSans-Bold',
    marginBottom: 4,  // Further reduced to make card more compact
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: Colors.background.level3,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.primary.main,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  actionButton: {
    flex: 1,
    borderRadius: 24,  // Pill shape
  },
  actionButtonContent: {
    paddingVertical: Spacing.xs,
  },
  freezeButton: {
    borderColor: '#4A90E2',
  },
  freezeButtonLabel: {
    color: '#4A90E2',
    fontFamily: 'OpenSans-SemiBold',
  },
  disposeButton: {
    borderColor: '#F44336',
  },
  disposeButtonLabel: {
    color: '#F44336',
    fontFamily: 'OpenSans-SemiBold',
  },
  disabledButtonLabel: {
    color: '#CCCCCC',
  },
  recommendSection: {
    marginTop: Spacing.sm,  // Same spacing as between remains card and action buttons
    marginBottom: Spacing.sm,  // Same spacing to the divider
  },
  recommendDivider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  recipesDivider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginTop: Spacing.sm,  // Same spacing as other sections
    marginHorizontal: Spacing.lg,
  },
  recipesHeader: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  recipesTitle: {
    color: Colors.text.primary,
    fontFamily: 'OpenSans-Bold',
    marginBottom: Spacing.xs,
  },
  recipesSubtitle: {
    color: Colors.text.secondary,
    fontFamily: 'OpenSans-Regular',
  },
  recipesContainer: {
    paddingBottom: Spacing.lg,
  },
  recommendButtonContainer: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  recommendButton: {
    borderRadius: 24,  // Pill shape
    backgroundColor: Colors.primary.main,
  },
  recommendButtonContent: {
    paddingVertical: Spacing.xs,
  },
});