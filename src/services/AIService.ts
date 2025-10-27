import { GoogleGenerativeAI } from '@google/generative-ai';
import { getCurrentLanguage } from './i18n';
import { promptTemplateService } from './PromptTemplateService';

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

export interface RecipeIngredient {
  name: string;
  quantity: number;
  unit: string;
  required?: boolean;
}

export interface Recipe {
  name: string;
  title?: string; // Optional for backward compatibility
  ingredients: RecipeIngredient[];
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
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;
  private cache: Map<string, any> = new Map();

  constructor() {
    try {
      // In test environment, allow demo key
      const isTestEnvironment = process.env.NODE_ENV === 'test';

      if (!isTestEnvironment && (!API_KEY || API_KEY === 'AIzaSyBX3jvhUe8YourDemoKeyForTesting')) {
        console.warn('Google AI API key is not configured properly');
        // Don't throw error, just disable the service
        return;
      }

      this.genAI = new GoogleGenerativeAI(API_KEY);
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
    } catch (error) {
      console.error('Failed to initialize AI Service:', error);
      // Don't throw error to prevent app crashes
      this.genAI = null;
      this.model = null;
    }
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
      // Check if AI service is available
      if (!this.model || !this.genAI) {
        console.error('AI Service not initialized for image analysis');
        return {
          success: false,
          items: [],
          error: 'AI 서비스를 사용할 수 없습니다',
        };
      }

      // Get current language
      const language = getCurrentLanguage();
      const isEnglish = language === 'en';

      // Check cache first
      const cacheKey = `analyze_${imageUri}_${language}`;
      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey);
      }

      // Get image dimensions for logging
      const { Image } = require('react-native');
      const imageInfo = await new Promise<{ width: number; height: number }>((resolve, reject) => {
        Image.getSize(
          imageUri,
          (width: number, height: number) => resolve({ width, height }),
          reject
        );
      });
      // Analyzing image

      // Convert image to base64
      const base64Image = await this.imageToBase64(imageUri);

      // Get prompt from template
      const prompt = isEnglish
        ? await promptTemplateService.getPrompt(
            'ingredient_analysis_en',
            `Detect all of the prominent food items in the image and provide detailed information in English.
      The box_2d should be [ymin, xmin, ymax, xmax] normalized to 0-1000.

      For each ingredient, include the following information:
      - name: Ingredient name (in English, ALWAYS use SINGULAR form - e.g., "apple" not "apples", "carrot" not "carrots")
      - quantity: Quantity (number)
      - unit: Unit (must be either "pcs" for individual items or "packs" for packaged items)
      - category: Category (fruit, vegetable, meat, dairy, grain, seasoning, other)
      - box_2d: [ymin, xmin, ymax, xmax] normalized to 0-1000 range

      Important:
      - The ingredient name must ALWAYS be in SINGULAR form regardless of quantity
      - unit must be either "pcs" or "packs":
        * Individual fruits, vegetables, etc. use "pcs"
        * Packaged or bundled items use "packs"

      Response format:
      {
        "items": [
          {
            "name": "apple",
            "quantity": 3,
            "unit": "pcs",
            "category": "fruit",
            "box_2d": [100, 200, 500, 600]
          }
        ]
      }`
          )
        : await promptTemplateService.getPrompt(
            'ingredient_analysis_ko',
            `Detect all of the prominent food items in the image and provide detailed information in Korean.
      The box_2d should be [ymin, xmin, ymax, xmax] normalized to 0-1000.

      각 식재료에 대해 다음 정보를 포함해주세요:
      - name: 식재료 이름 (한글)
      - quantity: 수량 (숫자)
      - unit: 단위 (반드시 "개" 또는 "팩" 중 하나만 사용. 개별 아이템은 "개", 포장된 상품은 "팩")
      - category: 카테고리 (과일, 채소, 육류, 유제품, 곡물, 조미료, 기타 중 하나)
      - box_2d: [ymin, xmin, ymax, xmax] 형식으로 0-1000 범위로 정규화된 바운딩 박스

      중요: unit은 반드시 "개" 또는 "팩" 중 하나여야 합니다.
      - 낱개로 된 과일, 채소 등은 "개"
      - 포장된 상품, 묶음 상품은 "팩"

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
      }`
          );

      const imagePart = {
        inlineData: {
          mimeType: 'image/jpeg',
          data: base64Image,
        },
      };

      const result = await this.model.generateContent([prompt, imagePart]);
      const response = await result.response;
      let text = response.text();

      // AI Service raw response received

      // Clean up the response - remove markdown code blocks if present
      text = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      
      // Also handle cases where the AI might add extra text before/after JSON
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        text = jsonMatch[0];
      }

      try {
        const parsed = JSON.parse(text);
        // AI Service parsed JSON successfully

        const validItems = this.validateFoodItems(parsed.items || []);

        // AI Service validated items

        // Check if no items were found
        if (validItems.length === 0) {
          return {
            success: false,
            items: [],
            error: isEnglish
              ? 'No food items detected in the image. Please upload a photo containing food items.'
              : '식재료를 감지하지 못했습니다. 식재료를 포함하는 사진을 업로드해주세요.',
          };
        }

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

        // Check if the response indicates no food items found
        const noFoodPatterns = [
          /not find any/i,
          /no.*food/i,
          /cannot.*detect/i,
          /unable.*to.*find/i,
          /식재료.*없/,
          /감지.*못/,
          /찾을.*수.*없/,
        ];

        const isNoFoodResponse = noFoodPatterns.some(pattern => pattern.test(text));

        if (isNoFoodResponse) {
          return {
            success: false,
            items: [],
            error: isEnglish
              ? 'No food items detected in the image. Please upload a photo containing food items.'
              : '식재료를 감지하지 못했습니다. 식재료를 포함하는 사진을 업로드해주세요.',
          };
        }

        return {
          success: false,
          items: [],
          error: isEnglish
            ? 'Failed to analyze the image. Please try again.'
            : '이미지 분석에 실패했습니다. 다시 시도해주세요.',
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
  async generateRecipeSuggestions(ingredients: string[], cookingStyle?: string, language: string = 'ko'): Promise<RecipeResult> {
    try {
      // Check if AI service is available
      if (!this.model || !this.genAI) {
        console.error('AI Service not initialized');
        return {
          success: false,
          recipes: [],
          error: 'AI 서비스를 사용할 수 없습니다',
        };
      }

      if (!ingredients || ingredients.length === 0) {
        return {
          success: false,
          recipes: [],
          error: 'No ingredients provided',
        };
      }

      // Check cache first (include cooking style and language in cache key)
      const cacheKey = `recipes_${ingredients.sort().join('_')}_${cookingStyle || 'default'}_${language}`;
      if (this.cache.has(cacheKey)) {
        // Using cached recipe result
        return this.cache.get(cacheKey);
      }

      // Generate prompt from template
      let prompt: string;

      // 요리 스타일 유무에 따라 다른 프롬프트 사용
      const hasCookingStyle = cookingStyle && cookingStyle.trim().length > 0;

      if (language === 'en') {
        if (hasCookingStyle) {
          // 영어 - 요리 스타일 있을 때
          const fallbackPrompt = `You are an experienced international chef. Please respond only in valid JSON format.

Available ingredients:
{{ingredients}}

🎯 **User preferred cooking style: {{cookingStyle}}**

**Important: Prioritize the cooking style above when recommending recipes!**

Suggest 3-5 recipes using these ingredients.

Important guidelines:
1. **Make the cooking style your TOP PRIORITY when selecting recipes**
2. Recommend popular, well-known international dishes (Western, Asian fusion, Mediterranean, etc.)
3. Don't force all ingredients into one dish. Use different main ingredients for variety
4. Prioritize ingredients marked with (임박/urgent) or expiring soon
5. Consider using ingredients marked with (주의/caution)
6. Each recipe must include at least 1 of the user's available ingredients
7. Provide clear, easy-to-follow cooking instructions in English

⚠️ IMPORTANT: Response must be valid JSON only. No other text or explanations.

JSON format (follow this structure exactly):
{
  "recipes": [
    {
      "name": "Vegetable Stir Fry",
      "ingredients": [
        {"name": "onion", "quantity": 1, "unit": "pc", "required": true},
        {"name": "carrot", "quantity": 2, "unit": "pcs", "required": true},
        {"name": "soy sauce", "quantity": 2, "unit": "tbsp", "required": true}
      ],
      "difficulty": "easy",
      "cookingTime": 15,
      "instructions": ["Prepare all vegetables", "Heat oil in wok", "Stir-fry for 5-7 minutes"]
    }
  ]
}

Notes:
- Use double quotes for all strings
- ingredients must be an array of objects with: name (string), quantity (number), unit (string), required (boolean)
- quantity must be a number (e.g., use 0.5 for 1/2)
- difficulty must be "easy", "medium", or "hard" (lowercase)
- cookingTime should be a number (in minutes)
- No trailing commas
- Return only JSON, no other text`;

          prompt = await promptTemplateService.getPromptWithVariables(
            'recipe_recommendation_en',
            {
              ingredients: ingredients.join(', '),
              cookingStyle: cookingStyle,
            },
            fallbackPrompt
          );
        } else {
          // 영어 - 요리 스타일 없을 때
          const fallbackPrompt = `You are an experienced international chef. Please respond only in valid JSON format.

Available ingredients:
{{ingredients}}

Suggest 3-5 diverse recipes using these ingredients.

Important guidelines:
1. Recommend popular, well-known international dishes (Western, Asian fusion, Mediterranean, etc.)
2. Include various cooking methods (stir-fry, bake, grill, simmer, etc.)
3. Mix difficulty levels (from easy to intermediate)
4. Don't force all ingredients into one dish. Use different main ingredients for variety
5. Prioritize ingredients marked with (임박/urgent) or expiring soon
6. Consider using ingredients marked with (주의/caution)
7. Each recipe must include at least 1 of the user's available ingredients
8. Provide clear, easy-to-follow cooking instructions in English

⚠️ IMPORTANT: Response must be valid JSON only. No other text or explanations.

JSON format (follow this structure exactly):
{
  "recipes": [
    {
      "name": "Vegetable Stir Fry",
      "ingredients": [
        {"name": "onion", "quantity": 1, "unit": "pc", "required": true},
        {"name": "carrot", "quantity": 2, "unit": "pcs", "required": true},
        {"name": "soy sauce", "quantity": 2, "unit": "tbsp", "required": true}
      ],
      "difficulty": "easy",
      "cookingTime": 15,
      "instructions": ["Prepare all vegetables", "Heat oil in wok", "Stir-fry for 5-7 minutes"]
    }
  ]
}

Notes:
- Use double quotes for all strings
- ingredients must be an array of objects with: name (string), quantity (number), unit (string), required (boolean)
- quantity must be a number (e.g., use 0.5 for 1/2)
- difficulty must be "easy", "medium", or "hard" (lowercase)
- cookingTime should be a number (in minutes)
- No trailing commas
- Return only JSON, no other text`;

          prompt = await promptTemplateService.getPromptWithVariables(
            'recipe_recommendation_en_no_style',
            {
              ingredients: ingredients.join(', '),
            },
            fallbackPrompt
          );
        }
      } else {
        // 한국어
        if (hasCookingStyle) {
          // 한국어 - 요리 스타일 있을 때
          const fallbackPrompt = `당신은 30년차 한식 요리 연구가입니다. 반드시 유효한 JSON 형식으로만 응답해주세요.

보유한 식재료:
{{ingredients}}

🎯 **사용자가 원하는 요리 스타일: {{cookingStyle}}**

**중요: 위에 명시된 요리 스타일을 최우선으로 고려하여 레시피를 추천해주세요!**

위 식재료를 활용하여 만들 수 있는 요리를 3-5개 추천해주세요.

추가 원칙:
1. **요리 스타일을 레시피 선정의 최우선 기준으로 삼으세요**
2. 반드시 실제로 존재하고 대중적으로 잘 알려진 한국 요리만 추천해주세요
3. 모든 재료를 한 요리에 억지로 넣지 말고, 각 요리마다 다른 주재료를 활용하여 다양한 선택지를 제공해주세요
4. (임박) 표시가 있는 재료를 우선적으로 활용하는 요리를 먼저 추천해주세요
5. (주의) 표시가 있는 재료도 활용하도록 고려해주세요
6. 각 요리에 필수 재료 중 사용자가 가진 재료가 1개 이상 포함되어야 합니다
7. 조리 방법은 구체적이고 따라하기 쉽게 설명해주세요

⚠️ 중요: 응답은 반드시 유효한 JSON 형식이어야 합니다. 다른 텍스트나 설명 없이 오직 JSON만 반환해주세요.

JSON 형식 (정확히 이 구조를 따라주세요):
{
  "recipes": [
    {
      "name": "김치찌개",
      "ingredients": [
        {"name": "김치", "quantity": 200, "unit": "g", "required": true},
        {"name": "돼지고기", "quantity": 100, "unit": "g", "required": true},
        {"name": "두부", "quantity": 0.5, "unit": "모", "required": true}
      ],
      "difficulty": "easy",
      "cookingTime": 20,
      "instructions": ["재료를 준비한다", "양념을 만든다", "끓인다"]
    }
  ]
}

주의사항:
- 문자열은 반드시 큰따옴표("")로 감싸주세요
- ingredients는 객체 배열이며, 각 객체는 name(재료명), quantity(수량), unit(단위), required(필수여부) 필드를 가집니다
- quantity는 반드시 숫자로 입력하세요 (예: 1/2모는 0.5로 입력)
- difficulty는 반드시 "easy", "medium", "hard" 중 하나만 사용하세요 (영어 소문자)
- cookingTime은 숫자(분 단위)로 입력해주세요
- 마지막 항목 뒤에 쉼표를 붙이지 마세요
- JSON 외의 다른 텍스트는 절대 포함하지 마세요`;

          prompt = await promptTemplateService.getPromptWithVariables(
            'recipe_recommendation_ko',
            {
              ingredients: ingredients.join(', '),
              cookingStyle: cookingStyle,
            },
            fallbackPrompt
          );
        } else {
          // 한국어 - 요리 스타일 없을 때
          const fallbackPrompt = `당신은 30년차 한식 요리 연구가입니다. 반드시 유효한 JSON 형식으로만 응답해주세요.

보유한 식재료:
{{ingredients}}

위 식재료를 활용하여 만들 수 있는 다양한 요리를 3-5개 추천해주세요.

추천 원칙:
1. 반드시 실제로 존재하고 대중적으로 잘 알려진 한국 요리만 추천해주세요
2. 다양한 조리법을 포함하세요 (찌개, 볶음, 조림, 무침 등)
3. 난이도가 다양한 요리를 섞어서 추천하세요 (쉬운 것부터 중급까지)
4. 모든 재료를 한 요리에 억지로 넣지 말고, 각 요리마다 다른 주재료를 활용하여 다양한 선택지를 제공해주세요
5. (임박) 표시가 있는 재료를 우선적으로 활용하는 요리를 먼저 추천해주세요
6. (주의) 표시가 있는 재료도 활용하도록 고려해주세요
7. 각 요리에 필수 재료 중 사용자가 가진 재료가 1개 이상 포함되어야 합니다
8. 조리 방법은 구체적이고 따라하기 쉽게 설명해주세요

⚠️ 중요: 응답은 반드시 유효한 JSON 형식이어야 합니다. 다른 텍스트나 설명 없이 오직 JSON만 반환해주세요.

JSON 형식 (정확히 이 구조를 따라주세요):
{
  "recipes": [
    {
      "name": "김치찌개",
      "ingredients": [
        {"name": "김치", "quantity": 200, "unit": "g", "required": true},
        {"name": "돼지고기", "quantity": 100, "unit": "g", "required": true},
        {"name": "두부", "quantity": 0.5, "unit": "모", "required": true}
      ],
      "difficulty": "easy",
      "cookingTime": 20,
      "instructions": ["재료를 준비한다", "양념을 만든다", "끓인다"]
    }
  ]
}

주의사항:
- 문자열은 반드시 큰따옴표("")로 감싸주세요
- ingredients는 객체 배열이며, 각 객체는 name(재료명), quantity(수량), unit(단위), required(필수여부) 필드를 가집니다
- quantity는 반드시 숫자로 입력하세요 (예: 1/2모는 0.5로 입력)
- difficulty는 반드시 "easy", "medium", "hard" 중 하나만 사용하세요 (영어 소문자)
- cookingTime은 숫자(분 단위)로 입력해주세요
- 마지막 항목 뒤에 쉼표를 붙이지 마세요
- JSON 외의 다른 텍스트는 절대 포함하지 마세요`;

          prompt = await promptTemplateService.getPromptWithVariables(
            'recipe_recommendation_ko_no_style',
            {
              ingredients: ingredients.join(', '),
            },
            fallbackPrompt
          );
        }
      }

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      let text = response.text();

      // Recipe generation raw response received

      // Clean up the response - remove markdown code blocks if present
      text = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

      // Additional cleanup for common AI response issues
      text = text.replace(/^[^\{]*/, ''); // Remove any text before first {
      text = text.replace(/[^\}]*$/, ''); // Remove any text after last }
      text = text.replace(/\n/g, ' '); // Replace newlines with spaces
      text = text.replace(/\s+/g, ' '); // Normalize multiple spaces
      text = text.trim();

      // After comprehensive cleanup

      // Also handle cases where the AI might add extra text before/after JSON
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        // JSON match found
        text = jsonMatch[0];
      } else {
        // No JSON match found
        console.log('No valid JSON structure found in response');
        console.log('Trying to fix common JSON issues...');

        // Try to salvage partial JSON
        if (text.includes('"recipes"')) {
          console.log('Found recipes key, attempting to construct valid JSON');
          if (!text.startsWith('{')) text = '{' + text;
          if (!text.endsWith('}')) text = text + '}';
        }
        console.log('============================');
      }

      try {
        console.log('=== Attempting JSON Parse ===');
        console.log('Text to parse:', text);
        console.log('Text length:', text.length);
        console.log('==============================');

        const parsed = JSON.parse(text);

        console.log('=== JSON Parse Successful ===');
        console.log('Parsed object keys:', Object.keys(parsed));
        console.log('Recipes array length:', parsed.recipes?.length || 0);
        console.log('Full parsed object:', JSON.stringify(parsed, null, 2));
        console.log('==============================');

        const result = {
          success: true,
          recipes: parsed.recipes || [],
        };

        // Cache the successful result
        this.cache.set(cacheKey, result);

        return result;
      } catch (parseError) {
        console.error('=== JSON Parse Failed ===');
        console.error('Parse error details:', parseError);
        console.error('Error message:', parseError instanceof Error ? parseError.message : 'Unknown error');
        console.error('Text that failed to parse:', JSON.stringify(text));
        console.error('Text character codes:', Array.from(text).map(c => c.charCodeAt(0)).slice(0, 50));

        // Try alternative parsing strategies
        console.log('=== Attempting Alternative Parsing ===');

        // Strategy 1: Try to extract multiple JSON objects
        const jsonObjects = text.match(/\{[^{}]*\}/g);
        if (jsonObjects) {
          console.log('Found potential JSON objects:', jsonObjects.length);
          for (const obj of jsonObjects) {
            try {
              const parsed = JSON.parse(obj);
              if (parsed.recipes) {
                console.log('Successfully parsed JSON object with recipes');
                const result = { success: true, recipes: parsed.recipes };
                this.cache.set(cacheKey, result);
                return result;
              }
            } catch (e) {
              console.log('Failed to parse object:', obj);
            }
          }
        }

        // Strategy 2: Try to fix common JSON syntax issues
        let fixedText = text;
        // Fix trailing commas
        fixedText = fixedText.replace(/,(\s*[}\]])/g, '$1');
        // Fix missing commas between objects
        fixedText = fixedText.replace(/}(\s*){/g, '}, {');
        // Fix quotes
        fixedText = fixedText.replace(/'/g, '"');

        try {
          console.log('Trying with syntax fixes:', fixedText);
          const parsed = JSON.parse(fixedText);
          console.log('Successfully parsed with syntax fixes');
          const result = { success: true, recipes: parsed.recipes || [] };
          this.cache.set(cacheKey, result);
          return result;
        } catch (fixError) {
          console.log('Syntax fix attempt failed:', fixError);
        }

        console.error('=== All Parsing Strategies Failed ===');
        console.error('=======================================');

        return {
          success: false,
          recipes: [],
          error: `Failed to parse recipe response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`,
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

      const prompt = await promptTemplateService.getPrompt(
        'expired_detection_ko',
        `이미지에서 상한 것 같거나 유통기한이 지난 것으로 보이는 식재료를 찾아주세요.

      JSON 형식으로 반환:
      {
        "expiredItems": [
          {
            "name": "식재료 이름",
            "reason": "상한 것으로 판단한 이유",
            "confidence": 0.0-1.0 (확신도)
          }
        ]
      }`
      );

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
      const prompt = await promptTemplateService.getPromptWithVariables(
        'categorization_ko',
        { foodName },
        `"${foodName}"는 다음 카테고리 중 어디에 속하나요?
      과일, 채소, 육류, 유제품, 곡물, 조미료, 기타
      카테고리 이름만 반환해주세요.`
      );

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