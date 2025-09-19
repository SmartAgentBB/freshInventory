import { SupabaseClient } from '@supabase/supabase-js';

export interface ShoppingItem {
  id: string;
  user_id: string;
  name: string;
  todo: boolean;
  memo: string | null;
  insert_date: string;
  update_date: string;
}

export class ShoppingService {
  constructor(private supabase: SupabaseClient) {}

  // 전체 쇼핑 목록 가져오기
  async getShoppingList(userId: string): Promise<ShoppingItem[]> {
    try {
      const { data, error } = await this.supabase
        .from('shopping_list')
        .select('*')
        .eq('user_id', userId)
        .order('update_date', { ascending: false });

      if (error) {
        console.error('Error fetching shopping list:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Failed to fetch shopping list:', error);
      return [];
    }
  }

  // 활성 쇼핑 목록 (todo = true)
  async getActiveItems(userId: string): Promise<ShoppingItem[]> {
    try {
      const { data, error } = await this.supabase
        .from('shopping_list')
        .select('*')
        .eq('user_id', userId)
        .eq('todo', true)
        .order('update_date', { ascending: false });

      if (error) {
        console.error('Error fetching active items:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Failed to fetch active items:', error);
      return [];
    }
  }

  // 완료한 쇼핑 목록 (todo = false)
  async getCompletedItems(userId: string): Promise<ShoppingItem[]> {
    try {
      const { data, error } = await this.supabase
        .from('shopping_list')
        .select('*')
        .eq('user_id', userId)
        .eq('todo', false)
        .order('update_date', { ascending: false })
        .limit(5); // 최근 5개만

      if (error) {
        console.error('Error fetching completed items:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Failed to fetch completed items:', error);
      return [];
    }
  }

  // 히스토리 데이터 (월별)
  async getHistoryByMonth(userId: string, year: number, month: number): Promise<ShoppingItem[]> {
    try {
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0, 23, 59, 59);

      const { data, error } = await this.supabase
        .from('shopping_list')
        .select('*')
        .eq('user_id', userId)
        .eq('todo', false)
        .gte('update_date', startDate.toISOString())
        .lte('update_date', endDate.toISOString())
        .order('update_date', { ascending: false });

      if (error) {
        console.error('Error fetching history:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Failed to fetch history:', error);
      return [];
    }
  }

  // 아이템 추가
  async addItem(userId: string, name: string, memo?: string): Promise<{ success: boolean; item?: ShoppingItem; error?: string }> {
    try {
      // 이미 활성 상태로 존재하는지 확인
      const { data: existing } = await this.supabase
        .from('shopping_list')
        .select('*')
        .eq('user_id', userId)
        .eq('name', name)
        .eq('todo', true)
        .single();

      if (existing) {
        return { success: false, error: '이미 쇼핑 목록에 있습니다.' };
      }

      const { data, error } = await this.supabase
        .from('shopping_list')
        .insert({
          user_id: userId,
          name,
          memo,
          todo: true
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding item:', error);
        return { success: false, error: error.message };
      }

      return { success: true, item: data };
    } catch (error) {
      console.error('Failed to add item:', error);
      return { success: false, error: '아이템 추가에 실패했습니다.' };
    }
  }

  // 아이템 상태 토글 (완료/미완료)
  async toggleItem(itemId: string, todo: boolean): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('shopping_list')
        .update({
          todo,
          update_date: new Date().toISOString()
        })
        .eq('id', itemId);

      if (error) {
        console.error('Error toggling item:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Failed to toggle item:', error);
      return { success: false, error: '상태 변경에 실패했습니다.' };
    }
  }

  // 아이템 삭제
  async deleteItem(itemId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('shopping_list')
        .delete()
        .eq('id', itemId);

      if (error) {
        console.error('Error deleting item:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Failed to delete item:', error);
      return { success: false, error: '삭제에 실패했습니다.' };
    }
  }

  // 메모 업데이트
  async updateMemo(itemId: string, memo: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('shopping_list')
        .update({
          memo,
          update_date: new Date().toISOString()
        })
        .eq('id', itemId);

      if (error) {
        console.error('Error updating memo:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Failed to update memo:', error);
      return { success: false, error: '메모 수정에 실패했습니다.' };
    }
  }

  // 아이템 업데이트 (이름 또는 메모)
  async updateItem(itemId: string, updates: { name?: string; memo?: string }): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('shopping_list')
        .update({
          ...updates,
          update_date: new Date().toISOString()
        })
        .eq('id', itemId);

      if (error) {
        console.error('Error updating item:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Failed to update item:', error);
      return { success: false, error: '수정에 실패했습니다.' };
    }
  }

  // 이름으로 아이템을 완료 처리
  async markAsCompletedByNames(userId: string, names: string[]): Promise<{ success: boolean; completedItems: string[]; error?: string }> {
    try {
      const completedItems: string[] = [];
      console.log('=== ShoppingService.markAsCompletedByNames ===');
      console.log('User ID:', userId);
      console.log('Names to complete:', JSON.stringify(names));

      for (const name of names) {
        console.log(`Processing item: "${name}"`);

        // First, find items with case-insensitive matching
        const { data: matchingItems, error: fetchError } = await this.supabase
          .from('shopping_list')
          .select('id, name')
          .eq('user_id', userId)
          .eq('todo', true)
          .ilike('name', name);  // Case-insensitive match

        console.log(`Query result for "${name}":`, JSON.stringify(matchingItems), 'Error:', fetchError);

        if (fetchError) {
          console.error('Error fetching shopping list item:', fetchError);
          continue;
        }

        if (matchingItems && matchingItems.length > 0) {
          console.log(`Found ${matchingItems.length} matching items for "${name}"`);
          // Update all matching items (only todo=TRUE items will be found due to the query filter)
          for (const item of matchingItems) {
            console.log(`Updating item ID ${item.id} with name "${item.name}" from todo=true to todo=false`);
            const { error: updateError, data: updateData } = await this.supabase
              .from('shopping_list')
              .update({
                todo: false,
                update_date: new Date().toISOString()
              })
              .eq('id', item.id)
              .eq('todo', true)  // Extra safety: only update if still todo=true
              .select();

            console.log(`Update result for ID ${item.id}:`, updateData, 'Error:', updateError);

            if (!updateError && updateData && updateData.length > 0) {
              completedItems.push(item.name);
              console.log(`Successfully marked "${item.name}" as completed`);
            } else if (updateError) {
              console.error(`Failed to update item ID ${item.id}:`, updateError);
            } else {
              console.log(`Item ID ${item.id} was not updated (possibly already completed)`);
            }
          }
        } else {
          console.log(`No matching items found for "${name}"`);
        }
      }

      console.log('=== Final result ===');
      console.log('Successfully completed items:', JSON.stringify(completedItems));
      return { success: true, completedItems };
    } catch (error) {
      console.error('Failed to mark items as completed:', error);
      return { success: false, completedItems: [], error: '완료 처리에 실패했습니다.' };
    }
  }

  // 활성 쇼핑 목록에서 특정 이름들을 확인
  async checkItemsInShoppingList(userId: string, names: string[]): Promise<string[]> {
    try {
      const itemsInList: string[] = [];
      console.log('=== ShoppingService.checkItemsInShoppingList ===');
      console.log('Checking items:', JSON.stringify(names));

      for (const name of names) {
        const { data, error } = await this.supabase
          .from('shopping_list')
          .select('name')
          .eq('user_id', userId)
          .ilike('name', name)  // Case-insensitive match
          .eq('todo', true);

        console.log(`Checking "${name}":`, JSON.stringify(data), 'Error:', error);

        if (data && data.length > 0) {
          // Return the detected item name (preserving the case from AI detection)
          itemsInList.push(name);
          console.log(`Found "${name}" in shopping list`);
        }
      }

      console.log('Items found in shopping list:', JSON.stringify(itemsInList));
      return itemsInList;
    } catch (error) {
      console.error('Failed to check items in shopping list:', error);
      return [];
    }
  }

  // 활성 아이템 개수
  async getActiveCount(userId: string): Promise<number> {
    try {
      const { count, error } = await this.supabase
        .from('shopping_list')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('todo', true);

      if (error) {
        console.error('Error getting count:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Failed to get count:', error);
      return 0;
    }
  }

  // 소비 완료 탭에서 재구매를 위해 아이템 추가
  async addFromHistory(userId: string, name: string): Promise<{ success: boolean; error?: string }> {
    return this.addItem(userId, name);
  }

  // 여러 아이템을 한 번에 추가 (레시피에서 사용)
  async addBulkItems(
    userId: string,
    items: Array<{ name: string; memo?: string }>
  ): Promise<{ success: boolean; added: number; errors: string[] }> {
    const errors: string[] = [];
    let added = 0;

    try {
      // 이미 존재하는 활성 아이템들 조회
      const { data: existingItems } = await this.supabase
        .from('shopping_list')
        .select('name')
        .eq('user_id', userId)
        .eq('todo', true);

      const existingNames = new Set(existingItems?.map(item => item.name) || []);

      // 중복되지 않는 아이템만 필터링
      const newItems = items.filter(item => !existingNames.has(item.name));

      if (newItems.length === 0) {
        return { success: false, added: 0, errors: ['모든 아이템이 이미 쇼핑 목록에 있습니다.'] };
      }

      // 새 아이템들 추가
      const { data, error } = await this.supabase
        .from('shopping_list')
        .insert(
          newItems.map(item => ({
            user_id: userId,
            name: item.name,
            memo: item.memo,
            todo: true
          }))
        )
        .select();

      if (error) {
        console.error('Error adding bulk items:', error);
        errors.push(error.message);
      } else {
        added = data?.length || 0;
      }

      return {
        success: added > 0,
        added,
        errors
      };
    } catch (error) {
      console.error('Failed to add bulk items:', error);
      return {
        success: false,
        added: 0,
        errors: ['대량 추가에 실패했습니다.']
      };
    }
  }
}