import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Surface, Text, Button, Chip, ActivityIndicator, FAB, Card, Divider, TextInput, IconButton, Menu, Switch } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useIsFocused } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Colors } from '../constants/colors';
import { Spacing } from '../constants/spacing';
import { InventoryService } from '../services/InventoryService';
import { FoodItem } from '../models/FoodItem';
import { supabaseClient } from '../services/supabaseClient';
import { useAuth } from '../hooks/useAuth';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CookingStackParamList } from '../navigation/CookingStackNavigator';
import { AIService, Recipe } from '../services/AIService';
import { recipeService } from '../services/RecipeService';

type TabType = 'recommend' | 'bookmarks';

// Helper function to get difficulty translation key
const getDifficultyKey = (difficulty: string): string => {
  const difficultyKeys: { [key: string]: string } = {
    'easy': 'difficulty.easy',
    'medium': 'difficulty.medium',
    'hard': 'difficulty.hard'
  };
  return difficultyKeys[difficulty?.toLowerCase()] || 'difficulty.medium';
};

// 요리 추천 탭
interface CookingRecommendTabProps {
  initialRecommendations?: Recipe[] | null;
  fromIngredient?: string | null;
}

const CookingRecommendTab: React.FC<CookingRecommendTabProps> = ({
  initialRecommendations,
  fromIngredient
}) => {
  const { t, i18n } = useTranslation('cooking');
  const [ingredients, setIngredients] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [recommending, setRecommending] = useState(false);
  const [recommendations, setRecommendations] = useState<Recipe[]>([]);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [bookmarkedRecipes, setBookmarkedRecipes] = useState<Set<string>>(new Set());
  const [savingRecipe, setSavingRecipe] = useState<string | null>(null);
  const [currentIngredientContext, setCurrentIngredientContext] = useState<string | null>(fromIngredient || null);
  const [selectedIngredients, setSelectedIngredients] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(true);
  const [cookingStyleInput, setCookingStyleInput] = useState('');
  const { user } = useAuth();
  const isFocused = useIsFocused();

  // useMemo를 사용하여 서비스 인스턴스들을 한 번만 생성
  const inventoryService = useMemo(() => {
    console.log('Creating InventoryService with supabaseClient:', !!supabaseClient);
    const apiKey = process.env.EXPO_PUBLIC_GOOGLE_GENERATIVE_AI_KEY ||
                   process.env.EXPO_PUBLIC_GEMINI_API_KEY;
    return new InventoryService(supabaseClient, apiKey);
  }, []);

  const aiService = useMemo(() => {
    const apiKey = process.env.EXPO_PUBLIC_GOOGLE_GENERATIVE_AI_KEY ||
                   process.env.EXPO_PUBLIC_GEMINI_API_KEY;
    return new AIService();
  }, []);

  // Handle initial recommendations from ItemDetailScreen
  useEffect(() => {
    if (initialRecommendations && initialRecommendations.length > 0) {
      setRecommendations(initialRecommendations);
      setShowRecommendations(true);
      setCurrentIngredientContext(fromIngredient || null);
    }
  }, [initialRecommendations, fromIngredient]);

  // Load bookmarked recipes status
  useEffect(() => {
    if (user?.id && recommendations.length > 0) {
      loadBookmarkedStatus();
    }
  }, [user?.id, recommendations]);

  const loadBookmarkedStatus = async () => {
    if (!user?.id || recommendations.length === 0) return;

    try {
      // Get all bookmarked recipes at once to avoid multiple API calls
      const bookmarkedList = await recipeService.getBookmarkedRecipes(user.id);
      const bookmarkedNames = new Set(bookmarkedList.map(r => r.name));

      // Check which of the recommendations are bookmarked
      const bookmarked = new Set<string>();
      for (const recipe of recommendations) {
        if (bookmarkedNames.has(recipe.name)) {
          bookmarked.add(recipe.name);
        }
      }
      setBookmarkedRecipes(bookmarked);
    } catch (error) {
      console.error('Error checking bookmark status:', error);
      // If there's an error, just set empty bookmarks
      setBookmarkedRecipes(new Set());
    }
  };

  const handleToggleBookmark = async (recipe: Recipe) => {
    if (!user?.id) return;

    setSavingRecipe(recipe.name);
    const result = await recipeService.toggleBookmark(user.id, recipe);

    if (result.success) {
      const newBookmarked = new Set(bookmarkedRecipes);
      if (result.bookmarked) {
        newBookmarked.add(recipe.name);
      } else {
        newBookmarked.delete(recipe.name);
      }
      setBookmarkedRecipes(newBookmarked);
    }
    setSavingRecipe(null);
  };

  // 화면에 포커스가 올 때마다 데이터를 다시 로드
  useEffect(() => {
    if (isFocused && user?.id) {
      console.log('CookingScreen focused - reloading ingredients');
      loadIngredients();
    }
  }, [isFocused, user?.id]);

  // Supabase 실시간 구독 설정
  useEffect(() => {
    if (!user?.id) return;

    console.log('Setting up real-time subscription for cooking ingredients');

    const subscription = supabaseClient
      .channel('cooking-ingredients-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE 모두 감지
          schema: 'public',
          table: 'food_items',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Real-time update received in CookingScreen:', payload);
          // 데이터 변경 감지 시 재로드
          loadIngredients();
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up real-time subscription');
      subscription.unsubscribe();
    };
  }, [user?.id]);

  const loadIngredients = async () => {
    try {
      setLoading(true);

      if (!user?.id) {
        console.log('No user ID available');
        setIngredients([]);
        return;
      }

      console.log('Loading ingredients for user:', user.id);

      // 과일 제외하고 재고가 있는 항목만 가져오기
      const items = await inventoryService.getCookingIngredients(user.id);
      console.log('Loaded ingredients:', items.length, 'items');

      // 재고목록과 동일한 임박순 정렬 적용
      const sortedItems = [...items].sort(sortByUrgency);
      setIngredients(sortedItems);

      // 전체 선택이 활성화된 경우 모든 재료를 선택
      if (selectAll) {
        const allIds = new Set(sortedItems.map(item => item.id));
        setSelectedIngredients(allIds);
      }
    } catch (error) {
      console.error('Failed to load ingredients:', error);
      setIngredients([]);
    } finally {
      setLoading(false);
    }
  };

  const getExpiryColor = (item: FoodItem): string => {
    // 냉동 상태는 파란색 계열
    if (item.status === 'frozen') {
      return '#4A90E2'; // 파란색 - 냉동 (재고목록과 동일)
    }

    if (!item.storageDays) return Colors.background.default;

    // 재고목록의 FoodItemCard와 완전히 동일한 계산 방식
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const addedDate = new Date(item.addedDate);
    addedDate.setHours(0, 0, 0, 0);
    const storageDays = item.storageDays || 7;
    const daysElapsed = Math.floor((today.getTime() - addedDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysRemaining = storageDays - daysElapsed;
    const percentRemaining = (daysRemaining / storageDays) * 100;

    // FoodItemCard와 동일한 색상 시스템
    if (daysRemaining < 0) {
      return '#F44336'; // Red - 만료
    } else if (daysRemaining === 0) {
      return '#FF9800'; // Orange - D-Day
    } else {
      // 비율 기반 색상
      if (percentRemaining > 50) {
        return '#4CAF50'; // Green - 신선 (> 50%)
      } else if (percentRemaining > 20) {
        return '#FFC107'; // Yellow - 주의 (20-50%)
      } else {
        return '#FF9800'; // Orange - 경고 (<= 20%)
      }
    }
  };

  // 임박도 순으로 정렬하는 함수 (재고목록과 동일한 로직)
  // 색상 우선순위 기반 정렬 함수
  const getColorPriority = (item: FoodItem): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const addedDate = new Date(item.addedDate);
    addedDate.setHours(0, 0, 0, 0);

    const storageDays = item.storageDays || 7;
    const daysElapsed = Math.floor((today.getTime() - addedDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysRemaining = storageDays - daysElapsed;
    const percentRemaining = (daysRemaining / storageDays) * 100;

    // 색상별 우선순위 (낮을수록 먼저 표시)
    if (daysRemaining < 0) {
      return 1; // 빨강 (만료) - 가장 높은 우선순위
    } else if (daysRemaining === 0) {
      return 2; // 주황 (D-Day)
    } else if (percentRemaining <= 20) {
      return 3; // 주황 (임박)
    } else if (percentRemaining <= 50) {
      return 4; // 노랑 (주의)
    } else {
      return 5; // 초록 (신선) - 가장 낮은 우선순위
    }
  };

  const sortByUrgency = (a: FoodItem, b: FoodItem) => {
    // 색상 우선순위로 먼저 비교
    const priorityA = getColorPriority(a);
    const priorityB = getColorPriority(b);

    if (priorityA !== priorityB) {
      return priorityA - priorityB; // 우선순위가 낮은 것이 먼저 (빨강 -> 주황 -> 노랑 -> 초록)
    }

    // 같은 색상 그룹 내에서는 남은 기간이 짧은 순으로 정렬
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const addedDateA = new Date(a.addedDate);
    addedDateA.setHours(0, 0, 0, 0);
    const expiryDateA = new Date(addedDateA);
    expiryDateA.setDate(expiryDateA.getDate() + (a.storageDays || 7));

    const addedDateB = new Date(b.addedDate);
    addedDateB.setHours(0, 0, 0, 0);
    const expiryDateB = new Date(addedDateB);
    expiryDateB.setDate(expiryDateB.getDate() + (b.storageDays || 7));

    const daysRemainingA = Math.floor((expiryDateA.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const daysRemainingB = Math.floor((expiryDateB.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    return daysRemainingA - daysRemainingB;
  };

  // 재료를 카테고리별로 분류하는 함수
  const categorizeIngredients = (items: FoodItem[]) => {
    const frozen: FoodItem[] = [];
    const refrigerated: FoodItem[] = [];
    const normal: FoodItem[] = [];

    items.forEach(item => {
      if (item.status === 'frozen') {
        frozen.push(item);
      } else if (item.category === 'dairy' || item.category === 'meat' || item.category === 'vegetables') {
        refrigerated.push(item);
      } else {
        normal.push(item);
      }
    });

    // 냉동 재료만 정렬 (신선 재료는 합친 후 정렬)
    frozen.sort(sortByUrgency);

    return { frozen, refrigerated, normal };
  };

  const handleToggleSelectAll = (value: boolean) => {
    setSelectAll(value);
    if (value) {
      // 전체 선택
      const allIds = new Set(ingredients.map(item => item.id));
      setSelectedIngredients(allIds);
    } else {
      // 전체 해제
      setSelectedIngredients(new Set());
    }
  };

  const handleToggleIngredient = (itemId: string) => {
    const newSelected = new Set(selectedIngredients);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
      // 하나라도 선택 해제되면 전체 선택 OFF
      setSelectAll(false);
    } else {
      newSelected.add(itemId);
      // 모두 선택되었는지 확인
      if (newSelected.size === ingredients.length) {
        setSelectAll(true);
      }
    }
    setSelectedIngredients(newSelected);
  };

  const handleRecommend = async () => {
    try {
      setRecommending(true);

      // 선택된 재료만 필터링
      const selectedItems = ingredients.filter(item => selectedIngredients.has(item.id));

      if (selectedItems.length === 0) {
        alert(t('recommend.selectIngredientsAlert'));
        setRecommending(false);
        return;
      }

      console.log('Getting recommendations for selected ingredients:', selectedItems.length);

      // Sort selected ingredients by expiry urgency and prepare for AI service
      const sortedIngredients = [...selectedItems].sort((a, b) => {
        // Prioritize items closer to expiry
        const getDaysRemaining = (item: FoodItem) => {
          if (!item.expiryDate) return 999;
          const today = new Date();
          const expiry = new Date(item.expiryDate);
          return Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        };
        return getDaysRemaining(a) - getDaysRemaining(b);
      });

      // Create prioritized ingredient list with expiry info
      const ingredientInfo = sortedIngredients.map(item => {
        const daysRemaining = item.expiryDate
          ? Math.floor((new Date(item.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
          : null;

        if (daysRemaining !== null && daysRemaining <= 3) {
          return `${item.name}(임박)`;
        } else if (daysRemaining !== null && daysRemaining <= 7) {
          return `${item.name}(주의)`;
        }
        return item.name;
      });

      // AI 추천 API 호출 (사용자 입력 스타일 포함)
      const result = await aiService.generateRecipeSuggestions(ingredientInfo, cookingStyleInput.trim(), i18n.language);
      console.log('Received recommendations result:', result);

      if (result.success && result.recipes.length > 0) {
        setRecommendations(result.recipes);
        setShowRecommendations(true);
      } else {
        // Log the error for debugging
        console.error('Recipe generation failed:', {
          success: result.success,
          error: result.error,
          recipesCount: result.recipes?.length || 0
        });

        setRecommendations([]);

        // Show more specific error message
        if (result.error) {
          alert(`레시피 생성 실패: ${result.error}\n\n잠시 후 다시 시도해주세요.`);
        } else if (ingredientInfo.length === 0) {
          alert('사용 가능한 재료가 없습니다.\n재료를 먼저 등록해주세요.');
        } else {
          alert('레시피를 생성할 수 없습니다.\n잠시 후 다시 시도해주세요.');
        }
      }
    } catch (error) {
      console.error('Failed to get recommendations:', error);
      // Show error message
      alert('레시피 추천 중 오류가 발생했습니다.');
    } finally {
      setRecommending(false);
    }
  };
  
  const handleYouTubeSearch = (query: string) => {
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    Linking.openURL(url);
  };

  // Check if user has an ingredient
  const hasIngredient = (ingredientName: string): boolean => {
    return ingredients.some(item =>
      ingredientName.toLowerCase().includes(item.name.toLowerCase()) ||
      item.name.toLowerCase().includes(ingredientName.toLowerCase())
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary.main} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* 안내 메시지 및 색상 범례 */}
        <Surface style={styles.infoCard} elevation={1}>
          <Text variant="bodySmall" style={styles.infoText}>
            {t('recommend.subtitle')}
          </Text>
          <View style={styles.legendContainer}>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#F44336' }]} />
              <Text variant="bodySmall" style={{ fontSize: 11 }}>{t('common:status.expired')}</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#FF9800' }]} />
              <Text variant="bodySmall" style={{ fontSize: 11 }}>{t('status.urgent')}</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#FFC107' }]} />
              <Text variant="bodySmall" style={{ fontSize: 11 }}>{t('common:status.warning')}</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#4CAF50' }]} />
              <Text variant="bodySmall" style={{ fontSize: 11 }}>{t('common:status.fresh')}</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#2196F3' }]} />
              <Text variant="bodySmall" style={{ fontSize: 11 }}>{t('common:status.frozen')}</Text>
            </View>
          </View>
        </Surface>

        {/* 전체 선택 토글 */}
        {ingredients.length > 0 && (
          <View style={styles.selectAllContainer}>
            <Text variant="bodyMedium" style={styles.selectAllText}>
              {t('recommend.selectAll')}
            </Text>
            <Switch
              value={selectAll}
              onValueChange={handleToggleSelectAll}
              color={Colors.primary.main}
            />
          </View>
        )}

        {/* 재료 칩 목록 - 카테고리별로 분류 */}
        {ingredients.length > 0 ? (
          <>
            {/* 냉동 재료와 신선 재료를 분리하여 표시 */}
            {(() => {
              // 냉동과 신선 재료 분리
              const frozen = ingredients.filter(item => item.status === 'frozen');
              const fresh = ingredients.filter(item => item.status !== 'frozen');

              // 각각 임박순 정렬
              const sortedFrozen = [...frozen].sort(sortByUrgency);
              const sortedFresh = [...fresh].sort(sortByUrgency);

              return (
                <>
                  {/* 신선 재료 섹션 (냉동이 아닌 모든 재료) */}
                  {sortedFresh.length > 0 && (
                    <>
                      <Text variant="titleMedium" style={styles.sectionTitle}>
                        🥬 {t('categories.fresh')} ({sortedFresh.length})
                      </Text>
                      <View style={styles.chipContainer}>
                        {sortedFresh.map((item) => {
                          const isSelected = selectedIngredients.has(item.id);
                          const itemColor = getExpiryColor(item);
                          return (
                            <TouchableOpacity
                              key={item.id}
                              onPress={() => handleToggleIngredient(item.id)}
                              activeOpacity={0.7}
                            >
                              <Chip
                                style={[
                                  styles.ingredientChip,
                                  { backgroundColor: itemColor }
                                ]}
                                textStyle={styles.chipText}
                                mode="flat"
                                compact
                              >
                                <View style={styles.chipContent}>
                                  {isSelected && (
                                    <MaterialCommunityIcons
                                      name="check"
                                      size={12}
                                      color="#FFFFFF"
                                      style={styles.chipCheckIcon}
                                    />
                                  )}
                                  <Text style={styles.chipText}>{item.name}</Text>
                                </View>
                              </Chip>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </>
                  )}

                  {/* 냉동 재료 섹션 */}
                  {sortedFrozen.length > 0 && (
                    <>
                      <Text variant="titleMedium" style={styles.sectionTitle}>
                        ❄️ {t('categories.frozen')} ({sortedFrozen.length})
                      </Text>
                      <View style={styles.chipContainer}>
                        {sortedFrozen.map((item) => {
                          const isSelected = selectedIngredients.has(item.id);
                          const itemColor = getExpiryColor(item);
                          return (
                            <TouchableOpacity
                              key={item.id}
                              onPress={() => handleToggleIngredient(item.id)}
                              activeOpacity={0.7}
                            >
                              <Chip
                                style={[
                                  styles.ingredientChip,
                                  { backgroundColor: itemColor }
                                ]}
                                textStyle={styles.chipText}
                                mode="flat"
                                compact
                              >
                                <View style={styles.chipContent}>
                                  {isSelected && (
                                    <MaterialCommunityIcons
                                      name="check"
                                      size={12}
                                      color="#FFFFFF"
                                      style={styles.chipCheckIcon}
                                    />
                                  )}
                                  <Text style={styles.chipText}>{item.name}</Text>
                                </View>
                              </Chip>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </>
                  )}
                </>
              );
            })()}

            {/* 요리 스타일 입력 및 추천받기 버튼 */}
            {ingredients.length > 0 && !showRecommendations && (
              <>
                <View style={styles.cookingStyleContainer}>
                  <TextInput
                    value={cookingStyleInput}
                    onChangeText={setCookingStyleInput}
                    placeholder={t('recommend.styleInput.placeholder')}
                    placeholderTextColor={Colors.text.disabled}
                    mode="outlined"
                    multiline
                    numberOfLines={2}
                    style={styles.cookingStyleInput}
                    outlineColor={Colors.border.light}
                    activeOutlineColor={Colors.primary.main}
                    dense
                    right={
                      cookingStyleInput ? (
                        <TextInput.Icon
                          icon="close"
                          onPress={() => setCookingStyleInput('')}
                        />
                      ) : null
                    }
                  />
                  <Text variant="bodySmall" style={styles.cookingStyleHint}>
                    {t('recommend.styleInput.hint')}
                  </Text>
                </View>
                <View style={styles.recommendButtonContainer}>
                  <Button
                    mode="contained"
                    onPress={handleRecommend}
                    loading={recommending}
                    icon="chef-hat"
                    style={styles.recommendButton}
                    contentStyle={styles.recommendButtonContent}
                  >
                    {t('recommend.getRecommendation')}
                  </Button>
                </View>
              </>
            )}

            {/* 다시 추천받기 버튼 */}
            {showRecommendations && (
              <View style={styles.recommendButtonContainer}>
                <Button
                  mode="outlined"
                  onPress={() => {
                    setShowRecommendations(false);
                    setRecommendations([]);
                    setCurrentIngredientContext(null); // Clear the specific ingredient context
                    setCookingStyleInput(''); // Clear cooking style input
                  }}
                  icon="refresh"
                  style={styles.recommendButton}
                  contentStyle={styles.recommendButtonContent}
                >
                  {t('recommend.recommendAgain')}
                </Button>
              </View>
            )}

            {/* 추천 레시피 카드 목록 */}
            {showRecommendations && recommendations.length > 0 && (
              <>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  🍳 {currentIngredientContext ? t('recommend.fromIngredient', { ingredient: currentIngredientContext }) : t('recommend.recommendedRecipes')}
                </Text>
                {recommendations.map((recipe, index) => (
                  <Card key={index} style={styles.recipeCard} mode="outlined">
                    <Card.Content>
                      <Text variant="titleMedium" style={styles.recipeTitle}>
                        {recipe.name}
                      </Text>

                      <View style={styles.recipeInfo}>
                        <Text variant="bodyMedium" style={styles.difficultyText}>
                          {t('recipe.difficulty')}: {t(getDifficultyKey(recipe.difficulty))}
                        </Text>
                        <Text variant="bodyMedium" style={styles.timeText}>
                          ⏰ {recipe.cookingTime} {t('recipe.minutes')}
                        </Text>
                      </View>

                      <Divider style={styles.divider} />

                      <Text variant="labelLarge" style={styles.sectionLabel}>
                        {t('recipe.ingredients')}
                      </Text>
                      <View style={styles.ingredientsList}>
                        {recipe.ingredients.map((ingredient, idx) => {
                          const have = hasIngredient(ingredient);
                          return (
                            <View key={idx} style={styles.ingredientRow}>
                              <Text
                                variant="bodyMedium"
                                style={[
                                  styles.ingredientItem,
                                  have ? styles.hasIngredient : styles.missingIngredient
                                ]}
                              >
                                • {ingredient}
                              </Text>
                              {have && (
                                <Chip
                                  mode="flat"
                                  style={styles.hasChip}
                                  textStyle={styles.hasChipText}
                                >
                                  {t('recipe.hasIngredient')}
                                </Chip>
                              )}
                            </View>
                          );
                        })}
                      </View>

                      {recipe.instructions && recipe.instructions.length > 0 && (
                        <>
                          <Divider style={styles.divider} />
                          <Text variant="labelLarge" style={styles.sectionLabel}>
                            {t('recipe.instructions')}
                          </Text>
                          <View style={styles.ingredientsList}>
                            {recipe.instructions.map((instruction, idx) => {
                              // Remove existing numbering from instruction if it exists
                              const cleanInstruction = instruction.replace(/^\d+\.\s*/, '');
                              return (
                                <Text key={idx} variant="bodyMedium" style={styles.ingredientItem}>
                                  {idx + 1}. {cleanInstruction}
                                </Text>
                              );
                            })}
                          </View>
                        </>
                      )}
                    </Card.Content>

                    <Card.Actions style={styles.cardActions}>
                      <Button
                        mode="outlined"
                        onPress={() => handleYouTubeSearch(recipe.name)}
                        icon="youtube"
                        style={styles.youtubeButton}
                      >
                        {t('recipe.youtubeSearch')}
                      </Button>
                      <Button
                        mode={bookmarkedRecipes.has(recipe.name) ? "contained" : "outlined"}
                        onPress={() => handleToggleBookmark(recipe)}
                        icon={bookmarkedRecipes.has(recipe.name) ? "bookmark" : "bookmark-outline"}
                        style={[
                          styles.bookmarkButton,
                          bookmarkedRecipes.has(recipe.name) && styles.bookmarkButtonActive
                        ]}
                        loading={savingRecipe === recipe.name}
                        disabled={savingRecipe === recipe.name}
                      >
                        {bookmarkedRecipes.has(recipe.name) ? t('recipe.bookmarked') : t('recipe.bookmark')}
                      </Button>
                    </Card.Actions>
                  </Card>
                ))}
              </>
            )}
          </>
        ) : (
          <Surface style={styles.emptyCard} elevation={1}>
            <Text variant="bodyLarge" style={styles.emptyText}>
              재료가 없습니다
            </Text>
            <Text variant="bodyMedium" style={styles.emptySubText}>
              재고 관리에서 재료를 추가해주세요
            </Text>
          </Surface>
        )}
      </ScrollView>
    </View>
  );
};

// 요리책 탭
const BookmarksTab = () => {
  const { t } = useTranslation('cooking');
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([]);
  const [displayedRecipes, setDisplayedRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [ingredients, setIngredients] = useState<FoodItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [sortBy, setSortBy] = useState<'recent' | 'ingredients'>('recent');
  const { user } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<CookingStackParamList>>();
  const isFocused = useIsFocused();

  // Service instances
  const inventoryService = useMemo(() => {
    const apiKey = process.env.EXPO_PUBLIC_GOOGLE_GENERATIVE_AI_KEY ||
                   process.env.EXPO_PUBLIC_GEMINI_API_KEY;
    return new InventoryService(supabaseClient, apiKey);
  }, []);

  useEffect(() => {
    if (user?.id && isFocused) {
      loadSavedRecipes();
      loadIngredients();
    }
  }, [user?.id, isFocused]);

  const loadIngredients = async () => {
    if (!user?.id) return;

    try {
      const items = await inventoryService.getCookingIngredients(user.id);
      setIngredients(items);
    } catch (error) {
      console.error('Failed to load ingredients:', error);
      setIngredients([]);
    }
  };

  const loadSavedRecipes = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const recipes = await recipeService.getBookmarkedRecipes(user.id);
      const mappedRecipes = recipes.map(r => ({
        name: r.name,
        ingredients: r.ingredients,
        difficulty: r.difficulty,
        cookingTime: r.cookingTime,
        instructions: r.instructions
      }));
      setSavedRecipes(mappedRecipes);
      sortAndFilterRecipes(mappedRecipes, sortBy, searchQuery);
    } catch (error) {
      console.error('Failed to load saved recipes:', error);
    } finally {
      setLoading(false);
    }
  };

  // Sort and filter recipes
  const sortAndFilterRecipes = (recipes: Recipe[], sort: string, search: string) => {
    let filtered = [...recipes];

    // Apply search filter
    if (search) {
      filtered = filtered.filter(recipe =>
        recipe.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Apply sorting
    switch (sort) {
      case 'ingredients':
        // Sort by number of owned ingredients (descending)
        filtered.sort((a, b) => {
          const aCount = getAvailableCount(a.ingredients);
          const bCount = getAvailableCount(b.ingredients);
          return bCount - aCount;
        });
        break;
      case 'recent':
      default:
        // Sort by newest first (DB already returns in this order, but ensure consistency)
        // No additional sorting needed as DB returns in updated_at DESC order
        break;
    }

    setDisplayedRecipes(filtered);
  };

  // Update displayed recipes when search or sort changes
  useEffect(() => {
    sortAndFilterRecipes(savedRecipes, sortBy, searchQuery);
  }, [sortBy, searchQuery, savedRecipes]);



  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary.main} />
      </View>
    );
  }

  if (savedRecipes.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text variant="headlineSmall" style={styles.emptyText}>
          {t('bookmarks.empty')}
        </Text>
        <Text variant="bodyMedium" style={styles.emptySubText}>
          {t('bookmarks.emptyDesc')}
        </Text>
      </View>
    );
  }

  const handleCardPress = (recipe: Recipe) => {
    navigation.navigate('RecipeDetail', { recipe });
  };

  // Extract ingredient names with check marks for owned items
  const getIngredientNames = (recipeIngredients: string[]): React.ReactNode => {
    const displayIngredients = recipeIngredients.slice(0, 5);
    const hasMore = recipeIngredients.length > 5;

    return (
      <View style={styles.ingredientPreviewContainer}>
        {displayIngredients.map((ing, idx) => {
          const ingredientName = ing.split(' ')[0];
          const have = hasIngredient(ing);
          return (
            <View key={idx} style={styles.ingredientPreviewItem}>
              {have && (
                <MaterialCommunityIcons
                  name="check-circle"
                  size={12}
                  color={Colors.primary.main}
                  style={styles.checkIcon}
                />
              )}
              <Text
                variant="bodySmall"
                style={[
                  styles.ingredientPreviewText,
                  have && styles.hasIngredientText
                ]}
              >
                {ingredientName}
                {idx < displayIngredients.length - 1 || hasMore ? ', ' : ''}
              </Text>
            </View>
          );
        })}
        {hasMore && (
          <Text variant="bodySmall" style={styles.ingredientPreviewText}>
            {t('common:messages.more')}
          </Text>
        )}
      </View>
    );
  };

  // Check if user has an ingredient
  const hasIngredient = (ingredientName: string): boolean => {
    return ingredients.some(item =>
      ingredientName.toLowerCase().includes(item.name.toLowerCase()) ||
      item.name.toLowerCase().includes(ingredientName.toLowerCase())
    );
  };

  // Count how many ingredients user has for a recipe
  const getAvailableCount = (recipeIngredients: string[]): number => {
    return recipeIngredients.filter(ing => hasIngredient(ing)).length;
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      {showSearch && (
        <View style={styles.searchContainer}>
          <View style={styles.searchInputWrapper}>
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={t('search.recipePlaceholder')}
              placeholderTextColor="#9E9E9E"
              mode="outlined"
              style={styles.searchInput}
              dense
              contentStyle={styles.searchInputContent}
              left={<TextInput.Icon icon="magnify" color={Colors.text.secondary} />}
              right={searchQuery ? (
                <TextInput.Icon
                  icon="close"
                  color={Colors.text.secondary}
                  onPress={() => setSearchQuery('')}
                />
              ) : null}
            />
            <IconButton
              icon="close"
              size={20}
              iconColor={Colors.text.secondary}
              onPress={() => {
                setShowSearch(false);
                setSearchQuery('');
              }}
              style={styles.searchCloseButton}
            />
          </View>
        </View>
      )}

      {/* Sort and Count Bar */}
      <View style={styles.sortContainer}>
        <View style={styles.sortButtons}>
          <Chip
            mode={sortBy === 'recent' ? 'flat' : 'outlined'}
            onPress={() => setSortBy('recent')}
            style={[
              styles.sortChip,
              sortBy === 'recent' && styles.activeSortChip
            ]}
            textStyle={[
              styles.sortChipText,
              sortBy === 'recent' && styles.activeSortChipText
            ]}
            compact
          >
            {t('bookmarks.sortBy.recent')}
          </Chip>
          <Chip
            mode={sortBy === 'ingredients' ? 'flat' : 'outlined'}
            onPress={() => setSortBy('ingredients')}
            style={[
              styles.sortChip,
              sortBy === 'ingredients' && styles.activeSortChip
            ]}
            textStyle={[
              styles.sortChipText,
              sortBy === 'ingredients' && styles.activeSortChipText
            ]}
            compact
          >
            {t('bookmarks.sortBy.ingredients')}
          </Chip>
        </View>
        <View style={styles.countContainer}>
          <Text variant="bodySmall" style={styles.countText}>
            {t('bookmarks.total', { count: displayedRecipes.length })}
          </Text>
          <IconButton
            icon="magnify"
            size={20}
            onPress={() => setShowSearch(!showSearch)}
          />
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={{ paddingVertical: Spacing.md }}>
          {displayedRecipes.map((recipe, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => handleCardPress(recipe)}
              activeOpacity={0.7}
            >
              <Card style={styles.simpleRecipeCard} mode="outlined">
                <Card.Content>
                  <Text variant="titleMedium" style={styles.recipeTitle}>
                    {recipe.name}
                  </Text>

                  <View style={styles.simpleRecipeInfo}>
                    <View style={styles.recipeInfoLeft}>
                      <View style={styles.recipeInfoItem}>
                        <Text variant="bodySmall" style={styles.recipeInfoLabel}>
                          {t('recipe.difficulty')}:
                        </Text>
                        <Text variant="bodyMedium" style={styles.recipeInfoValue}>
                          {t(getDifficultyKey(recipe.difficulty))}
                        </Text>
                      </View>
                      <Text variant="bodyMedium" style={styles.timeText}>
                        ⏰ {recipe.cookingTime} {t('recipe.minutes')}
                      </Text>
                    </View>
                    {getAvailableCount(recipe.ingredients) > 0 && (
                      <Chip
                        mode="flat"
                        style={styles.availabilityChip}
                        textStyle={styles.availabilityChipText}
                      >
                        {t('recipe.hasIngredient')} {getAvailableCount(recipe.ingredients)}
                      </Chip>
                    )}
                  </View>

                  <View style={styles.ingredientPreviewRow}>
                    <Text variant="bodySmall" style={styles.ingredientLabel}>
                      {t('recipe.ingredients')}:
                    </Text>
                    {getIngredientNames(recipe.ingredients)}
                  </View>
                </Card.Content>
              </Card>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

export const CookingScreen = () => {
  const { t } = useTranslation('cooking');
  const route = useRoute();
  const [activeTab, setActiveTab] = useState<TabType>('bookmarks');
  const [passedRecommendations, setPassedRecommendations] = useState<Recipe[] | null>(null);
  const [fromIngredient, setFromIngredient] = useState<string | null>(null);

  // Check if we're coming from ItemDetailScreen with recommendations
  useEffect(() => {
    const params = route.params as any;
    if (params?.showRecommendations) {
      setActiveTab('recommend');
      setPassedRecommendations(params.recommendations || null);
      setFromIngredient(params.fromIngredient || null);
    }
  }, [route.params]);

  const TabButton: React.FC<{ tab: TabType; label: string }> = ({ tab, label }) => (
    <TouchableOpacity
      onPress={() => setActiveTab(tab)}
      style={[
        styles.tabButton,
        activeTab === tab && styles.activeTabButton
      ]}
    >
      <Text
        variant="labelLarge"
        style={[
          styles.tabButtonText,
          activeTab === tab && styles.activeTabButtonText
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.mainContainer}>
      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TabButton tab="bookmarks" label={t('tabs.bookmarks')} />
        <TabButton tab="recommend" label={t('tabs.recommend')} />
      </View>

      {/* Tab Content */}
      {activeTab === 'bookmarks' ? (
        <BookmarksTab />
      ) : (
        <CookingRecommendTab
          initialRecommendations={passedRecommendations}
          fromIngredient={fromIngredient}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: Colors.background.default,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background.default,
  },
  scrollView: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background.default,
  },
  infoCard: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    padding: Spacing.sm,  // Reduced padding from lg to sm
    backgroundColor: Colors.background.paper,
    borderRadius: 12,
    overflow: 'hidden',
  },
  infoText: {
    color: Colors.text.secondary,
    fontFamily: 'OpenSans-Regular',
    fontSize: 12,  // Reduced font size
    lineHeight: 16,  // Reduced line height
    marginBottom: Spacing.xs,  // Reduced margin
  },
  sectionTitle: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
    color: Colors.text.primary,
    fontFamily: 'OpenSans-SemiBold',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  ingredientChip: {
    marginVertical: 4,
    marginHorizontal: 2,
    height: 26,
    paddingHorizontal: 2.4,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 26,
  },
  chipText: {
    color: '#FFFFFF',
    fontFamily: 'OpenSans-Medium',
    fontSize: 10,
    lineHeight: 26,
    textAlign: 'center',
    textAlignVertical: 'center',
    marginTop: 0,
    marginBottom: 0,
    paddingTop: 0,
    paddingBottom: 0,
  },
  emptyCard: {
    margin: Spacing.md,
    padding: Spacing.xl,
    backgroundColor: Colors.background.paper,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.text.secondary,
    fontFamily: 'OpenSans-Medium',
    marginBottom: Spacing.xs,
  },
  emptySubText: {
    color: Colors.text.disabled,
    fontFamily: 'OpenSans-Regular',
    textAlign: 'center',
  },
  recommendButtonContainer: {
    marginTop: Spacing.sm,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  recommendButton: {
    borderRadius: 24,  // Pill shape design
  },
  recommendButtonContent: {
    paddingVertical: Spacing.xs,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    marginHorizontal: Spacing.md,
    paddingTop: 44,
  },
  tabButton: {
    flex: 1,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
    position: 'relative' as const,
  },
  activeTabButton: {
    borderBottomColor: Colors.primary.main,
    borderBottomWidth: 3,
  },
  tabButtonText: {
    textAlign: 'center' as const,
    color: Colors.text.secondary,
    fontFamily: 'OpenSans-Medium',
  },
  activeTabButtonText: {
    color: Colors.primary.main,
    fontFamily: 'OpenSans-Bold',
    fontWeight: '700',
    fontWeight: '600' as const,
  },
  modalContainer: {
    backgroundColor: Colors.background.paper,
    margin: Spacing.lg,
    borderRadius: 16,
    maxHeight: '80%',
    padding: Spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalTitle: {
    color: Colors.text.primary,
    fontFamily: 'OpenSans-Bold',
  },
  closeButton: {
    margin: 0,
  },
  recipeCard: {
    marginBottom: Spacing.md,
    marginHorizontal: Spacing.md,
    backgroundColor: Colors.background.paper,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border.light,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  recipeTitle: {
    color: Colors.text.primary,
    fontFamily: 'OpenSans-Bold',
    marginBottom: Spacing.xs,
  },
  recipeDescription: {
    color: Colors.text.secondary,
    fontFamily: 'OpenSans-Regular',
    marginBottom: Spacing.sm,
    lineHeight: 20,
  },
  recipeInfo: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  easyBadge: {
    backgroundColor: '#4CAF50',
  },
  normalBadge: {
    backgroundColor: '#FF9800',
  },
  hardBadge: {
    backgroundColor: '#F44336',
  },
  badgeText: {
    fontSize: 12,
    fontFamily: 'OpenSans-Bold',
  },
  easyBadgeText: {
    color: '#FFFFFF',
  },
  normalBadgeText: {
    color: '#FFFFFF',
  },
  hardBadgeText: {
    color: '#FFFFFF',
  },
  timeBadge: {
    backgroundColor: Colors.background.default,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  timeBadgeText: {
    color: Colors.text.primary,
    fontSize: 12,
    fontFamily: 'OpenSans-SemiBold',
  },
  infoChip: {
    height: 28,
    borderColor: Colors.border.light,
  },
  easyChip: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF50',
  },
  normalChip: {
    backgroundColor: '#FFF3E0',
    borderColor: '#FF9800',
  },
  hardChip: {
    backgroundColor: '#FFEBEE',
    borderColor: '#F44336',
  },
  divider: {
    marginVertical: Spacing.sm,
    backgroundColor: Colors.border.light,
  },
  sectionLabel: {
    color: Colors.text.primary,
    fontFamily: 'OpenSans-SemiBold',
    marginBottom: Spacing.xs,
  },
  ingredientsList: {
    marginBottom: Spacing.sm,
  },
  ingredientItem: {
    color: Colors.text.secondary,
    fontFamily: 'OpenSans-Regular',
    marginBottom: 4,
    flex: 1,
  },
  ingredientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  hasIngredient: {
    color: Colors.primary.main,
    fontFamily: 'OpenSans-Medium',
  },
  missingIngredient: {
    color: Colors.text.secondary,
    fontFamily: 'OpenSans-Regular',
    opacity: 0.7,
  },
  hasChip: {
    backgroundColor: '#E8F5E9',
    height: 28,
    marginLeft: Spacing.xs,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 0,
    paddingHorizontal: Spacing.sm,
    minWidth: 50,
  },
  hasChipText: {
    fontSize: 12,
    color: '#4CAF50',
    fontFamily: 'OpenSans-SemiBold',
    lineHeight: 16,
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  missingChip: {
    backgroundColor: '#FFF3E0',
    height: 24,
    marginLeft: Spacing.xs,
  },
  missingChipText: {
    fontSize: 11,
    color: '#FF9800',
    fontFamily: 'OpenSans-SemiBold',
  },
  youtubeButton: {
    borderColor: Colors.primary.main,
    flex: 1,
    marginRight: Spacing.xs,
  },
  cardActions: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  bookmarkButton: {
    borderColor: Colors.primary.main,
    flex: 1,
    marginLeft: Spacing.xs,
  },
  bookmarkButtonActive: {
    backgroundColor: Colors.primary.main,
  },
  legendCard: {
    margin: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.background.paper,
    borderRadius: 8,
  },
  legendTitle: {
    color: Colors.text.secondary,
    fontFamily: 'OpenSans-SemiBold',
    marginBottom: Spacing.xs,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: 4,  // Reduced margin
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,  // Reduced gap
  },
  legendColor: {
    width: 12,  // Reduced size
    height: 12,  // Reduced size
    borderRadius: 3,  // Reduced radius
  },
  // Simple bookmark card styles
  simpleRecipeCard: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.background.paper,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border.light,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  simpleRecipeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  recipeInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  simpleDifficultyChip: {
    height: 24,
  },
  simpleChipText: {
    fontSize: 12,
    color: Colors.background.paper,
  },
  easyChipSimple: {
    backgroundColor: Colors.status.success,
  },
  normalChipSimple: {
    backgroundColor: Colors.status.warning,
  },
  hardChipSimple: {
    backgroundColor: '#F44336',
  },
  recipeInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  recipeInfoLabel: {
    color: Colors.text.disabled,
    fontFamily: 'OpenSans-Regular',
  },
  recipeInfoValue: {
    color: Colors.text.secondary,
    fontFamily: 'OpenSans-Regular',
  },
  timeText: {
    color: Colors.text.secondary,
    fontFamily: 'OpenSans-Regular',
  },
  ingredientPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  ingredientLabel: {
    color: Colors.text.disabled,
    fontFamily: 'OpenSans-Regular',
    marginRight: Spacing.xs,
  },
  ingredientPreviewContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    flex: 1,
  },
  ingredientPreviewItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ingredientPreviewText: {
    color: Colors.text.secondary,
    fontFamily: 'OpenSans-Regular',
  },
  hasIngredientText: {
    color: Colors.primary.main,
    fontFamily: 'OpenSans-Medium',
  },
  checkIcon: {
    marginRight: 2,
  },
  availabilityChip: {
    backgroundColor: '#E8F5E9',
    height: 28,
    marginLeft: Spacing.xs,
    alignSelf: 'center',
    justifyContent: 'center',
    paddingHorizontal: 0,
  },
  availabilityChipText: {
    fontSize: 12,
    color: '#4CAF50',
    fontFamily: 'OpenSans-SemiBold',
    lineHeight: 16,
    textAlignVertical: 'center',
  },
  availabilityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  availabilityLabel: {
    color: Colors.text.disabled,
    fontFamily: 'OpenSans-Regular',
  },
  availabilityCount: {
    color: Colors.primary.main,
    fontFamily: 'OpenSans-Bold',
  },
  searchContainer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    backgroundColor: Colors.background.default,
    height: 36,
  },
  searchInputContent: {
    paddingVertical: 6,
    fontSize: 14,
  },
  searchCloseButton: {
    margin: 0,
    marginLeft: Spacing.xs,
  },
  sortContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    backgroundColor: Colors.background.paper,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    minHeight: 44,
  },
  sortButtons: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  sortChip: {
    marginRight: Spacing.xs,
    backgroundColor: Colors.background.paper,
    borderWidth: 1.5,
    borderColor: Colors.border.light,
    height: 32,
    paddingHorizontal: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeSortChip: {
    backgroundColor: Colors.primary.main,
    borderColor: Colors.primary.main,
    shadowColor: Colors.primary.main,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  sortChipText: {
    color: Colors.text.primary,
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
    textAlignVertical: 'center',
    marginTop: 0,
    marginBottom: 0,
    paddingTop: 0,
    paddingBottom: 0,
    fontFamily: 'OpenSans-SemiBold',
  },
  activeSortChipText: {
    color: Colors.text.onPrimary,
  },
  countContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  countText: {
    color: Colors.text.secondary,
    fontFamily: 'OpenSans-Regular',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
  },
  modalButton: {
    flex: 1,
  },
  selectAllContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.xs,
    marginBottom: Spacing.xs,
    backgroundColor: Colors.background.paper,
    borderRadius: 8,
  },
  selectAllText: {
    color: Colors.text.primary,
    fontFamily: 'OpenSans-Medium',
  },
  chipContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipCheckIcon: {
    marginRight: 4,
  },
  cookingStyleContainer: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  cookingStyleInput: {
    backgroundColor: Colors.background.paper,
    fontSize: 14,
    fontFamily: 'OpenSans-Regular',
    minHeight: 56,
  },
  cookingStyleHint: {
    color: Colors.text.disabled,
    fontFamily: 'OpenSans-Regular',
    marginTop: Spacing.xs,
    marginLeft: Spacing.xs,
    fontSize: 11,
  },
});