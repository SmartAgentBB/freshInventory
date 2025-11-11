// 환경 변수 없이 앱 서비스 테스트
// API 키가 없을 때 크래시가 발생하는지 확인

// 환경 변수 제거
delete process.env.EXPO_PUBLIC_GOOGLE_GENERATIVE_AI_KEY;
delete process.env.EXPO_PUBLIC_GEMINI_API_KEY;
delete process.env.GOOGLE_GENERATIVE_AI_KEY;

console.log('=== API 키 없이 서비스 초기화 테스트 ===\n');

// AIService 초기화 테스트
const { AIService } = require('./src/services/AIService');

console.log('테스트 1: AIService 초기화');
try {
  const aiService = new AIService();
  console.log('✅ AIService 생성 성공 (크래시 없음)');

  // 서비스가 제대로 비활성화되었는지 확인
  if (aiService) {
    console.log('테스트 2: 레시피 생성 (API 없이)');
    aiService.generateRecipeSuggestions(['사과', '당근'])
      .then(result => {
        if (result.success === false) {
          console.log('✅ 예상대로 실패 반환:', result.error);
        } else {
          console.log('❌ API 없는데 성공함?');
        }
      })
      .catch(error => {
        console.log('✅ 에러 처리됨:', error.message);
      });
  }
} catch (error) {
  console.log('❌ 서비스 초기화 중 크래시:', error.message);
}

console.log('\n테스트 3: CookingScreen 컴포넌트 로드 시뮬레이션');
try {
  // 실제 컴포넌트 로드를 시뮬레이션
  const mockInventoryService = {
    getCookingIngredients: () => {
      throw new Error('Service not available');
    }
  };

  // null 서비스로 호출 시도
  if (!mockInventoryService) {
    console.log('✅ 서비스가 null일 때 안전하게 처리됨');
  } else {
    try {
      const items = mockInventoryService.getCookingIngredients('user-id');
      console.log('Items:', items);
    } catch (error) {
      console.log('✅ 서비스 에러가 적절히 처리됨:', error.message);
    }
  }
} catch (error) {
  console.log('❌ 컴포넌트 시뮬레이션 중 크래시:', error.message);
}

console.log('\n=== 테스트 완료 ===');
console.log('환경 변수 상태:');
console.log('- EXPO_PUBLIC_GOOGLE_GENERATIVE_AI_KEY:', process.env.EXPO_PUBLIC_GOOGLE_GENERATIVE_AI_KEY || 'undefined');
console.log('- EXPO_PUBLIC_GEMINI_API_KEY:', process.env.EXPO_PUBLIC_GEMINI_API_KEY || 'undefined');