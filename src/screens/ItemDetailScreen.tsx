import React, { useState, useEffect, useRef } from 'react';
import { View, ScrollView, StyleSheet, Image, Dimensions, Platform, Alert, TouchableOpacity } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { RecipeCard } from '../components/RecipeCard';
import { CustomSlider } from '../components/CustomSlider';
import {
  Surface,
  Text,
  IconButton,
  Button,
  Portal,
  Dialog,
  Paragraph,
  ActivityIndicator,
  useTheme
} from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { FoodItem } from '../models/FoodItem';
import { InventoryService } from '../services/InventoryService';
import { StorageInfoService } from '../services/StorageInfoService';
import { RecipeService } from '../services/RecipeService';
import { AIService } from '../services/AIService';
import { Recipe as AIRecipe } from '../services/AIService';
import { Recipe } from '../models/Recipe';
import { supabaseClient } from '../services/supabaseClient';
import { Colors } from '../constants/colors';
import { Spacing } from '../constants/spacing';
import { format } from 'date-fns';
import { ko, enUS } from 'date-fns/locale';
import { useAuth } from '../hooks/useAuth';

const { width: screenWidth } = Dimensions.get('window');

export const ItemDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const theme = useTheme();
  const { user } = useAuth();
  const { t, i18n } = useTranslation('inventory');
  const [item, setItem] = useState<FoodItem | null>(null);
  const [currentRemains, setCurrentRemains] = useState(100);
  const [storageInfoModalVisible, setStorageInfoModalVisible] = useState(false);
  const [storageInfo, setStorageInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [relatedRecipes, setRelatedRecipes] = useState<Recipe[]>([]);
  const [isRecommending, setIsRecommending] = useState(false);
  const [isLoadingRecipes, setIsLoadingRecipes] = useState(false);
  const [recipeLoadRetryCount, setRecipeLoadRetryCount] = useState(0);

  const inventoryService = useRef(new InventoryService(
    supabaseClient,
    process.env.EXPO_PUBLIC_GEMINI_API_KEY
  )).current;

  const storageInfoService = useRef(new StorageInfoService(
    supabaseClient,
    process.env.EXPO_PUBLIC_GEMINI_API_KEY
  )).current;

  const recipeService = useRef(new RecipeService()).current;

  const aiService = useRef(new AIService()).current;

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

  const loadRelatedRecipes = async (itemName: string, retryCount: number = 0) => {
    if (!user?.id) {
      return;
    }

    // Maximum 3 retries
    const maxRetries = 3;
    setIsLoadingRecipes(true);

    try {
      // Add small delay for retries to avoid rapid succession
      if (retryCount > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
      }

      // Get all bookmarked recipes
      const bookmarkedRecipes = await recipeService.getBookmarkedRecipes(user.id);

      // Filter recipes that contain this ingredient
      const related = bookmarkedRecipes.filter(recipe => {
        const hasIngredient = recipe.ingredients.some(ingredient => {
          // Handle different ingredient formats
          let ingredientName: string;

          // Check if ingredient is an object or string
          if (typeof ingredient === 'object' && ingredient !== null) {
            // New format: { name: "고구마", amount: "2개", unit: "" }
            ingredientName = (ingredient as any).name || '';
          } else if (typeof ingredient === 'string') {
            // Old format: "고구마 2개"
            // Extract just the ingredient name (remove quantity and unit)
            ingredientName = ingredient.split(/\s+\d+/)[0].trim();
          } else {
            return false;
          }

          // Normalize for exact matching
          const normalizedIngredient = ingredientName.replace(/\s+/g, '').toLowerCase();
          const normalizedItemName = itemName.replace(/\s+/g, '').toLowerCase();

          // Exact match only
          const matches = normalizedIngredient === normalizedItemName;

          // Debug logging
          if (matches) {
            console.log(`Matched: "${itemName}" with ingredient "${ingredientName}" in recipe "${recipe.name}"`);
          }

          return matches;
        });
        return hasIngredient;
      });

      // Convert SavedRecipe to Recipe format
      const recipes: Recipe[] = related.map(r => ({
        id: r.id,
        title: r.name,  // Use 'title' as per Recipe model
        name: r.name,   // Add 'name' for backward compatibility
        description: '',
        difficulty: r.difficulty as 'easy' | 'medium' | 'hard',
        cookingTime: r.cookingTime,
        servings: 2,
        ingredients: r.ingredients.map(ing => {
          // Handle both string and structured format
          if (typeof ing === 'string') {
            return {
              name: ing,
              quantity: 1,
              unit: '',
              required: true
            };
          }
          // Already structured format
          return ing;
        }),
        instructions: r.instructions || [],
        tags: [],
        category: 'main-dish',
        cuisine: 'korean',
        isBookmarked: true,
        userId: user?.id || '',
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      setRelatedRecipes(recipes);
      setIsLoadingRecipes(false);
      setRecipeLoadRetryCount(0);
    } catch (error) {
      console.error(`Error loading related recipes (attempt ${retryCount + 1}):`, error);

      // Retry logic for network errors
      if (retryCount < maxRetries - 1) {
        console.log(`Retrying to load recipes... (attempt ${retryCount + 2}/${maxRetries})`);
        setRecipeLoadRetryCount(retryCount + 1);
        // Recursive retry with incremented count
        setTimeout(() => loadRelatedRecipes(itemName, retryCount + 1), 1000);
      } else {
        console.error('Failed to load recipes after maximum retries');
        setIsLoadingRecipes(false);
        setRecipeLoadRetryCount(0);
        // Set empty array instead of leaving undefined
        setRelatedRecipes([]);
      }
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
        (navigation as any).navigate('Cooking', {
          screen: 'CookingMain',
          params: {
            showRecommendations: true,
            recommendations: recommendations,
            fromIngredient: item.name
          }
        });
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
      Alert.alert(t('itemDetail.errors.error'), t('itemDetail.errors.updateFailed'));
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
      Alert.alert(t('itemDetail.errors.error'), t('itemDetail.errors.freezeFailed'));
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
        t('itemDetail.disposeConfirm'),
        t('itemDetail.disposeMessage', { name: item.name }),
        [
          { text: t('itemDetail.cancel'), style: 'cancel' },
          {
            text: t('itemDetail.dispose'), 
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
      Alert.alert(t('itemDetail.errors.error'), t('itemDetail.errors.disposeFailed'));
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
    ? t('itemDetail.dDay')
    : t('itemDetail.daysRemaining', { days: daysUntilExpiry });

  // Calculate frozen days if item is frozen
  let frozenDays = 0;
  let frozenDateFormatted = '';
  const isFrozen = item.status === 'frozen';
  if (isFrozen && item.frozenDate) {
    const frozenDate = new Date(item.frozenDate);
    frozenDate.setHours(0, 0, 0, 0);
    // Add 1 to include today (day 0 for today)
    frozenDays = Math.floor((today.getTime() - frozenDate.getTime()) / (1000 * 60 * 60 * 24));
    frozenDateFormatted = format(frozenDate, i18n.language === 'en' ? 'MMM dd' : 'MM/dd', { locale: i18n.language === 'en' ? enUS : ko });
  } else if (isFrozen && !item.frozenDate) {
    // If frozen but no frozen date, use added date as frozen date
    const frozenDate = new Date(item.addedDate);
    frozenDate.setHours(0, 0, 0, 0);
    // Add 1 to include today (day 0 for today)
    frozenDays = Math.floor((today.getTime() - frozenDate.getTime()) / (1000 * 60 * 60 * 24));
    frozenDateFormatted = format(frozenDate, i18n.language === 'en' ? 'MMM dd' : 'MM/dd', { locale: i18n.language === 'en' ? enUS : ko });
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
        <Surface style={styles.imageCard}>
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
        <Surface style={styles.infoCard}>
          <View style={styles.tableContainer}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <View style={[styles.tableCell, styles.tableCellSmall]}>
                <Text variant="labelMedium" style={styles.headerText}>
                  {t('itemDetail.registrationDate')}
                </Text>
              </View>
              <View style={[styles.tableCell, styles.tableCellLarge, styles.tableCellBorder]}>
                <Text variant="labelMedium" style={styles.headerText}>
                  {isFrozen ? t('itemDetail.freezing') : t('itemDetail.expiryDate')}
                </Text>
              </View>
              <View style={[styles.tableCell, styles.tableCellSmall, styles.tableCellBorder]}>
                <Text variant="labelMedium" style={styles.headerText}>
                  {t('itemDetail.quantity')}
                </Text>
              </View>
            </View>
            
            {/* Table Data */}
            <View style={styles.tableRow}>
              <View style={[styles.tableCell, styles.tableCellSmall]}>
                <Text variant="bodyLarge" style={styles.dataText}>
                  {format(item.addedDate, i18n.language === 'en' ? 'MMM dd' : 'MM/dd', { locale: i18n.language === 'en' ? enUS : ko })}
                </Text>
              </View>
              <View style={[styles.tableCell, styles.tableCellLarge, styles.tableCellBorder]}>
                <View style={styles.expiryCell}>
                  {isFrozen ? (
                    <>
                      <Text variant="bodySmall" style={styles.expiryDateText}>
                        {i18n.language === 'en' ? `Since ${frozenDateFormatted}` : `${frozenDateFormatted}부터`}
                      </Text>
                      <View style={styles.expiryContent}>
                        <Text variant="bodyLarge" style={styles.dataText}>
                          {i18n.language === 'en' ? `${frozenDays}D` : `${frozenDays}일`}
                        </Text>
                      </View>
                    </>
                  ) : (
                    <View style={styles.expiryContent}>
                      <Text variant="bodySmall" style={styles.expiryDateText}>
                        {i18n.language === 'en'
                          ? t('itemDetail.until', { date: format(expiryDate, 'MMM dd') })
                          : t('itemDetail.until', { date: format(expiryDate, 'MM/dd', { locale: ko }) })}
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
                            color={Colors.primary.main}
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              </View>
              <View style={[styles.tableCell, styles.tableCellSmall, styles.tableCellBorder]}>
                <Text variant="bodyLarge" style={styles.dataText}>
                  {item.quantity} {i18n.language === 'en' && item.unit === '개' ? t('itemDetail.pieces') : i18n.language === 'en' && item.unit === '팩' ? t('itemDetail.packs') : item.unit}
                </Text>
              </View>
            </View>
          </View>
        </Surface>

        {/* Remains Card */}
        <Surface style={styles.remainsCard}>
          <View style={styles.cardHeader}>
            <Text variant="labelMedium" style={styles.headerText}>
              {t('itemDetail.remainingAmount')}
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
              {t('itemDetail.update')}
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
            {isFrozen ? t('itemDetail.frozen') : t('itemDetail.freeze')}
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
            {t('itemDetail.dispose')}
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
              {t('itemDetail.getRecipes')}
            </Button>
          </View>
        </View>

        {/* Related Recipes Section */}
        {isLoadingRecipes ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={Colors.primary.main} />
            <Text variant="bodySmall" style={styles.loadingText}>
              {recipeLoadRetryCount > 0
                ? `레시피 불러오는 중... (재시도 ${recipeLoadRetryCount}/3)`
                : '레시피 불러오는 중...'}
            </Text>
          </View>
        ) : relatedRecipes.length > 0 ? (
          <>
            <View style={styles.recipesDivider} />
            <View style={styles.recipesHeader}>
              <Text variant="titleMedium" style={styles.recipesTitle}>
                {t('itemDetail.recipesWithIngredient')}
              </Text>
              <Text variant="bodySmall" style={styles.recipesSubtitle}>
                {t('itemDetail.savedRecipesDesc')}
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
                    // Navigate to recipe detail screen within the same stack
                    (navigation as any).navigate('RecipeDetail', {
                      recipe,
                      fromItemDetail: true
                    });
                  }}
                />
              ))}
            </View>
          </>
        ) : null}
      </ScrollView>

      {/* Storage Info Modal */}
      <Portal>
        <Dialog
          visible={storageInfoModalVisible}
          onDismiss={() => setStorageInfoModalVisible(false)}
          style={styles.storageInfoDialog}
        >
          <Dialog.Content style={styles.storageInfoContent}>
            <View style={styles.storageInfoHeader}>
              <IconButton
                icon="information"
                size={24}
                iconColor={Colors.primary.main}
                style={styles.storageInfoIcon}
              />
              <Text style={styles.storageInfoTitle}>{t('storageInfo.title')}</Text>
            </View>
            {storageInfo ? (
              <View style={styles.storageInfoContainer}>
                <Surface style={styles.storageInfoCard} elevation={1}>
                  <View style={styles.storageInfoRow}>
                    <IconButton
                      icon="calendar-clock"
                      size={20}
                      iconColor={Colors.primary.main}
                      style={styles.storageInfoRowIcon}
                    />
                    <View style={styles.storageInfoTextContainer}>
                      <Text style={styles.storageInfoLabel}>{t('storageInfo.recommendedPeriod')}</Text>
                      <Text style={styles.storageInfoValue}>
                        {storageInfo.storage_desc ||
                          (i18n.language === 'en'
                            ? `${storageInfo.storage_days} days`
                            : `${storageInfo.storage_days}일`)}
                      </Text>
                    </View>
                  </View>
                </Surface>

                <Surface style={[styles.storageInfoCard, { marginTop: 12 }]} elevation={1}>
                  <View style={styles.storageInfoRow}>
                    <IconButton
                      icon="fridge"
                      size={20}
                      iconColor={Colors.primary.main}
                      style={styles.storageInfoRowIcon}
                    />
                    <View style={styles.storageInfoTextContainer}>
                      <Text style={styles.storageInfoLabel}>{t('storageInfo.storageMethod')}</Text>
                      <Text style={styles.storageInfoValue}>
                        {storageInfo.storage_method ||
                          (i18n.language === 'en'
                            ? 'Keep refrigerated'
                            : '냉장 보관하세요')}
                      </Text>
                    </View>
                  </View>
                </Surface>
              </View>
            ) : (
              <View style={styles.storageInfoLoading}>
                <ActivityIndicator animating={true} color={Colors.primary.main} />
                <Text style={styles.storageInfoLoadingText}>{t('storageInfo.loading')}</Text>
              </View>
            )}
          </Dialog.Content>
          <Dialog.Actions style={styles.storageInfoActions}>
            <Button
              mode="contained"
              onPress={() => setStorageInfoModalVisible(false)}
              style={styles.storageInfoButton}
              labelStyle={styles.storageInfoButtonLabel}
            >
              {t('storageInfo.confirm')}
            </Button>
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
    borderRadius: 12,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    padding: 0,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border.light,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  tableContainer: {
    width: '100%',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: Colors.background.default,
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
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
  },
  remainsCard: {
    backgroundColor: Colors.background.paper,
    borderRadius: 12,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,  // Reduced to 80% of original height
    borderWidth: 1,
    borderColor: Colors.border.light,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
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
    borderRadius: 18,  // Pill shape
    justifyContent: 'center',
    alignItems: 'center',
  },
  updateButtonActive: {
    borderColor: Colors.primary.main,
    backgroundColor: Colors.primary.main,
  },
  updateButtonContent: {
    height: 36,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  updateButtonLabel: {
    color: Colors.text.secondary,
    fontFamily: 'OpenSans-SemiBold',
    fontSize: 12,
    lineHeight: 16,
    textAlignVertical: 'center',
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
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: Colors.background.paper,
    borderWidth: 1,
    borderColor: Colors.border.light,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  thumbnail: {
    width: '100%',
    aspectRatio: 1,
  },
  placeholderThumbnail: {
    backgroundColor: Colors.background.default,
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
    backgroundColor: Colors.background.default,
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
  sliderContainer: {
    width: '100%',
    paddingVertical: Spacing.sm,
  },
  slider: {
    marginHorizontal: Spacing.md,
    marginVertical: Spacing.sm,
  },
  sliderButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  sliderButton: {
    margin: 0,
  },
  // Storage Info Modal Styles
  storageInfoDialog: {
    borderRadius: 16,
  },
  storageInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  storageInfoIcon: {
    margin: 0,
    marginRight: 12,
    backgroundColor: Colors.primary.light,
  },
  storageInfoTitle: {
    fontSize: 18,
    fontFamily: 'OpenSans-Bold',
    color: Colors.text.primary,
    flex: 1,
  },
  storageInfoContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 12,
  },
  storageInfoContainer: {
    gap: 12,
  },
  storageInfoCard: {
    backgroundColor: Colors.background.paper,
    borderRadius: 12,
    padding: 0,
    elevation: 1,
    overflow: 'hidden',
  },
  storageInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  storageInfoRowIcon: {
    margin: 0,
    marginRight: 16,
    backgroundColor: Colors.primary.light,
  },
  storageInfoTextContainer: {
    flex: 1,
  },
  storageInfoLabel: {
    fontSize: 12,
    fontFamily: 'OpenSans-Medium',
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  storageInfoValue: {
    fontSize: 16,
    fontFamily: 'OpenSans-SemiBold',
    color: Colors.text.primary,
  },
  storageInfoLoading: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  storageInfoLoadingText: {
    marginTop: 16,
    fontSize: 14,
    fontFamily: 'OpenSans-Regular',
    color: Colors.text.secondary,
  },
  storageInfoActions: {
    paddingHorizontal: 24,
    paddingBottom: 20,
    paddingTop: 12,
  },
  storageInfoButton: {
    borderRadius: 24,
    flex: 1,
  },
  storageInfoButtonLabel: {
    fontFamily: 'OpenSans-SemiBold',
    fontSize: 14,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    marginHorizontal: Spacing.lg,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 12,
    fontFamily: 'OpenSans-Regular',
    color: Colors.text.secondary,
  },
});