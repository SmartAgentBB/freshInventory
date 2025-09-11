import { AIService } from '../src/services/AIService';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Mock Google Generative AI
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: jest.fn(),
      generateContentStream: jest.fn(),
    }),
  })),
}));

// Mock image utilities
jest.mock('../src/utils/imageUtils', () => ({
  ...jest.requireActual('../src/utils/imageUtils'),
  getImageSizeInMB: jest.fn().mockReturnValue(1.5),
}));

describe('AIService', () => {
  let aiService: AIService;
  let mockGenerateContent: jest.Mock;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset and create new instance for each test
    mockGenerateContent = jest.fn();
    (GoogleGenerativeAI as jest.Mock).mockImplementation(() => ({
      getGenerativeModel: jest.fn().mockReturnValue({
        generateContent: mockGenerateContent,
      }),
    }));
    
    aiService = new AIService();
  });

  describe('Initialization', () => {
    it('should initialize Google Generative AI client', () => {
      expect(GoogleGenerativeAI).toHaveBeenCalledWith(
        expect.stringContaining('AIzaSy')
      );
    });

    it('should get gemini-pro-vision model', () => {
      const mockGetModel = jest.fn();
      (GoogleGenerativeAI as jest.Mock).mockImplementation(() => ({
        getGenerativeModel: mockGetModel.mockReturnValue({
          generateContent: jest.fn(),
        }),
      }));
      
      new AIService();
      
      expect(mockGetModel).toHaveBeenCalledWith({ model: 'gemini-1.5-flash' });
    });

    it('should handle missing API key in production', () => {
      const originalNodeEnv = process.env.NODE_ENV;
      const originalApiKey = process.env.EXPO_PUBLIC_GOOGLE_GENERATIVE_AI_KEY;
      
      process.env.NODE_ENV = 'production';
      delete process.env.EXPO_PUBLIC_GOOGLE_GENERATIVE_AI_KEY;
      delete process.env.GOOGLE_GENERATIVE_AI_KEY;
      
      // Mock API_KEY to be undefined
      jest.resetModules();
      
      // In production without key, should throw
      const AIServiceModule = require('../src/services/AIService');
      expect(() => new AIServiceModule.AIService()).toThrow('Google AI API key is not configured');
      
      // Restore environment
      process.env.NODE_ENV = originalNodeEnv;
      if (originalApiKey) {
        process.env.EXPO_PUBLIC_GOOGLE_GENERATIVE_AI_KEY = originalApiKey;
      }
    });
  });

  describe('analyzeImage', () => {
    it('should analyze image and extract food items', async () => {
      const mockImageUri = 'file:///path/to/image.jpg';
      const mockResponse = {
        response: {
          text: () => JSON.stringify({
            items: [
              { name: '사과', quantity: 3, unit: '개', category: '과일' },
              { name: '우유', quantity: 1, unit: 'L', category: '유제품' },
            ],
          }),
        },
      };

      mockGenerateContent.mockResolvedValue(mockResponse);

      const result = await aiService.analyzeImage(mockImageUri);

      expect(result.success).toBe(true);
      expect(result.items).toHaveLength(2);
      expect(result.items[0]).toEqual({
        name: '사과',
        quantity: 3,
        unit: '개',
        category: '과일',
      });
    });

    it('should handle image analysis with base64 conversion', async () => {
      const mockImageUri = 'file:///path/to/image.jpg';
      const mockBase64 = 'base64encodedimage';
      
      // Mock fetch for base64 conversion
      global.fetch = jest.fn().mockResolvedValue({
        blob: jest.fn().mockResolvedValue(new Blob(['image data'])),
      }) as jest.Mock;
      
      global.FileReader = jest.fn().mockImplementation(() => ({
        readAsDataURL: jest.fn(function(this: any) {
          setTimeout(() => {
            this.onloadend({ target: { result: `data:image/jpeg;base64,${mockBase64}` } });
          }, 0);
        }),
      })) as any;

      const mockResponse = {
        response: {
          text: () => JSON.stringify({
            items: [{ name: '양파', quantity: 2, unit: '개', category: '채소' }],
          }),
        },
      };

      mockGenerateContent.mockResolvedValue(mockResponse);

      const result = await aiService.analyzeImage(mockImageUri);

      expect(mockGenerateContent).toHaveBeenCalledWith([
        expect.stringContaining('다음 이미지에서 식재료를 분석'),
        expect.objectContaining({
          inlineData: {
            mimeType: 'image/jpeg',
            data: mockBase64,
          },
        }),
      ]);
    });

    it('should handle empty image analysis result', async () => {
      const mockImageUri = 'file:///path/to/image.jpg';
      const mockResponse = {
        response: {
          text: () => JSON.stringify({ items: [] }),
        },
      };

      mockGenerateContent.mockResolvedValue(mockResponse);

      const result = await aiService.analyzeImage(mockImageUri);

      expect(result.success).toBe(true);
      expect(result.items).toEqual([]);
    });

    it('should handle malformed JSON response', async () => {
      const mockImageUri = 'file:///path/to/image.jpg';
      const mockResponse = {
        response: {
          text: () => 'Invalid JSON',
        },
      };

      mockGenerateContent.mockResolvedValue(mockResponse);

      const result = await aiService.analyzeImage(mockImageUri);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to parse AI response');
    });

    it('should handle AI service errors', async () => {
      const mockImageUri = 'file:///path/to/image.jpg';
      
      mockGenerateContent.mockRejectedValue(new Error('AI service unavailable'));

      const result = await aiService.analyzeImage(mockImageUri);

      expect(result.success).toBe(false);
      expect(result.error).toBe('AI service unavailable');
    });

    it('should validate and clean extracted food items', async () => {
      const mockImageUri = 'file:///path/to/image.jpg';
      const mockResponse = {
        response: {
          text: () => JSON.stringify({
            items: [
              { name: '  사과  ', quantity: 3, unit: '개', category: '과일' },
              { name: '', quantity: 2, unit: 'kg', category: '채소' }, // Invalid - no name
              { name: '우유', quantity: -1, unit: 'L', category: '유제품' }, // Invalid quantity
              { name: '당근', quantity: '5', unit: '개', category: '채소' }, // String quantity
            ],
          }),
        },
      };

      mockGenerateContent.mockResolvedValue(mockResponse);

      const result = await aiService.analyzeImage(mockImageUri);

      expect(result.success).toBe(true);
      expect(result.items).toHaveLength(2); // Only valid items
      expect(result.items[0].name).toBe('사과'); // Trimmed
      expect(result.items[1].quantity).toBe(5); // Converted to number
    });
  });

  describe('generateRecipeSuggestions', () => {
    it('should generate recipe suggestions based on ingredients', async () => {
      const ingredients = ['닭고기', '양파', '마늘', '간장'];
      const mockResponse = {
        response: {
          text: () => JSON.stringify({
            recipes: [
              {
                name: '간장 닭볶음',
                ingredients: ['닭고기 300g', '양파 1개', '마늘 3쪽', '간장 3큰술'],
                difficulty: '쉬움',
                cookingTime: 20,
                instructions: ['1. 닭고기를 적당한 크기로 자른다', '2. 양파와 마늘을 다진다'],
              },
            ],
          }),
        },
      };

      mockGenerateContent.mockResolvedValue(mockResponse);

      const result = await aiService.generateRecipeSuggestions(ingredients);

      expect(result.success).toBe(true);
      expect(result.recipes).toHaveLength(1);
      expect(result.recipes[0].name).toBe('간장 닭볶음');
      expect(result.recipes[0].difficulty).toBe('쉬움');
    });

    it('should handle empty ingredients list', async () => {
      const result = await aiService.generateRecipeSuggestions([]);

      expect(result.success).toBe(false);
      expect(result.error).toBe('No ingredients provided');
    });

    it('should handle recipe generation errors', async () => {
      const ingredients = ['토마토', '치즈'];
      
      mockGenerateContent.mockRejectedValue(new Error('Failed to generate recipes'));

      const result = await aiService.generateRecipeSuggestions(ingredients);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to generate recipes');
    });
  });

  describe('detectExpiredItems', () => {
    it('should detect potentially expired items from image', async () => {
      const mockImageUri = 'file:///path/to/fridge/image.jpg';
      const mockResponse = {
        response: {
          text: () => JSON.stringify({
            expiredItems: [
              { name: '우유', reason: '유통기한 표시가 지난 것으로 보임', confidence: 0.8 },
              { name: '바나나', reason: '갈변이 심하게 진행됨', confidence: 0.9 },
            ],
          }),
        },
      };

      mockGenerateContent.mockResolvedValue(mockResponse);

      const result = await aiService.detectExpiredItems(mockImageUri);

      expect(result.success).toBe(true);
      expect(result.expiredItems).toHaveLength(2);
      expect(result.expiredItems[0].confidence).toBe(0.8);
    });
  });

  describe('categorizeFood', () => {
    it('should categorize food item correctly', async () => {
      const mockResponse = {
        response: {
          text: () => '채소',
        },
      };

      mockGenerateContent.mockResolvedValue(mockResponse);

      const result = await aiService.categorizeFood('당근');

      expect(result).toBe('채소');
    });

    it('should return 기타 for unknown food items', async () => {
      mockGenerateContent.mockRejectedValue(new Error('Cannot categorize'));

      const result = await aiService.categorizeFood('unknown_food');

      expect(result).toBe('기타');
    });
  });

  describe('Cache management', () => {
    it('should cache analysis results', async () => {
      const mockImageUri = 'file:///path/to/image.jpg';
      const mockResponse = {
        response: {
          text: () => JSON.stringify({
            items: [{ name: '사과', quantity: 3, unit: '개', category: '과일' }],
          }),
        },
      };

      mockGenerateContent.mockResolvedValue(mockResponse);

      // First call
      const result1 = await aiService.analyzeImage(mockImageUri);
      
      // Second call should use cache
      const result2 = await aiService.analyzeImage(mockImageUri);

      expect(mockGenerateContent).toHaveBeenCalledTimes(1); // Only called once
      expect(result1).toEqual(result2);
    });

    it('should clear cache when requested', async () => {
      const mockImageUri = 'file:///path/to/image.jpg';
      const mockResponse = {
        response: {
          text: () => JSON.stringify({
            items: [{ name: '사과', quantity: 3, unit: '개', category: '과일' }],
          }),
        },
      };

      mockGenerateContent.mockResolvedValue(mockResponse);

      await aiService.analyzeImage(mockImageUri);
      aiService.clearCache();
      await aiService.analyzeImage(mockImageUri);

      expect(mockGenerateContent).toHaveBeenCalledTimes(2);
    });
  });
});