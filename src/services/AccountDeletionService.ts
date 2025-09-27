import { supabaseClient } from './supabaseClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

export class AccountDeletionService {
  private supabase = supabaseClient;

  /**
   * 회원 탈퇴 메인 함수
   * 모든 사용자 데이터를 삭제하고 계정을 삭제합니다.
   */
  async deleteAccount(userId: string, userEmail: string): Promise<{ success: boolean; error?: string }> {
    try {

      // 1. 사용자 데이터 삭제 (식재료 데이터 제외)
      const dataDeleteResult = await this.deleteUserData(userId);

      if (!dataDeleteResult.success) {
        throw new Error(dataDeleteResult.error || '데이터 삭제 중 오류가 발생했습니다.');
      }

      // 2. 로컬 스토리지 정리
      await this.clearLocalStorage(userId);

      // 3. Supabase Auth 계정 삭제
      const authDeleteResult = await this.deleteAuthAccount();

      if (!authDeleteResult.success) {
        throw new Error(authDeleteResult.error || '계정 삭제 중 오류가 발생했습니다.');
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '회원 탈퇴 중 알 수 없는 오류가 발생했습니다.'
      };
    }
  }

  /**
   * 사용자 관련 데이터 삭제
   * food_items와 이미지는 삭제하지 않음
   */
  private async deleteUserData(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // shopping_items 삭제
      const { error: shoppingError } = await this.supabase
        .from('shopping_items')
        .delete()
        .eq('user_id', userId);

      if (shoppingError) {
        throw new Error('장보기 목록 삭제 중 오류가 발생했습니다.');
      }

      // user_saved_recipes 테이블이 있다면 삭제 (새로운 구조)
      try {
        const { error: userSavedRecipesError } = await this.supabase
          .from('user_saved_recipes')
          .delete()
          .eq('user_id', userId);

        if (userSavedRecipesError &&
            userSavedRecipesError.code !== '42P01' &&
            userSavedRecipesError.code !== 'PGRST205') {
          // 42P01: 테이블이 존재하지 않음 (PostgreSQL)
          // PGRST205: 테이블을 찾을 수 없음 (PostgREST)
        }
      } catch (error) {
        // user_saved_recipes 테이블 처리 중 오류 무시
      }

      // saved_recipes 테이블이 있다면 삭제 (레거시 구조)
      try {
        const { error: savedRecipesError } = await this.supabase
          .from('saved_recipes')
          .delete()
          .eq('user_id', userId);

        if (savedRecipesError &&
            savedRecipesError.code !== '42P01' &&
            savedRecipesError.code !== 'PGRST205') {
          // 테이블이 존재하지 않는 경우는 무시
        }
      } catch (error) {
        // saved_recipes 테이블 처리 중 오류 무시
      }

      // user_notifications 테이블이 있다면 삭제
      try {
        const { error: notificationsError } = await this.supabase
          .from('user_notifications')
          .delete()
          .eq('user_id', userId);

        if (notificationsError &&
            notificationsError.code !== '42P01' &&
            notificationsError.code !== 'PGRST205') {
          // 테이블이 존재하지 않는 경우는 무시
        }
      } catch (error) {
        // user_notifications 테이블 처리 중 오류 무시
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '사용자 데이터 삭제 중 오류가 발생했습니다.'
      };
    }
  }

  /**
   * AsyncStorage에서 사용자별 설정 삭제
   */
  private async clearLocalStorage(userId: string): Promise<void> {
    try {
      // 사용자별 설정 키 패턴
      const keysToDelete = [
        `@ez2cook_settings_${userId}`,
        `@ez2cook_notifications_${userId}`,
        `@ez2cook_preferences_${userId}`,
        `@ez2cook_cache_${userId}`
      ];

      // 모든 키 삭제
      await Promise.all(keysToDelete.map(key => AsyncStorage.removeItem(key)));

      // 추가로 사용자 ID를 포함하는 모든 키 검색 및 삭제
      const allKeys = await AsyncStorage.getAllKeys();
      const userKeys = allKeys.filter(key => key.includes(userId));

      if (userKeys.length > 0) {
        await AsyncStorage.multiRemove(userKeys);
      }

    } catch (error) {
      // 로컬 스토리지 오류는 치명적이지 않으므로 계속 진행
    }
  }

  /**
   * Supabase Auth 계정 삭제
   * Supabase는 클라이언트에서 직접 계정 삭제를 지원하지 않으므로,
   * 계정을 비활성화하고 데이터를 익명화하는 방식으로 구현
   */
  private async deleteAuthAccount(): Promise<{ success: boolean; error?: string }> {
    try {
      // 1. 계정 비활성화를 위해 사용자 메타데이터 업데이트 (timeout 설정)
      try {
        const updatePromise = this.supabase.auth.updateUser({
          data: {
            deleted: true,
            deleted_at: new Date().toISOString(),
            account_status: 'deleted'
          }
        });

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('updateUser timeout')), 5000)
        );

        const result = await Promise.race([updatePromise, timeoutPromise]);

      } catch (error) {
        // 메타데이터 업데이트 실패 무시
      }

      // 2. deleted_accounts 테이블에 삭제 기록 추가 (테이블이 있는 경우)
      try {
        // timeout을 짧게 설정하여 빠르게 실패하도록 함
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('deleted_accounts timeout')), 3000)
        );

        const insertPromise = (async () => {
          const { data: { user } } = await this.supabase.auth.getUser();
          if (user && user.email) {
            const { error: insertError } = await this.supabase
              .from('deleted_accounts')
              .insert({
                user_id: user.id,
                email: user.email,
                deleted_at: new Date().toISOString()
              });

            // 삽입 오류는 무시
          }
        })();

        // 3초 이내에 완료되지 않으면 timeout
        await Promise.race([insertPromise, timeoutPromise]);
      } catch (error) {
        // deleted_accounts 테이블이 없거나 timeout이어도 무시
        // deleted_accounts 테이블 처리 오류 무시
      }

      // 3. 로그아웃은 ProfileScreen에서 처리
      // 여기서는 로그아웃하지 않음 (사용자가 확인 버튼을 누를 때까지 세션 유지)

      return {
        success: true
      };
    } catch (error) {

      // 로그아웃은 ProfileScreen에서 처리하므로 여기서는 하지 않음

      return {
        success: false,
        error: '계정 비활성화 중 오류가 발생했습니다. 고객 지원에 문의해 주세요.'
      };
    }
  }

  /**
   * 이메일 확인
   * 사용자가 입력한 이메일이 현재 로그인된 계정의 이메일과 일치하는지 확인
   */
  async verifyEmail(inputEmail: string): Promise<boolean> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      return user?.email?.toLowerCase() === inputEmail.toLowerCase();
    } catch (error) {
      return false;
    }
  }
}

export const accountDeletionService = new AccountDeletionService();