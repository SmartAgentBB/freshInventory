import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabaseClient } from './supabaseClient';

/**
 * 프롬프트 템플릿 인터페이스
 */
export interface PromptTemplate {
  id: string;
  template_key: string;
  template_content: string;
  version: number;
  is_active: boolean;
  updated_at: string;
  description?: string;
}

/**
 * 프롬프트 템플릿 서비스
 *
 * 3단계 폴백 시스템:
 * 1. 메모리 캐시 (앱 실행 중)
 * 2. AsyncStorage 캐시 (로컬 저장)
 * 3. Supabase DB (원본)
 */
export class PromptTemplateService {
  // 메모리 캐시
  private memoryCache: Map<string, PromptTemplate> = new Map();

  // AsyncStorage 키
  private readonly STORAGE_KEY = '@ez2cook_prompt_templates';
  private readonly LAST_SYNC_KEY = '@ez2cook_prompt_last_sync';

  // 동기화 간격 (24시간)
  private readonly SYNC_INTERVAL = 24 * 60 * 60 * 1000;

  // 싱글톤 인스턴스
  private static instance: PromptTemplateService | null = null;

  /**
   * 싱글톤 인스턴스 가져오기
   */
  static getInstance(): PromptTemplateService {
    if (!PromptTemplateService.instance) {
      PromptTemplateService.instance = new PromptTemplateService();
    }
    return PromptTemplateService.instance;
  }

  /**
   * 프롬프트 가져오기 (3단계 폴백)
   *
   * @param key - 프롬프트 템플릿 키 (예: 'recipe_recommendation_ko')
   * @param fallback - DB/캐시에서 찾지 못했을 때 사용할 기본값
   * @returns 프롬프트 템플릿 내용
   */
  async getPrompt(key: string, fallback?: string): Promise<string> {
    try {
      // 1. 메모리 캐시 확인
      if (this.memoryCache.has(key)) {
        console.log(`[PromptTemplate] Using memory cache for ${key}`);
        return this.memoryCache.get(key)!.template_content;
      }

      // 2. AsyncStorage 캐시 확인
      const cached = await this.getFromLocalCache(key);
      if (cached) {
        console.log(`[PromptTemplate] Using AsyncStorage cache for ${key}`);
        this.memoryCache.set(key, cached);
        return cached.template_content;
      }

      // 3. DB에서 로드
      console.log(`[PromptTemplate] Fetching from DB for ${key}`);
      const template = await this.fetchFromDB(key);

      if (template) {
        // 캐시에 저장
        this.memoryCache.set(key, template);
        await this.saveToLocalCache(key, template);
        return template.template_content;
      }

      // 모든 방법이 실패하면 fallback 사용
      if (fallback) {
        console.warn(`[PromptTemplate] Using fallback for ${key}`);
        return fallback;
      }

      throw new Error(`Prompt template not found: ${key}`);
    } catch (error) {
      console.error('[PromptTemplate] Error getting prompt:', error);

      // 에러 발생 시 fallback이 있으면 사용
      if (fallback) {
        console.warn(`[PromptTemplate] Error occurred, using fallback for ${key}`);
        return fallback;
      }

      throw error;
    }
  }

  /**
   * 프롬프트 템플릿에 변수 주입
   *
   * @param template - 프롬프트 템플릿 ({{variable}} 형식)
   * @param variables - 변수 객체
   * @returns 변수가 주입된 프롬프트
   *
   * @example
   * replaceVariables("Hello {{name}}", { name: "World" })
   * // => "Hello World"
   */
  replaceVariables(template: string, variables: Record<string, any>): string {
    let result = template;

    for (const [key, value] of Object.entries(variables)) {
      // {{key}} 형식을 실제 값으로 치환
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      const replacement = value !== undefined && value !== null ? String(value) : '';
      result = result.replace(regex, replacement);
    }

    return result;
  }

  /**
   * 프롬프트 템플릿 가져오기 + 변수 주입
   *
   * @param key - 프롬프트 템플릿 키
   * @param variables - 변수 객체
   * @param fallback - 기본값
   * @returns 변수가 주입된 프롬프트
   */
  async getPromptWithVariables(
    key: string,
    variables: Record<string, any>,
    fallback?: string
  ): Promise<string> {
    const template = await this.getPrompt(key, fallback);
    return this.replaceVariables(template, variables);
  }

  /**
   * AsyncStorage에서 프롬프트 가져오기
   */
  private async getFromLocalCache(key: string): Promise<PromptTemplate | null> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (!stored) return null;

      const templates: Record<string, PromptTemplate> = JSON.parse(stored);
      return templates[key] || null;
    } catch (error) {
      console.error('[PromptTemplate] Error reading from AsyncStorage:', error);
      return null;
    }
  }

  /**
   * AsyncStorage에 프롬프트 저장
   */
  private async saveToLocalCache(key: string, template: PromptTemplate): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      const templates: Record<string, PromptTemplate> = stored ? JSON.parse(stored) : {};

      templates[key] = template;

      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(templates));
    } catch (error) {
      console.error('[PromptTemplate] Error saving to AsyncStorage:', error);
    }
  }

  /**
   * Supabase DB에서 프롬프트 가져오기
   */
  private async fetchFromDB(key: string): Promise<PromptTemplate | null> {
    try {
      const { data, error } = await supabaseClient
        .from('prompt_templates')
        .select('*')
        .eq('template_key', key)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('[PromptTemplate] Supabase error:', error);
        return null;
      }

      return data as PromptTemplate;
    } catch (error) {
      console.error('[PromptTemplate] Error fetching from DB:', error);
      return null;
    }
  }

  /**
   * 모든 활성 프롬프트 템플릿 동기화
   * (로그인 시 or 수동 새로고침 시 호출)
   *
   * @returns 동기화 성공 여부
   */
  async syncPrompts(): Promise<boolean> {
    try {
      console.log('[PromptTemplate] Starting sync...');

      const { data, error } = await supabaseClient
        .from('prompt_templates')
        .select('*')
        .eq('is_active', true);

      if (error) {
        console.error('[PromptTemplate] Sync error:', error);
        return false;
      }

      if (!data || data.length === 0) {
        console.warn('[PromptTemplate] No templates found in DB');
        return false;
      }

      // AsyncStorage에 저장
      const templatesMap: Record<string, PromptTemplate> = {};
      data.forEach((template: PromptTemplate) => {
        templatesMap[template.template_key] = template;
        // 메모리 캐시에도 저장
        this.memoryCache.set(template.template_key, template);
      });

      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(templatesMap));

      // 마지막 동기화 시간 저장
      await AsyncStorage.setItem(this.LAST_SYNC_KEY, new Date().toISOString());

      console.log(`[PromptTemplate] Sync completed: ${data.length} templates`);
      return true;
    } catch (error) {
      console.error('[PromptTemplate] Sync failed:', error);
      return false;
    }
  }

  /**
   * 동기화가 필요한지 확인
   * (마지막 동기화로부터 24시간이 지났는지)
   */
  async shouldSync(): Promise<boolean> {
    try {
      const lastSync = await AsyncStorage.getItem(this.LAST_SYNC_KEY);
      if (!lastSync) return true;

      const lastSyncTime = new Date(lastSync).getTime();
      const now = Date.now();

      return (now - lastSyncTime) > this.SYNC_INTERVAL;
    } catch (error) {
      console.error('[PromptTemplate] Error checking sync time:', error);
      return true; // 에러 시 동기화 시도
    }
  }

  /**
   * 백그라운드에서 자동 동기화 시도
   * (네트워크 실패 시 조용히 실패)
   */
  async autoSync(): Promise<void> {
    try {
      const shouldSync = await this.shouldSync();
      if (shouldSync) {
        console.log('[PromptTemplate] Auto-sync triggered');
        await this.syncPrompts();
      }
    } catch (error) {
      // 백그라운드 동기화는 실패해도 앱에 영향 없음
      console.log('[PromptTemplate] Auto-sync failed (non-critical):', error);
    }
  }

  /**
   * 메모리 캐시 초기화
   */
  clearMemoryCache(): void {
    this.memoryCache.clear();
    console.log('[PromptTemplate] Memory cache cleared');
  }

  /**
   * 모든 캐시 초기화 (AsyncStorage 포함)
   */
  async clearAllCache(): Promise<void> {
    this.clearMemoryCache();
    await AsyncStorage.removeItem(this.STORAGE_KEY);
    await AsyncStorage.removeItem(this.LAST_SYNC_KEY);
    console.log('[PromptTemplate] All cache cleared');
  }

  /**
   * 캐시된 템플릿 목록 조회 (디버깅용)
   */
  async getCachedTemplates(): Promise<Record<string, PromptTemplate>> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('[PromptTemplate] Error getting cached templates:', error);
      return {};
    }
  }

  /**
   * 마지막 동기화 시간 조회
   */
  async getLastSyncTime(): Promise<Date | null> {
    try {
      const lastSync = await AsyncStorage.getItem(this.LAST_SYNC_KEY);
      return lastSync ? new Date(lastSync) : null;
    } catch (error) {
      console.error('[PromptTemplate] Error getting last sync time:', error);
      return null;
    }
  }
}

// 싱글톤 인스턴스 내보내기
export const promptTemplateService = PromptTemplateService.getInstance();
