import React, { useState, useEffect, useMemo } from 'react';
import { View, ScrollView, StyleSheet, Linking, Alert } from 'react-native';
import {
  Surface,
  Text,
  Button,
  IconButton,
  ActivityIndicator,
  Chip,
} from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Colors } from '../constants/colors';
import { Spacing } from '../constants/spacing';
import { Recipe } from '../services/AIService';
import { RecipeService } from '../services/RecipeService';
import { useAuth } from '../hooks/useAuth';
import { InventoryService } from '../services/InventoryService';
import { FoodItem } from '../models/FoodItem';
import { supabaseClient } from '../services/supabaseClient';
import { ShoppingService } from '../services/ShoppingService';
import { useShoppingCount } from '../contexts/ShoppingContext';

// Helper function to get difficulty translation key
const getDifficultyKey = (difficulty: string): string => {
  const difficultyKeys: { [key: string]: string } = {
    'easy': 'difficulty.easy',
    'medium': 'difficulty.medium',
    'hard': 'difficulty.hard'
  };
  return difficultyKeys[difficulty?.toLowerCase()] || 'difficulty.medium';
};

// Extract ingredient name only (remove quantity and unit)
// e.g., "양파 1/4개" -> "양파", "토마토 2개" -> "토마토", "소금 약간" -> "소금", "청양고추 1/2개 (선택)" -> "청양고추"
const extractIngredientName = (fullIngredient: string): string => {
  let cleanedName = fullIngredient;

  // Remove parenthetical notes like (선택), (옵션), etc.
  cleanedName = cleanedName.replace(/\([^)]*\)/g, '');

  // Remove "약간", "조금", "적당량" etc.
  cleanedName = cleanedName.replace(/약간|조금|적당량|적당히|소량/g, '');

  // Remove numbers and fractions
  cleanedName = cleanedName.replace(/\d+\/?\d*/g, '');

  // Remove common units
  cleanedName = cleanedName.replace(/개|g|kg|ml|L|큰술|작은술|컵|스푼|조각|장|줄기|송이|알|봉지|팩|통|덩어리|티스푼|테이블스푼/g, '');

  // Clean up extra spaces
  cleanedName = cleanedName.replace(/\s+/g, ' ').trim();

  return cleanedName || fullIngredient; // Fallback to original if parsing fails
};

export const RecipeDetailScreen = () => {
  const { t } = useTranslation('cooking');
  const navigation = useNavigation();
  const route = useRoute();
  const { recipe, fromItemDetail } = route.params as { recipe: Recipe; fromItemDetail?: boolean };
  const [deletingRecipe, setDeletingRecipe] = useState(false);
  const [ingredients, setIngredients] = useState<FoodItem[]>([]);
  const [shoppingItems, setShoppingItems] = useState<Set<string>>(new Set());
  const { user } = useAuth();
  const { refreshCount } = useShoppingCount();

  // Service instances
  const inventoryService = useMemo(() => {
    return new InventoryService(supabaseClient);
  }, []);

  const recipeService = useMemo(() => {
    return new RecipeService();
  }, []);

  const shoppingService = useMemo(() => {
    return new ShoppingService(supabaseClient);
  }, []);

  useEffect(() => {
    if (user?.id) {
      loadIngredients();
      loadShoppingItems();
    }
  }, [user?.id]);

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

  const loadShoppingItems = async () => {
    if (!user?.id) return;

    try {
      // Get active shopping items
      const activeItems = await shoppingService.getActiveItems(user.id);

      // Create a set of ingredient names that are in the shopping list
      const shoppingSet = new Set<string>();

      // Check each recipe ingredient against shopping list items
      recipe.ingredients.forEach(ingredient => {
        const ingredientName = extractIngredientName(ingredient);

        // Check if this ingredient name matches any shopping item
        const isInShopping = activeItems.some(item =>
          item.name.toLowerCase() === ingredientName.toLowerCase()
        );

        if (isInShopping) {
          shoppingSet.add(ingredient); // Store the full ingredient string for matching
        }
      });

      setShoppingItems(shoppingSet);
    } catch (error) {
      console.error('Error loading shopping items:', error);
    }
  };

  // Check if user has an ingredient
  const hasIngredient = (ingredientName: string): boolean => {
    return ingredients.some(item =>
      ingredientName.toLowerCase().includes(item.name.toLowerCase()) ||
      item.name.toLowerCase().includes(ingredientName.toLowerCase())
    );
  };

  const handleYouTubeSearch = () => {
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(recipe.name + ' 레시피')}`;
    Linking.openURL(url);
  };

  const handleRemoveBookmark = async () => {
    if (!user?.id) return;

    setDeletingRecipe(true);
    const result = await recipeService.toggleBookmark(user.id, recipe);

    if (result.success && !result.bookmarked) {
      navigation.goBack();
    }
    setDeletingRecipe(false);
  };

  const handleToggleShopping = async (ingredient: string) => {
    if (!user?.id) return;

    const ingredientName = extractIngredientName(ingredient);
    const newShoppingItems = new Set(shoppingItems);

    if (shoppingItems.has(ingredient)) {
      // Remove from shopping list
      newShoppingItems.delete(ingredient);

      // Remove from database
      try {
        // Get all active shopping items
        const activeItems = await shoppingService.getActiveItems(user.id);

        // Find the item with matching name
        const itemToDelete = activeItems.find(item =>
          item.name.toLowerCase() === ingredientName.toLowerCase()
        );

        if (itemToDelete) {
          // Delete the item from shopping list
          const result = await shoppingService.deleteItem(itemToDelete.id);
          if (!result.success) {
            console.error('Failed to remove from shopping list:', result.error);
            // Revert UI change if deletion failed
            newShoppingItems.add(ingredient);
          } else {
            // Update shopping count badge
            await refreshCount();
          }
        }
      } catch (error) {
        console.error('Error removing from shopping list:', error);
        // Revert UI change if error occurred
        newShoppingItems.add(ingredient);
      }
    } else {
      // Add to shopping list
      newShoppingItems.add(ingredient);
      // Add to shopping list in database with recipe name as memo
      try {
        const result = await shoppingService.addItem(user.id, ingredientName, recipe.name);
        if (!result.success) {
          console.error('Failed to add to shopping list:', result.error);
          // Revert UI change if addition failed
          newShoppingItems.delete(ingredient);
        } else {
          // Update shopping count badge
          await refreshCount();
        }
      } catch (error) {
        console.error('Error adding to shopping list:', error);
        // Revert UI change if error occurred
        newShoppingItems.delete(ingredient);
      }
    }

    setShoppingItems(newShoppingItems);
  };


  return (
    <Surface style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={() => {
            // Always use goBack() which will return to the previous screen
            navigation.goBack();
          }}
          style={styles.backButton}
        />
        <Text variant="labelLarge" style={styles.headerTitle}>
          {recipe.name}
        </Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Recipe Info Card */}
        <Surface style={styles.infoCard} elevation={1}>
          <View style={styles.infoContainer}>
            <Text variant="bodyMedium" style={styles.infoText}>
              {t('recipe.difficulty')}: {t(getDifficultyKey(recipe.difficulty))}
            </Text>
            <Text variant="bodyMedium" style={styles.infoText}>
              ⏰ {recipe.cookingTime} {t('recipe.minutes')}
            </Text>
          </View>
        </Surface>

        {/* Ingredients Card */}
        <Surface style={styles.sectionCard} elevation={1}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            {t('recipe.ingredients')}
          </Text>
          <View style={styles.ingredientsList}>
            {recipe.ingredients.map((ingredient, idx) => {
              const have = hasIngredient(ingredient);
              const inShopping = shoppingItems.has(ingredient);
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
                  {have ? (
                    <Chip
                      mode="flat"
                      style={styles.hasChip}
                      textStyle={styles.hasChipText}
                    >
                      {t('recipe.hasIngredient')}
                    </Chip>
                  ) : (
                    <Button
                      mode="outlined"
                      onPress={() => handleToggleShopping(ingredient)}
                      icon={inShopping ? "check" : "plus"}
                      style={[
                        styles.shoppingButton,
                        inShopping && styles.shoppingButtonActive
                      ]}
                      contentStyle={styles.shoppingButtonContent}
                      labelStyle={[
                        styles.shoppingButtonLabel,
                        inShopping && styles.shoppingButtonLabelActive
                      ]}
                      textColor={inShopping ? Colors.primary.main : '#757575'}
                      compact
                    >
                      {t('recipe.addToShopping')}
                    </Button>
                  )}
                </View>
              );
            })}
          </View>
        </Surface>

        {/* Instructions Card */}
        {recipe.instructions && recipe.instructions.length > 0 && (
          <Surface style={styles.sectionCard} elevation={1}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              {t('recipe.instructions')}
            </Text>
            <View style={styles.instructionsList}>
              {recipe.instructions.map((instruction, idx) => {
                const cleanInstruction = instruction.replace(/^\d+\.\s*/, '');
                return (
                  <View key={idx} style={styles.instructionItem}>
                    <Text variant="labelLarge" style={styles.instructionNumber}>
                      {idx + 1}
                    </Text>
                    <Text variant="bodyMedium" style={styles.instructionText}>
                      {cleanInstruction}
                    </Text>
                  </View>
                );
              })}
            </View>
          </Surface>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Button
            mode="outlined"
            onPress={handleYouTubeSearch}
            icon="youtube"
            style={styles.actionButton}
          >
            {t('recipe.youtubeSearch')}
          </Button>
          <Button
            mode="outlined"
            onPress={handleRemoveBookmark}
            icon="bookmark-remove"
            style={[styles.actionButton, styles.deleteButton]}
            labelStyle={styles.deleteButtonLabel}
            textColor="#616161"
            loading={deletingRecipe}
            disabled={deletingRecipe}
          >
            {t('common:buttons.delete')}
          </Button>
        </View>
      </ScrollView>
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.default,
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
    color: Colors.text.primary,  // Black text
    fontFamily: 'OpenSans-Bold',
    fontWeight: '700',
    fontSize: 16,  // Same size as ItemDetailScreen
    paddingTop: Spacing.lg,  // Same as tab
    paddingBottom: Spacing.md,  // Same as tab
  },
  content: {
    paddingVertical: Spacing.md,
  },
  infoCard: {
    backgroundColor: Colors.background.paper,
    borderRadius: 16,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    padding: Spacing.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border.light,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  infoContainer: {
    flexDirection: 'row',
    gap: Spacing.lg,
  },
  infoText: {
    color: Colors.text.secondary,
    fontFamily: 'OpenSans-Regular',
  },
  sectionCard: {
    backgroundColor: Colors.background.paper,
    borderRadius: 16,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    padding: Spacing.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border.light,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  sectionTitle: {
    color: Colors.text.primary,
    fontFamily: 'OpenSans-Bold',
    marginBottom: Spacing.md,
  },
  ingredientsList: {
    gap: Spacing.xs,
  },
  ingredientItem: {
    color: Colors.text.secondary,
    fontFamily: 'OpenSans-Regular',
    lineHeight: 24,
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
  instructionsList: {
    gap: Spacing.md,
  },
  instructionItem: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  instructionNumber: {
    color: Colors.primary.main,
    fontFamily: 'OpenSans-Bold',
    width: 24,
  },
  instructionText: {
    flex: 1,
    color: Colors.text.secondary,
    fontFamily: 'OpenSans-Regular',
    lineHeight: 24,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  actionButton: {
    flex: 1,
  },
  deleteButton: {
    borderColor: '#616161',
  },
  deleteButtonLabel: {
    color: '#616161',
    fontFamily: 'OpenSans-SemiBold',
  },
  shoppingButton: {
    borderRadius: 24,  // Pill shape
    borderColor: '#757575',
    minWidth: 90,
    height: 32,
    marginLeft: Spacing.xs,
  },
  shoppingButtonActive: {
    borderColor: Colors.primary.main,
  },
  shoppingButtonContent: {
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  shoppingButtonLabel: {
    fontSize: 12,
    color: '#757575',
    fontFamily: 'OpenSans-Medium',
    marginVertical: 0,
    marginTop: 0,
    marginBottom: 0,
    lineHeight: 16,
  },
  shoppingButtonLabelActive: {
    color: Colors.primary.main,
  },
});