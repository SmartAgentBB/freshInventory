/**
 * Storage Info Service for managing food storage information
 */
import { SupabaseClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface StorageInfo {
  id: string;
  name: string;
  category: string;
  storage_days: number;
  storage_desc?: string;
  storage_method?: string;
}

export class StorageInfoService {
  private genAI: GoogleGenerativeAI | null = null;
  private pendingRequests: Map<string, Promise<StorageInfo | null>> = new Map();
  private cache: Map<string, { data: StorageInfo; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache

  constructor(
    private supabase: SupabaseClient,
    private geminiApiKey?: string
  ) {
    if (geminiApiKey) {
      this.genAI = new GoogleGenerativeAI(geminiApiKey);
    }
  }

  /**
   * Get storage info for a specific food item
   */
  async getStorageInfo(itemName: string): Promise<StorageInfo | null> {
    // Check cache first
    const cached = this.cache.get(itemName);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      console.log(`Returning cached storage info for ${itemName}`);
      return cached.data;
    }

    // Check if there's already a pending request for this item
    const pending = this.pendingRequests.get(itemName);
    if (pending) {
      console.log(`Waiting for pending request for ${itemName}`);
      return await pending;
    }

    // Create new request
    const request = this.fetchStorageInfo(itemName);
    this.pendingRequests.set(itemName, request);

    try {
      const result = await request;
      // Cache the result
      if (result) {
        this.cache.set(itemName, { data: result, timestamp: Date.now() });
      }
      return result;
    } finally {
      // Clean up pending request
      this.pendingRequests.delete(itemName);
    }
  }

  /**
   * Internal method to fetch storage info
   */
  private async fetchStorageInfo(itemName: string): Promise<StorageInfo | null> {
    try {
      const { data, error } = await this.supabase
        .from('storage_info')
        .select('*')
        .eq('name', itemName)
        .single();

      if (error) {
        // If storage info not found (406), create it using AI
        if (error.code === 'PGRST116') { // Row not found error
          console.log(`Storage info not found for ${itemName}, creating with AI...`);
          return await this.createStorageInfoWithAI(itemName);
        }
        console.log(`Storage info error for ${itemName}:`, error);
        return this.createDefaultStorageInfo(itemName);
      }

      return data as StorageInfo;
    } catch (error) {
      console.error('Error fetching storage info:', error);
      // Try to create with AI if there's an error
      return await this.createStorageInfoWithAI(itemName);
    }
  }

  /**
   * Create storage info using AI for unknown items
   */
  private async createStorageInfoWithAI(itemName: string): Promise<StorageInfo | null> {
    if (!this.genAI) {
      console.log('Gemini API key not provided, using default storage info');
      return this.createDefaultStorageInfo(itemName);
    }

    try {
      // First, check if storage info was created while we were generating (race condition prevention)
      const { data: existingData, error: checkError } = await this.supabase
        .from('storage_info')
        .select('*')
        .eq('name', itemName)
        .single();

      if (!checkError && existingData) {
        console.log(`Storage info for ${itemName} already exists (created by another request)`);
        return existingData as StorageInfo;
      }

      const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = `다음 식재료에 대한 보관 정보를 제공해주세요: "${itemName}"
다음 형식으로 JSON 응답을 제공해주세요:
{
    "category": "카테고리 (야채, 과일, 육류, 유제품, 곡물, 조미료, 기타 중 선택)",
    "name": "${itemName}",
    "storage_days": 숫자 (일 단위),
    "storage_desc": "보관 기간 설명 (예: 3~5일)",
    "storage_method": "보관 방법 설명"
}

JSON만 반환하고 다른 텍스트는 포함하지 마세요.`;

      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      // Parse JSON response
      let jsonString = text.trim();
      if (jsonString.startsWith('```json') && jsonString.endsWith('```')) {
        jsonString = jsonString.slice(7, -3).trim();
      }

      const storageData = JSON.parse(jsonString);

      // Validate response
      if (!storageData.storage_days || typeof storageData.storage_days !== 'number') {
        console.log('Invalid AI response, using default');
        return this.createDefaultStorageInfo(itemName);
      }

      // Map Korean categories to English
      const categoryMap: { [key: string]: string } = {
        '야채': 'vegetables',
        '과일': 'fruits',
        '육류': 'meat',
        '유제품': 'dairy',
        '곡물': 'grains',
        '조미료': 'condiments',
        '기타': 'other'
      };

      if (storageData.category && categoryMap[storageData.category]) {
        storageData.category = categoryMap[storageData.category];
      }

      // Use upsert to handle duplicate key errors gracefully
      const { data: insertedData, error } = await this.supabase
        .from('storage_info')
        .upsert({
          name: itemName,
          category: storageData.category || 'other',
          storage_days: storageData.storage_days,
          storage_desc: storageData.storage_desc,
          storage_method: storageData.storage_method
        }, {
          onConflict: 'name',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (error) {
        // If it's a duplicate key error, try to fetch the existing data
        if (error.code === '23505') {
          console.log(`Storage info for ${itemName} already exists, fetching existing data`);
          const { data: existingData } = await this.supabase
            .from('storage_info')
            .select('*')
            .eq('name', itemName)
            .single();

          if (existingData) {
            return existingData as StorageInfo;
          }
        }
        console.error('Error inserting AI-generated storage info:', error);
        return this.createDefaultStorageInfo(itemName);
      }

      console.log(`Successfully created storage info for ${itemName} using AI`);
      return insertedData as StorageInfo;

    } catch (error) {
      console.error('Error generating storage info with AI:', error);
      return this.createDefaultStorageInfo(itemName);
    }
  }

  /**
   * Create default storage info when AI is not available
   */
  private createDefaultStorageInfo(itemName: string): StorageInfo | null {
    // Return default values without saving to database
    // The caller can decide whether to save this
    return {
      id: '',
      name: itemName,
      category: 'other',
      storage_days: 7, // Default 7 days
      storage_desc: '7일',
      storage_method: '냉장 보관하세요'
    };
  }

  /**
   * Get all storage info entries
   */
  async getAllStorageInfo(): Promise<StorageInfo[]> {
    try {
      const { data, error } = await this.supabase
        .from('storage_info')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) {
        throw error;
      }

      return data as StorageInfo[];
    } catch (error) {
      console.error('Error fetching all storage info:', error);
      return [];
    }
  }
}

export function createStorageInfoService(
  supabase: SupabaseClient, 
  geminiApiKey?: string
): StorageInfoService {
  return new StorageInfoService(supabase, geminiApiKey);
}