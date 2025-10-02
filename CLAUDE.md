# CLAUDE.md - ez2cook 개발 가이드

## 🎯 프로젝트 개요
AI 기반 식재료 관리 React Native 앱 (Expo SDK 54)

## 🏗 아키텍처
- **Frontend**: React Native + TypeScript + React Native Paper
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **AI Service**: Google Gemini API (`gemini-2.5-flash-lite`)
- **Package**: `com.smartagent.nengpro`

### AI 모델 설정
- **필수**: 모든 AI 서비스에서 `gemini-2.5-flash-lite` 모델 사용
- **적용 위치**:
  - `src/services/AIService.ts` (이미지 분석, 레시피 생성)
  - `src/services/StorageInfoService.ts` (식재료 보관 정보)
- **이유**: `gemini-1.5-flash`는 v1beta API에서 지원되지 않음

## 📱 핵심 기능
1. **AI 식재료 인식**: 사진으로 자동 식재료 등록
2. **스마트 재고 관리**: 신선도 추적, 냉동/냉장 분류
3. **요리 추천**: 보유 재료 기반 AI 레시피 생성
4. **장보기 리스트**: 자동 완료 처리, 실시간 배지
5. **소비 분석**: 사용/폐기 비율, 월별 히스토리

## 🎨 UI/UX 원칙
### React Native Paper 전용
- **절대 사용 금지**: 바닐라 React Native 컴포넌트
- **필수 사용**: Paper 컴포넌트 (Surface, Card, Button, Text 등)
- **테마**: Mint (#26A69A) + Material Design 3

### 한국어 전용
- 모든 텍스트, 메시지, 레이블 한국어
- Open Sans 폰트 패밀리

### 컴포넌트 패턴
```typescript
// ✅ Good
import { Surface, Text, Button } from 'react-native-paper';

// ❌ Bad
import { View, Text } from 'react-native';
```

## 🔐 인증 시스템
### 사용자별 설정 분리
```typescript
// AsyncStorage 키 패턴
const key = `@ez2cook_settings_${userId}`;
```

### 딥링크 설정
- Scheme: `com.smartagent.nengpro`
- 이메일 인증 리다이렉션 지원

## 📊 데이터베이스 스키마
### food_items
- `id`, `name`, `quantity`, `unit`
- `category`, `expiryDate`, `addedDate`
- `status`: 'active' | 'consumed' | 'discarded' | 'frozen'
- `imageUrl`, `userId`

### shopping_items
- `todo`: boolean (장보기 상태)
- `completedAt`: 완료 시간

### recipes
- 레시피 정보 및 북마크

## 🚀 개발 명령어
```bash
# 개발 서버 시작
npx expo start

# 타입 체크
npm run type-check

# 린트
npm run lint

# 테스트
npm test
```

## 🐛 알려진 이슈 및 해결
1. **알림 설정 문제**: 사용자별 AsyncStorage 키 분리로 해결
2. **이메일 인증 리다이렉션**: 딥링크 스킴 설정 필요
3. **Expo Go 알림**: 실제 기기에서만 작동
4. **키보드 입력창 가림 문제**:
   - `KeyboardAvoidingView` 대신 `measureInWindow` + 자동 스크롤 사용
   - `Keyboard.addListener('keyboardDidShow')`로 키보드 높이 감지
   - iOS/Android 모두 일관되게 작동

## 📝 코드 컨벤션
### 파일 구조
```
src/
├── components/   # 재사용 컴포넌트
├── screens/      # 화면 컴포넌트
├── services/     # API 서비스
├── hooks/        # 커스텀 훅
├── constants/    # 상수 (colors, spacing)
└── navigation/   # 네비게이션 설정
```

### 네이밍 규칙
- 컴포넌트: PascalCase (`InventoryScreen`)
- 함수: camelCase (`handleSubmit`)
- 상수: UPPER_SNAKE (`MAX_ITEMS`)
- 파일: PascalCase for components, camelCase for utils

### 상태 관리
- 로컬 상태: useState
- 전역 상태: Context API (AuthContext, ShoppingContext)
- 서버 상태: Supabase 실시간 구독

## 🔒 환경 변수
```
EXPO_PUBLIC_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_ANON_KEY
EXPO_PUBLIC_GOOGLE_GENERATIVE_AI_KEY
```

## 📱 주요 화면
1. **InventoryScreen**: 재고 목록, 냉동 보관, 지난 기록
2. **ShoppingScreen**: 장보기, 완료한 쇼핑
3. **CookingScreen**: 요리 추천, 북마크
4. **ProfileScreen**: 사용자 설정, 알림 관리

## ⚠️ 중요 사항
- **TDD 원칙**: 테스트 우선 개발
- **타입 안정성**: TypeScript 엄격 모드
- **접근성**: 모든 인터랙티브 요소에 접근성 레이블
- **성능**: 이미지 최적화, 메모이제이션 활용
- **보안**: 민감 정보 노출 금지, 환경 변수 사용

## 🔧 플랫폼별 고려사항

### 키보드 처리
- **문제**: `KeyboardAvoidingView`는 iOS/Android에서 일관성 없이 작동
- **해결책**: 다음 패턴 사용
  ```typescript
  // ScrollView ref 및 상태
  const scrollViewRef = useRef<ScrollView>(null);
  const inputContainerRef = useRef<View>(null);
  const [scrollOffset, setScrollOffset] = useState(0);

  // ScrollView 설정
  <ScrollView
    ref={scrollViewRef}
    onScroll={(e) => setScrollOffset(e.nativeEvent.contentOffset.y)}
    scrollEventThrottle={16}
  >
    <View ref={inputContainerRef}>
      <TextInput
        onFocus={() => {
          const keyboardListener = Keyboard.addListener('keyboardDidShow', (e) => {
            inputContainerRef.current?.measureInWindow((x, y, width, height) => {
              const keyboardHeight = e.endCoordinates.height;
              const screenHeight = Dimensions.get('window').height;
              const inputBottom = y + height;
              const visibleScreen = screenHeight - keyboardHeight;

              if (inputBottom > visibleScreen - 20) {
                const scrollTo = scrollOffset + (inputBottom - visibleScreen + 100);
                scrollViewRef.current?.scrollTo({ y: scrollTo, animated: true });
              }
            });
            keyboardListener.remove();
          });
        }}
      />
    </View>
  </ScrollView>
  ```

### QR 코드로 모바일 테스트
```bash
# 로컬 네트워크로 Expo 서버 시작
npx expo start

# 터널 모드 (ngrok 타임아웃 이슈 가능)
npx expo start --tunnel

# 수동 QR 코드 생성
npx qrcode-terminal "exp://YOUR_IP:8081"
```

## 🔄 Git 워크플로우

### 커밋 규칙
1. 기능별 브랜치 생성
2. 커밋 전 필수 확인:
   - `npm test` 통과
   - `npm run type-check` 성공
   - `npm run lint` 에러 없음
3. 의미있는 커밋 메시지 작성
4. PR 생성 및 리뷰

### ⚠️ 중요: GitHub Push 정책
**절대 자동으로 push하지 않음**
- `git add`와 `git commit`까지만 자동 실행 가능
- `git push`는 반드시 사용자가 명시적으로 요청할 때만 실행
- 사용자가 "github에 push해줘", "git push 해줘" 등 명확히 요청할 때만 push
- 커밋 후 push 여부는 항상 사용자에게 확인

## 📞 지원
- GitHub Issues: 버그 리포트 및 기능 제안
- 문서: `/docs` 폴더 참조