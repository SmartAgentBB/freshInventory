import { AIService } from '../src/services/AIService';

describe('AIService without API key', () => {
  let originalKey: string | undefined;

  beforeAll(() => {
    // Save and remove API keys
    originalKey = process.env.EXPO_PUBLIC_GOOGLE_GENERATIVE_AI_KEY;
    delete process.env.EXPO_PUBLIC_GOOGLE_GENERATIVE_AI_KEY;
    delete process.env.GOOGLE_GENERATIVE_AI_KEY;
    delete process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  });

  afterAll(() => {
    // Restore API key
    if (originalKey) {
      process.env.EXPO_PUBLIC_GOOGLE_GENERATIVE_AI_KEY = originalKey;
    }
  });

  it('should not crash when API key is missing', () => {
    expect(() => {
      const service = new AIService();
    }).not.toThrow();
  });

  it('should handle generateRecipeSuggestions gracefully without API key', async () => {
    const service = new AIService();
    const result = await service.generateRecipeSuggestions(['사과', '당근']);

    expect(result).toBeDefined();
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.recipes).toEqual([]);
  });

  it('should handle analyzeImage gracefully without API key', async () => {
    const service = new AIService();
    const result = await service.analyzeImage('mock-image-uri');

    expect(result).toBeDefined();
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.ingredients).toEqual([]);
  });

  it('should log warning when API key is not configured', () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

    new AIService();

    expect(consoleSpy).toHaveBeenCalledWith('Google AI API key is not configured properly');

    consoleSpy.mockRestore();
  });
});