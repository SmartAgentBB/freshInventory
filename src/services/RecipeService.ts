import { supabaseClient } from './supabaseClient';
import { Recipe } from './AIService';

// ====================================================
// Types and Interfaces
// ====================================================

export interface SavedRecipe extends Recipe {
  id: string;
  userId: string;
  bookmarked: boolean;
  createdAt: Date;
  updatedAt: Date;
  youtubeQuery?: string;
}

export interface MasterRecipe {
  id: string;
  name: string;
  ingredients: Array<{ name: string; amount: string; unit: string }>;
  difficulty: 'easy' | 'medium' | 'hard';
  cookingTime: number;
  instructions: string[];
  youtubeQuery?: string;
  imageUrl?: string;
  createdBy: string;
  isPublic: boolean;
  saveCount: number;
  shareCount: number;
  sourceType: 'ai_generated' | 'user_created' | 'shared';
  createdAt: Date;
  updatedAt: Date;
}

export interface UserSavedRecipe {
  id: string;
  userId: string;
  recipeId: string;
  personalNotes?: string;
  rating?: number;
  savedAt: Date;
  lastViewedAt: Date;
  recipe?: MasterRecipe; // For joined queries
}

export interface RecipeShare {
  id: string;
  recipeId: string;
  sharedBy: string;
  shareCode: string;
  expiresAt: Date;
  viewCount: number;
  createdAt: Date;
}

export interface RecipeStats {
  recipeId: string;
  totalSaves: number;
  weeklySaves: number;
  monthlySaves: number;
  avgRating: number;
  popularityScore: number;
  lastCalculated: Date;
}

export interface PopularRecipe extends MasterRecipe {
  stats: RecipeStats;
}

// ====================================================
// RecipeService Class
// ====================================================

export class RecipeService {
  /**
   * Convert Korean difficulty to English for database
   */
  private convertDifficultyToEnglish(difficulty: string | undefined | null): 'easy' | 'medium' | 'hard' {
    if (!difficulty) return 'medium';

    const normalizedDifficulty = difficulty.toString().trim().toLowerCase();
    const difficultyMap: { [key: string]: 'easy' | 'medium' | 'hard' } = {
      '쉬움': 'easy',
      '보통': 'medium',
      '어려움': 'hard',
      '매우 쉬움': 'easy',
      '매우 어려움': 'hard',
      '매우쉬움': 'easy',
      '매우어려움': 'hard',
      'easy': 'easy',
      'medium': 'medium',
      'hard': 'hard'
    };

    return difficultyMap[normalizedDifficulty] || 'medium';
  }

  /**
   * Convert English difficulty back to Korean for display
   */
  private convertDifficultyToKorean(difficulty: string): string {
    const difficultyMap: { [key: string]: string } = {
      'easy': '쉬움',
      'medium': '보통',
      'hard': '어려움'
    };
    return difficultyMap[difficulty] || '보통';
  }

  /**
   * Save or update a recipe (new structure)
   */
  async saveRecipe(recipe: Recipe, userId: string): Promise<{ success: boolean; recipeId?: string; error?: string }> {
    try {
      // 임시: 기존 saved_recipes 테이블 사용
      const { data: existingRecipe } = await supabaseClient
        .from('saved_recipes')
        .select('id')
        .eq('name', recipe.name)
        .eq('user_id', userId)
        .single();

      if (existingRecipe) {
        // Update existing recipe
        const { error: updateError } = await supabaseClient
          .from('saved_recipes')
          .update({
            ingredients: recipe.ingredients,
            difficulty: recipe.difficulty,
            cooking_time: recipe.cookingTime,
            instructions: recipe.instructions,
            youtube_query: recipe.youtubeQuery,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingRecipe.id);

        if (updateError) throw updateError;
        return { success: true, recipeId: existingRecipe.id };
      } else {
        // Create new recipe in saved_recipes
        const { data: newRecipe, error: createError } = await supabaseClient
          .from('saved_recipes')
          .insert({
            user_id: userId,
            name: recipe.name,
            ingredients: recipe.ingredients,
            difficulty: recipe.difficulty,
            cooking_time: recipe.cookingTime,
            instructions: recipe.instructions,
            youtube_query: recipe.youtubeQuery,
            bookmarked: true
          })
          .select('id')
          .single();

        if (createError) throw createError;
        if (!newRecipe) throw new Error('Failed to create recipe');

        return { success: true, recipeId: newRecipe.id };
      }
    } catch (error) {
      console.error('Error saving recipe:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save recipe'
      };
    }
  }

  /**
   * Get user's saved recipes
   */
  async getUserSavedRecipes(userId: string): Promise<MasterRecipe[]> {
    try {
      // 임시: 기존 saved_recipes 테이블 사용
      const { data, error } = await supabaseClient
        .from('saved_recipes')
        .select('*')
        .eq('user_id', userId)
        .eq('bookmarked', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(item => ({
        id: item.id,
        name: item.name,
        ingredients: item.ingredients,
        difficulty: item.difficulty,
        cookingTime: item.cooking_time,
        instructions: item.instructions,
        youtubeQuery: item.youtube_query,
        imageUrl: '',
        createdBy: item.user_id,
        isPublic: false,
        saveCount: 1,
        shareCount: 0,
        sourceType: 'ai_generated' as const,
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at)
      }));
    } catch (error) {
      console.error('Error fetching saved recipes:', error);
      return [];
    }
  }

  /**
   * Get popular recipes
   */
  async getPopularRecipes(limit: number = 10): Promise<PopularRecipe[]> {
    try {
      const { data, error } = await supabaseClient
        .from('recipe_stats')
        .select(`
          *,
          recipe:recipes(*)
        `)
        .order('popularity_score', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data || []).map(item => ({
        ...item.recipe,
        difficulty: this.convertDifficultyToKorean(item.recipe.difficulty),
        cookingTime: item.recipe.cooking_time,
        createdBy: item.recipe.created_by,
        isPublic: item.recipe.is_public,
        saveCount: item.recipe.save_count,
        shareCount: item.recipe.share_count,
        sourceType: item.recipe.source_type,
        imageUrl: item.recipe.image_url,
        youtubeQuery: item.recipe.youtube_query,
        createdAt: new Date(item.recipe.created_at),
        updatedAt: new Date(item.recipe.updated_at),
        stats: {
          recipeId: item.recipe_id,
          totalSaves: item.total_saves,
          weeklySaves: item.weekly_saves,
          monthlySaves: item.monthly_saves,
          avgRating: item.avg_rating,
          popularityScore: item.popularity_score,
          lastCalculated: new Date(item.last_calculated)
        }
      }));
    } catch (error) {
      console.error('Error fetching popular recipes:', error);
      return [];
    }
  }

  /**
   * Create a share link for a recipe
   */
  async createShareLink(recipeId: string, userId: string): Promise<{ success: boolean; shareCode?: string; error?: string }> {
    try {
      // First verify the user can share this recipe
      const { data: recipe, error: recipeError } = await supabaseClient
        .from('recipes')
        .select('created_by, is_public')
        .eq('id', recipeId)
        .single();

      if (recipeError) throw recipeError;
      if (!recipe) throw new Error('Recipe not found');

      // Check permission: user must be creator or recipe must be public
      if (recipe.created_by !== userId && !recipe.is_public) {
        throw new Error('You do not have permission to share this recipe');
      }

      // Create share entry (share_code is auto-generated by trigger)
      const { data: share, error: shareError } = await supabaseClient
        .from('recipe_shares')
        .insert({
          recipe_id: recipeId,
          shared_by: userId
        })
        .select('share_code')
        .single();

      if (shareError) throw shareError;
      if (!share) throw new Error('Failed to create share link');

      return { success: true, shareCode: share.share_code };
    } catch (error) {
      console.error('Error creating share link:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create share link'
      };
    }
  }

  /**
   * Get recipe by share code
   */
  async getRecipeByShareCode(shareCode: string): Promise<MasterRecipe | null> {
    try {
      // First, get the share and check if it's valid
      const { data: share, error: shareError } = await supabaseClient
        .from('recipe_shares')
        .select('recipe_id, expires_at, view_count')
        .eq('share_code', shareCode)
        .single();

      if (shareError || !share) return null;

      // Check if share is expired
      if (new Date(share.expires_at) < new Date()) {
        console.log('Share link has expired');
        return null;
      }

      // Increment view count
      await supabaseClient
        .from('recipe_shares')
        .update({ view_count: share.view_count + 1 })
        .eq('share_code', shareCode);

      // Get the recipe
      const { data: recipe, error: recipeError } = await supabaseClient
        .from('recipes')
        .select('*')
        .eq('id', share.recipe_id)
        .single();

      if (recipeError || !recipe) return null;

      return {
        ...recipe,
        difficulty: this.convertDifficultyToKorean(recipe.difficulty),
        cookingTime: recipe.cooking_time,
        createdBy: recipe.created_by,
        isPublic: recipe.is_public,
        saveCount: recipe.save_count,
        shareCount: recipe.share_count,
        sourceType: recipe.source_type,
        imageUrl: recipe.image_url,
        youtubeQuery: recipe.youtube_query,
        createdAt: new Date(recipe.created_at),
        updatedAt: new Date(recipe.updated_at)
      };
    } catch (error) {
      console.error('Error fetching recipe by share code:', error);
      return null;
    }
  }

  /**
   * Save a shared recipe to user's collection
   */
  async saveSharedRecipe(recipeId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Add user-recipe relationship
      const { error } = await supabaseClient
        .from('user_saved_recipes')
        .upsert({
          user_id: userId,
          recipe_id: recipeId,
          saved_at: new Date().toISOString(),
          last_viewed_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,recipe_id'
        });

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error saving shared recipe:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save recipe'
      };
    }
  }

  /**
   * Rate a recipe
   */
  async rateRecipe(recipeId: string, userId: string, rating: number): Promise<{ success: boolean; error?: string }> {
    try {
      if (rating < 1 || rating > 5) {
        throw new Error('Rating must be between 1 and 5');
      }

      const { error } = await supabaseClient
        .from('user_saved_recipes')
        .update({ rating })
        .eq('user_id', userId)
        .eq('recipe_id', recipeId);

      if (error) throw error;

      // Trigger stats recalculation
      await supabaseClient.rpc('update_recipe_stats');

      return { success: true };
    } catch (error) {
      console.error('Error rating recipe:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to rate recipe'
      };
    }
  }

  /**
   * Delete a recipe (mark as unbookmarked in legacy mode)
   */
  async deleteRecipe(recipeId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Remove user-recipe relationship
      const { error } = await supabaseClient
        .from('user_saved_recipes')
        .delete()
        .eq('user_id', userId)
        .eq('recipe_id', recipeId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error deleting recipe:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete recipe'
      };
    }
  }

  /**
   * Get recipe details
   */
  async getRecipeDetails(recipeId: string, userId: string): Promise<MasterRecipe | null> {
    try {
      const { data: recipe, error } = await supabaseClient
        .from('recipes')
        .select('*')
        .eq('id', recipeId)
        .single();

      if (error || !recipe) return null;

      // Update last viewed
      await supabaseClient
        .from('user_saved_recipes')
        .update({ last_viewed_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('recipe_id', recipeId);

      return {
        ...recipe,
        difficulty: this.convertDifficultyToKorean(recipe.difficulty),
        cookingTime: recipe.cooking_time,
        createdBy: recipe.created_by,
        isPublic: recipe.is_public,
        saveCount: recipe.save_count,
        shareCount: recipe.share_count,
        sourceType: recipe.source_type,
        imageUrl: recipe.image_url,
        youtubeQuery: recipe.youtube_query,
        createdAt: new Date(recipe.created_at),
        updatedAt: new Date(recipe.updated_at)
      };
    } catch (error) {
      console.error('Error fetching recipe details:', error);
      return null;
    }
  }

  /**
   * Search recipes
   */
  async searchRecipes(query: string, userId?: string): Promise<MasterRecipe[]> {
    try {
      let queryBuilder = supabaseClient
        .from('recipes')
        .select('*')
        .ilike('name', `%${query}%`);

      // If userId provided, include user's private recipes
      if (userId) {
        queryBuilder = queryBuilder.or(`is_public.eq.true,created_by.eq.${userId}`);
      } else {
        queryBuilder = queryBuilder.eq('is_public', true);
      }

      const { data, error } = await queryBuilder
        .order('save_count', { ascending: false })
        .limit(20);

      if (error) throw error;

      return (data || []).map(recipe => ({
        ...recipe,
        difficulty: this.convertDifficultyToKorean(recipe.difficulty),
        cookingTime: recipe.cooking_time,
        createdBy: recipe.created_by,
        isPublic: recipe.is_public,
        saveCount: recipe.save_count,
        shareCount: recipe.share_count,
        sourceType: recipe.source_type,
        imageUrl: recipe.image_url,
        youtubeQuery: recipe.youtube_query,
        createdAt: new Date(recipe.created_at),
        updatedAt: new Date(recipe.updated_at)
      }));
    } catch (error) {
      console.error('Error searching recipes:', error);
      return [];
    }
  }

  // ====================================================
  // Backward Compatibility Methods
  // ====================================================

  /**
   * Get bookmarked recipes (alias for getUserSavedRecipes)
   */
  async getBookmarkedRecipes(userId: string): Promise<SavedRecipe[]> {
    const recipes = await this.getUserSavedRecipes(userId);
    return recipes.map(recipe => ({
      id: recipe.id,
      userId: recipe.createdBy,
      name: recipe.name,
      ingredients: recipe.ingredients,
      difficulty: recipe.difficulty,
      cookingTime: recipe.cookingTime,
      instructions: recipe.instructions,
      youtubeQuery: recipe.youtubeQuery,
      bookmarked: true,
      createdAt: recipe.createdAt,
      updatedAt: recipe.updatedAt
    }));
  }

  /**
   * Toggle bookmark (backward compatibility)
   */
  async toggleBookmark(recipeId: string, userId: string, bookmarked: boolean): Promise<{ success: boolean; error?: string }> {
    if (bookmarked) {
      // Save recipe
      return this.saveSharedRecipe(recipeId, userId);
    } else {
      // Remove recipe
      return this.deleteRecipe(recipeId, userId);
    }
  }
}

export const recipeService = new RecipeService();