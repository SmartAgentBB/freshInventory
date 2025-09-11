import { GoogleGenerativeAI } from '@google/generative-ai';

// For testing, use a fallback key if environment variable is not set
const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_GENERATIVE_AI_KEY || 
                process.env.GOOGLE_GENERATIVE_AI_KEY ||
                'AIzaSyBX3jvhUe8YourDemoKeyForTesting';

export interface FoodItem {
  name: string;
  quantity: number;
  unit: string;
  category: string;
  boundingBox?: number[]; // [ymin, xmin, ymax, xmax] normalized to 0-1000
  thumbnail?: string;
}

export interface AnalysisResult {
  success: boolean;
  items: FoodItem[];
  error?: string;
}

export interface Recipe {
  name: string;
  ingredients: string[];
  difficulty: string;
  cookingTime: number;
  instructions: string[];
}

export interface RecipeResult {
  success: boolean;
  recipes: Recipe[];
  error?: string;
}

export interface ExpiredItem {
  name: string;
  reason: string;
  confidence: number;
}

export interface ExpiredItemsResult {
  success: boolean;
  expiredItems: ExpiredItem[];
  error?: string;
}

export class AIService {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private cache: Map<string, any> = new Map();

  constructor() {
    // In test environment, allow demo key
    const isTestEnvironment = process.env.NODE_ENV === 'test';
    
    if (!isTestEnvironment && (!API_KEY || API_KEY === 'AIzaSyBX3jvhUe8YourDemoKeyForTesting')) {
      throw new Error('Google AI API key is not configured');
    }

    this.genAI = new GoogleGenerativeAI(API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  /**
   * Convert image URI to base64 for AI processing
   */
  private async imageToBase64(imageUri: string): Promise<string> {
    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result as string;
          // Remove the data URL prefix to get just the base64 string
          const base64 = base64data.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Failed to convert image to base64:', error);
      throw error;
    }
  }

  /**
   * Analyze an image to extract food items
   */
  async analyzeImage(imageUri: string): Promise<AnalysisResult> {
    try {
      // Check cache first
      const cacheKey = `analyze_${imageUri}`;
      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey);
      }

      // Get image dimensions for logging
      const { Image } = require('react-native');
      const imageInfo = await new Promise<{ width: number; height: number }>((resolve, reject) => {
        Image.getSize(
          imageUri,
          (width, height) => resolve({ width, height }),
          reject
        );
      });
      console.log('=== AI Service: Analyzing image ===');
      console.log('Image URI:', imageUri);
      console.log('Image dimensions for AI:', imageInfo.width, 'x', imageInfo.height);

      // Convert image to base64
      const base64Image = await this.imageToBase64(imageUri);

      const prompt = `Detect all of the prominent food items in the image and provide detailed information in Korean. 
      The box_2d should be [ymin, xmin, ymax, xmax] normalized to 0-1000.
      
      각 식재료에 대해 다음 정보를 포함해주세요:
      - name: 식재료 이름 (한글)
      - quantity: 수량 (숫자)
      - unit: 단위 (개, kg, L, 등)
      - category: 카테고리 (과일, 채소, 육류, 유제품, 곡물, 조미료, 기타 중 하나)
      - box_2d: [ymin, xmin, ymax, xmax] 형식으로 0-1000 범위로 정규화된 바운딩 박스
      
      응답 형식:
      {
        "items": [
          { 
            "name": "사과", 
            "quantity": 3, 
            "unit": "개", 
            "category": "과일",
            "box_2d": [100, 200, 500, 600]
          }
        ]
      }`;

      const imagePart = {
        inlineData: {
          mimeType: 'image/jpeg',
          data: base64Image,
        },
      };

      const result = await this.model.generateContent([prompt, imagePart]);
      const response = await result.response;
      let text = response.text();

      console.log('=== AI Service Raw Response ===');
      console.log(text);
      console.log('================================');

      // Clean up the response - remove markdown code blocks if present
      text = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      
      // Also handle cases where the AI might add extra text before/after JSON
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        text = jsonMatch[0];
      }

      try {
        const parsed = JSON.parse(text);
        console.log('=== AI Service Parsed JSON ===');
        console.log(JSON.stringify(parsed, null, 2));
        console.log('================================');
        
        const validItems = this.validateFoodItems(parsed.items || []);
        
        console.log('=== AI Service Validated Items ===');
        console.log(JSON.stringify(validItems, null, 2));
        console.log('===================================');
        
        const analysisResult = {
          success: true,
          items: validItems,
        };

        // Cache the result
        this.cache.set(cacheKey, analysisResult);
        
        return analysisResult;
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError);
        console.error('Raw response:', text);
        return {
          success: false,
          items: [],
          error: 'Failed to parse AI response',
        };
      }
    } catch (error) {
      console.error('Image analysis error:', error);
      return {
        success: false,
        items: [],
        error: error instanceof Error ? error.message : 'Analysis failed',
      };
    }
  }

  /**
   * Validate and clean food items from AI response
   */
  private validateFoodItems(items: any[]): FoodItem[] {
    if (!Array.isArray(items)) {
      return [];
    }

    return items
      .filter(item => {
        // Validate required fields
        return item.name && 
               typeof item.name === 'string' && 
               item.name.trim() !== '' &&
               item.quantity !== undefined &&
               item.quantity !== null;
      })
      .map(item => ({
        name: item.name.trim(),
        quantity: typeof item.quantity === 'number' ? item.quantity : Number(item.quantity),
        unit: item.unit || '개',
        category: item.category || '기타',
        boundingBox: item.box_2d || undefined, // box_2d를 boundingBox로 매핑
      }))
      .filter(item => !isNaN(item.quantity) && item.quantity > 0);
  }

  /**
   * Generate recipe suggestions based on available ingredients
   */
  async generateRecipeSuggestions(ingredients: string[]): Promise<RecipeResult> {
    try {
      if (!ingredients || ingredients.length === 0) {
        return {
          success: false,
          recipes: [],
          error: 'No ingredients provided',
        };
      }

      const prompt = `다음 재료들로 만들 수 있는 한국 요리 레시피를 3개 추천해주세요: ${ingredients.join(', ')}
      
      각 레시피에 대해 JSON 형식으로 다음 정보를 포함해주세요:
      - name: 요리 이름
      - ingredients: 필요한 재료 목록 (배열)
      - difficulty: 난이도 (쉬움, 보통, 어려움)
      - cookingTime: 조리 시간 (분)
      - instructions: 조리 방법 (단계별 배열)
      
      응답 형식:
      {
        "recipes": [
          {
            "name": "김치찌개",
            "ingredients": ["김치 200g", "돼지고기 150g"],
            "difficulty": "쉬움",
            "cookingTime": 20,
            "instructions": ["1. 재료를 준비한다", "2. 끓인다"]
          }
        ]
      }`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      let text = response.text();
      
      // Clean up the response - remove markdown code blocks if present
      text = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      
      // Also handle cases where the AI might add extra text before/after JSON
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        text = jsonMatch[0];
      }

      try {
        const parsed = JSON.parse(text);
        return {
          success: true,
          recipes: parsed.recipes || [],
        };
      } catch (parseError) {
        console.error('Failed to parse recipe response:', parseError);
        console.error('Raw response:', text);
        return {
          success: false,
          recipes: [],
          error: 'Failed to parse recipe response',
        };
      }
    } catch (error) {
      console.error('Recipe generation error:', error);
      return {
        success: false,
        recipes: [],
        error: error instanceof Error ? error.message : 'Failed to generate recipes',
      };
    }
  }

  /**
   * Detect potentially expired items from image
   */
  async detectExpiredItems(imageUri: string): Promise<ExpiredItemsResult> {
    try {
      const base64Image = await this.imageToBase64(imageUri);

      const prompt = `이미지에서 상한 것 같거나 유통기한이 지난 것으로 보이는 식재료를 찾아주세요.
      
      JSON 형식으로 반환:
      {
        "expiredItems": [
          {
            "name": "식재료 이름",
            "reason": "상한 것으로 판단한 이유",
            "confidence": 0.0-1.0 (확신도)
          }
        ]
      }`;

      const imagePart = {
        inlineData: {
          mimeType: 'image/jpeg',
          data: base64Image,
        },
      };

      const result = await this.model.generateContent([prompt, imagePart]);
      const response = await result.response;
      let text = response.text();
      
      console.log('Raw AI response:', text);
      
      // Clean up the response - remove markdown code blocks if present
      text = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      
      // Also handle cases where the AI might add extra text before/after JSON
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        text = jsonMatch[0];
      }

      try {
        const parsed = JSON.parse(text);
        return {
          success: true,
          expiredItems: parsed.expiredItems || [],
        };
      } catch (parseError) {
        console.error('Failed to parse expired items response:', parseError);
        console.error('Raw response:', text);
        return {
          success: false,
          expiredItems: [],
          error: 'Failed to parse expired items response',
        };
      }
    } catch (error) {
      console.error('Expired item detection error:', error);
      return {
        success: false,
        expiredItems: [],
        error: error instanceof Error ? error.message : 'Detection failed',
      };
    }
  }

  /**
   * Categorize a single food item
   */
  async categorizeFood(foodName: string): Promise<string> {
    try {
      const prompt = `"${foodName}"는 다음 카테고리 중 어디에 속하나요? 
      과일, 채소, 육류, 유제품, 곡물, 조미료, 기타
      카테고리 이름만 반환해주세요.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const category = response.text().trim();

      // Validate category
      const validCategories = ['과일', '채소', '육류', '유제품', '곡물', '조미료', '기타'];
      return validCategories.includes(category) ? category : '기타';
    } catch (error) {
      console.error('Categorization error:', error);
      return '기타';
    }
  }

  /**
   * Clear the analysis cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}