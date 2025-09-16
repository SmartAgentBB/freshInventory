import { supabaseClient } from './supabaseClient';
import { Recipe } from './AIService';

export interface SavedRecipe extends Recipe {
  id: string;
  userId: string;
  bookmarked: boolean;
  createdAt: Date;
  updatedAt: Date;
  youtubeQuery?: string;
}

export class RecipeService {
  /**
   * Save or update a recipe bookmark
   */
  async toggleBookmark(userId: string, recipe: Recipe): Promise<{ success: boolean; bookmarked: boolean; error?: string }> {
    try {
      // Check if recipe already exists for this user
      const { data: existingRecipe, error: checkError } = await supabaseClient
        .from('saved_recipes')
        .select('id, bookmarked')
        .eq('user_id', userId)
        .eq('name', recipe.name)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw checkError;
      }

      if (existingRecipe) {
        // Toggle bookmark status
        const newBookmarkStatus = !existingRecipe.bookmarked;

        const { error: updateError } = await supabaseClient
          .from('saved_recipes')
          .update({
            bookmarked: newBookmarkStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingRecipe.id);

        if (updateError) throw updateError;

        return { success: true, bookmarked: newBookmarkStatus };
      } else {
        // Insert new recipe
        const { error: insertError } = await supabaseClient
          .from('saved_recipes')
          .insert({
            user_id: userId,
            name: recipe.name,
            ingredients: recipe.ingredients,
            difficulty: recipe.difficulty,
            cooking_time: recipe.cookingTime,
            instructions: recipe.instructions,
            youtube_query: recipe.name,
            bookmarked: true
          });

        if (insertError) throw insertError;

        return { success: true, bookmarked: true };
      }
    } catch (error) {
      console.error('Toggle bookmark error:', error);
      return {
        success: false,
        bookmarked: false,
        error: error instanceof Error ? error.message : 'Failed to toggle bookmark'
      };
    }
  }

  /**
   * Get all bookmarked recipes for a user
   */
  async getBookmarkedRecipes(userId: string): Promise<SavedRecipe[]> {
    try {
      const { data, error } = await supabaseClient
        .from('saved_recipes')
        .select('*')
        .eq('user_id', userId)
        .eq('bookmarked', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(item => ({
        id: item.id,
        userId: item.user_id,
        name: item.name,
        ingredients: item.ingredients,
        difficulty: item.difficulty,
        cookingTime: item.cooking_time,
        instructions: item.instructions,
        bookmarked: item.bookmarked,
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at),
        youtubeQuery: item.youtube_query
      }));
    } catch (error) {
      console.error('Get bookmarked recipes error:', error);
      return [];
    }
  }

  /**
   * Check if a recipe is bookmarked
   */
  async isBookmarked(userId: string, recipeName: string): Promise<boolean> {
    try {
      const { data, error } = await supabaseClient
        .from('saved_recipes')
        .select('bookmarked')
        .eq('user_id', userId)
        .eq('name', recipeName)
        .maybeSingle();

      if (error) {
        // 406 error or table not found - just return false
        if (error.code === 'PGRST116' || error.code === '406') {
          return false;
        }
        console.error('Check bookmark error:', error);
        return false;
      }

      return data?.bookmarked || false;
    } catch (error) {
      console.error('Check bookmark error:', error);
      return false;
    }
  }

  /**
   * Delete a saved recipe
   */
  async deleteRecipe(userId: string, recipeId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabaseClient
        .from('saved_recipes')
        .delete()
        .eq('id', recipeId)
        .eq('user_id', userId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Delete recipe error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete recipe'
      };
    }
  }

  /**
   * Subscribe to recipe changes
   */
  subscribeToRecipeChanges(userId: string, callback: (payload: any) => void) {
    return supabaseClient
      .channel(`saved-recipes-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'saved_recipes',
          filter: `user_id=eq.${userId}`
        },
        callback
      )
      .subscribe();
  }
}

export const recipeService = new RecipeService();