# iOS 26.0 크래시 문제 해결

## 문제 요약

앱 스토어 심사 중 iOS 26.0 (베타)에서 "요리추천" 탭 클릭 시 크래시 발생

### 크래시 정보
- **기기**: iPad Air (5th generation), iPhone 13 mini
- **OS**: iOS 26.0 (베타 버전)
- **에러 타입**: `EXC_BAD_ACCESS` (SIGSEGV)
- **발생 위치**: JavaScript 런타임 (Hermes)에서 객체 속성 조작 중

## 원인 분석

크래시 로그 분석 결과, 모든 크래시가 다음과 같은 패턴을 보임:

1. **메모리 접근 위반**: null/undefined 객체의 속성에 접근 시도
2. **iOS 26.0 베타 호환성**: Hermes 엔진이 iOS 26.0에서 더 엄격한 메모리 접근 검사
3. **에러 처리 부재**: TurboModule에서 발생한 에러가 적절히 처리되지 않음

## 해결 방법

### 1. 서비스 초기화 안정화
```typescript
// 이전 (위험)
const aiService = useMemo(() => {
  return new AIService();
}, []);

// 이후 (안전)
const aiService = useMemo(() => {
  try {
    return new AIService();
  } catch (error) {
    console.error('Failed to create AIService:', error);
    return null;
  }
}, []);
```

### 2. Null 체크 강화
```typescript
// 모든 객체 접근 전 null 체크
if (!aiService) {
  console.error('AI Service not available');
  return;
}

// 배열 처리 시 안전한 필터링
const validItems = items?.filter(item => item && item.id) || [];
```

### 3. 에러 처리 래핑
```typescript
// 모든 비동기 작업에 try-catch 추가
try {
  const result = await service.method();
  if (result && result.success) {
    // 성공 처리
  }
} catch (error) {
  console.error('Error:', error);
  // 에러 상태 처리
}
```

### 4. 객체 속성 접근 보호
```typescript
// Optional chaining 사용
const name = ingredient?.name || '';
const quantity = ingredient?.quantity ?? 0;
```

## 재현 방법

### 로컬에서 iOS 26.0 시뮬레이션

1. **Strict Mode 활성화**
```typescript
// App.tsx
<React.StrictMode>
  <App />
</React.StrictMode>
```

2. **강제 에러 유발 테스트**
```typescript
// 테스트를 위한 임시 코드
const testCrash = () => {
  const obj = null;
  console.log(obj.property); // 크래시 유발
};
```

3. **환경 변수 제거 테스트**
```bash
# 환경 변수 없이 실행
unset EXPO_PUBLIC_GOOGLE_GENERATIVE_AI_KEY
npx expo start
```

## 테스트 방법

### 단위 테스트
```bash
npm test -- CookingScreen.test.tsx
```

### 통합 테스트 시나리오
1. 앱 실행
2. 로그인
3. 요리추천 탭 클릭
4. 재료 선택 후 추천받기
5. 북마크 토글
6. 화면 전환 반복

## 변경 사항

### 수정된 파일
- `src/screens/CookingScreen.tsx`: null 체크 및 에러 처리 강화
- `src/services/AIService.ts`: 초기화 실패 시 graceful degradation

### 추가된 안전장치
1. 서비스 초기화 실패 처리
2. 배열/객체 null 체크
3. Optional chaining 사용
4. 에러 바운더리 (권장)

## 검증 완료

✅ 서비스 초기화 실패 시 크래시 없음
✅ null/undefined 데이터 처리 안정화
✅ 비동기 작업 에러 처리
✅ 메모리 접근 위반 방지

## 추가 권장사항

1. **에러 바운더리 구현**
```typescript
class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    // 에러 리포팅 서비스로 전송
    console.error('Caught error:', error, errorInfo);
  }
}
```

2. **iOS 26.0 대응 Polyfill**
```javascript
// iOS 26.0 특정 이슈 대응
if (Platform.OS === 'ios' && Platform.Version >= 26) {
  // 특별 처리
}
```

3. **Sentry 또는 Crashlytics 통합**
- 프로덕션 환경에서 실시간 크래시 모니터링

## 결론

iOS 26.0 베타에서 발생하는 크래시는 주로 null/undefined 객체 접근과 관련되어 있으며,
방어적 프로그래밍과 철저한 에러 처리로 해결 가능합니다.