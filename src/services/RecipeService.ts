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
   * Convert Korean difficulty to English for database
   */
  private convertDifficultyToEnglish(difficulty: string | undefined | null): string {
    // Log the incoming difficulty value for debugging
    console.log('Converting difficulty:', difficulty, 'Type:', typeof difficulty);

    // Handle null, undefined, or empty string
    if (!difficulty) {
      console.log('Difficulty is null/undefined/empty, defaulting to medium');
      return 'medium';
    }

    // Normalize the input: trim whitespace and convert to lowercase
    const normalizedDifficulty = difficulty.toString().trim().toLowerCase();

    const difficultyMap: { [key: string]: string } = {
      '쉬움': 'easy',
      '보통': 'medium',
      '어려움': 'hard',
      '매우 쉬움': 'easy',
      '매우 어려움': 'hard',
      '매우쉬움': 'easy',
      '매우어려움': 'hard',
      // Also handle English values in case they're already in English
      'easy': 'easy',
      'medium': 'medium',
      'hard': 'hard'
    };

    // Check for mapped value
    const mappedValue = difficultyMap[normalizedDifficulty];

    if (mappedValue) {
      console.log('Mapped difficulty:', normalizedDifficulty, '->', mappedValue);
      return mappedValue;
    }

    // If no match found, log warning and default to 'medium'
    console.warn('Unknown difficulty value:', difficulty, '- defaulting to medium');
    return 'medium';
  }

  /**
   * Save or update a recipe bookmark
   */
  async toggleBookmark(userId: string, recipe: Recipe): Promise<{ success: boolean; bookmarked: boolean; error?: string }> {
    console.log('=== RecipeService.toggleBookmark ===');
    console.log('Recipe received:', JSON.stringify(recipe, null, 2));
    console.log('Recipe difficulty type:', typeof recipe.difficulty);
    console.log('Recipe difficulty value:', recipe.difficulty);

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
        // Store the original difficulty value if it's already in English
        // Otherwise convert Korean to English
        let finalDifficulty = recipe.difficulty || 'medium';

        // Check if it's already a valid English value
        const validDifficulties = ['easy', 'medium', 'hard'];
        if (!validDifficulties.includes(finalDifficulty.toLowerCase())) {
          // It's not valid English, so convert it
          finalDifficulty = this.convertDifficultyToEnglish(finalDifficulty);
        } else {
          // Make sure it's lowercase
          finalDifficulty = finalDifficulty.toLowerCase();
        }

        console.log('Final difficulty for insert:', finalDifficulty);

        // Insert new recipe
        const { error: insertError } = await supabaseClient
          .from('saved_recipes')
          .insert({
            user_id: userId,
            name: recipe.name,
            ingredients: recipe.ingredients,
            difficulty: finalDifficulty,
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
        .order('updated_at', { ascending: false });

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
        updatedAt: new Date(item.updated_at || item.created_at),
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