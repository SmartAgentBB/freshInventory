import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Card, Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../constants/colors';
import { Spacing } from '../constants/spacing';
import { Recipe } from '../models/Recipe';

// Helper function to convert English difficulty to Korean
const getDifficultyText = (difficulty: string): string => {
  const difficultyMap: { [key: string]: string } = {
    'easy': '쉬움',
    'medium': '보통',
    'hard': '어려움'
  };
  return difficultyMap[difficulty?.toLowerCase()] || difficulty || '보통';
};

interface RecipeCardProps {
  recipe: Recipe;
  onPress?: (recipe: Recipe) => void;
  ingredients?: { name: string }[];
  compact?: boolean;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({
  recipe,
  onPress,
  ingredients = [],
  compact = false
}) => {
  const handlePress = () => {
    onPress?.(recipe);
  };

  const hasIngredient = (ingredientName: string): boolean => {
    return ingredients.some(item =>
      ingredientName.toLowerCase().includes(item.name.toLowerCase()) ||
      item.name.toLowerCase().includes(ingredientName.toLowerCase())
    );
  };

  const getAvailableCount = (): number => {
    return recipe.ingredients.filter(ing => hasIngredient(ing)).length;
  };

  const getIngredientNames = (): React.ReactNode => {
    const displayIngredients = recipe.ingredients.slice(0, 5);
    const hasMore = recipe.ingredients.length > 5;

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
            외
          </Text>
        )}
      </View>
    );
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      <Card style={[styles.card, compact && styles.compactCard]} mode="outlined">
        <Card.Content>
          <Text variant="titleMedium" style={styles.recipeTitle}>
            {recipe.name}
          </Text>

          <View style={styles.recipeInfo}>
            <View style={styles.recipeInfoLeft}>
              <View style={styles.recipeInfoItem}>
                <Text variant="bodySmall" style={styles.recipeInfoLabel}>
                  난이도:
                </Text>
                <Text variant="bodyMedium" style={styles.recipeInfoValue}>
                  {getDifficultyText(recipe.difficulty)}
                </Text>
              </View>
              <Text variant="bodyMedium" style={styles.timeText}>
                ⏰ {recipe.cookingTime}분
              </Text>
            </View>

            {ingredients.length > 0 && (
              <View style={styles.availableChip}>
                <Text variant="bodySmall" style={styles.availableChipText}>
                  {getAvailableCount()}/{recipe.ingredients.length} 재료 보유
                </Text>
              </View>
            )}
          </View>

          {!compact && ingredients.length > 0 && (
            <View style={styles.ingredientSection}>
              <Text variant="bodySmall" style={styles.ingredientLabel}>
                필요한 재료:
              </Text>
              {getIngredientNames()}
            </View>
          )}
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
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
  compactCard: {
    marginBottom: Spacing.sm,
  },
  recipeTitle: {
    color: Colors.text.primary,
    fontFamily: 'OpenSans-Bold',
    marginBottom: Spacing.xs,
  },
  recipeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  recipeInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  recipeInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  recipeInfoLabel: {
    color: Colors.text.secondary,
    fontFamily: 'OpenSans-Regular',
  },
  recipeInfoValue: {
    color: Colors.text.primary,
    fontFamily: 'OpenSans-Medium',
  },
  timeText: {
    color: Colors.text.secondary,
    fontFamily: 'OpenSans-Regular',
  },
  availableChip: {
    backgroundColor: Colors.primary.light,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  availableChipText: {
    color: Colors.primary.main,
    fontFamily: 'OpenSans-SemiBold',
  },
  ingredientSection: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  ingredientLabel: {
    color: Colors.text.secondary,
    fontFamily: 'OpenSans-Regular',
    marginBottom: Spacing.xs,
  },
  ingredientPreviewContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  ingredientPreviewItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkIcon: {
    marginRight: 2,
  },
  ingredientPreviewText: {
    color: Colors.text.secondary,
    fontFamily: 'OpenSans-Regular',
  },
  hasIngredientText: {
    color: Colors.primary.main,
    fontFamily: 'OpenSans-Medium',
  },
});