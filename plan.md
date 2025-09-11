# Fresh Inventory - React Native Paper + Supabase 개발 계획

TDD를 사용하여 단계적으로 구현할 테스트 목록입니다. 각 테스트를 구현한 후 ✅ 표시를 하세요.

## 🎯 핵심 구현 원칙

### UI 구현 필수 사항
1. **프로토타입 우선**: 모든 화면은 `freshInventory/` 폴더의 Flask 프로토타입 레이아웃을 따라야 함
2. **React Native Paper 전용**: 모든 UI 컴포넌트는 React Native Paper 사용
3. **한국어 전용**: 모든 텍스트, 레이블, 메시지는 한국어로 작성
4. **Open Sans 폰트**: 모든 텍스트에 Open Sans 폰트 적용
5. **Material Design 3**: 엄격한 Material Design 3 원칙 준수
6. **Mint 테마**: #26A69A (primary), #B2DFDB (container) 등 일관된 색상 사용

### 프로토타입 참조 방법
각 기능 구현 전:
1. `freshInventory/templates/*.html`에서 해당 화면 HTML 확인
2. `freshInventory/static/js/app.js`에서 상호작용 로직 확인
3. 레이아웃과 동일하게 구현 (네비게이션만 하단으로 이동)
4. 인라인 편집, +/- 버튼 등 프로토타입의 UX 패턴 그대로 적용

## Phase 1: 프로젝트 기초 설정

### 1.1 프로젝트 초기 설정
- [✅] **Test**: App component should render without crashing
- [✅] **Test**: App should display correct title "Fresh Inventory"
- [✅] **Test**: TypeScript configuration should be valid
- [✅] **Test**: Expo app should build successfully

### 1.2 폰트 설정 (Open Sans)
- [✅] **Test**: Should load Open Sans font family successfully
- [✅] **Test**: App should not crash when Open Sans fonts are not loaded
- [✅] **Test**: Should display loading screen while fonts are loading
- [✅] **Test**: Typography should use Open Sans-Regular by default
- [✅] **Test**: Bold text should use Open Sans-Bold
- [✅] **Test**: SemiBold text should use OpenSans-SemiBold

### 1.3 React Native Paper 테마 설정
- [ ] **Test**: PaperProvider should be configured with Mint theme
- [ ] **Test**: Mint theme should export correct primary colors (#26A69A)
- [ ] **Test**: Mint theme should export correct container colors (#B2DFDB, #E0F2F1)
- [ ] **Test**: Mint theme should export correct text colors (#004D40, #00695C)
- [ ] **Test**: Mint theme should export Material Design 3 color system
- [ ] **Test**: App should be wrapped with PaperProvider

### 1.4 Material Design 3 스페이싱 시스템
- [ ] **Test**: Spacing system should follow 8dp grid system (8, 16, 24, 32, 48)
- [ ] **Test**: Paper components should use Material Design 3 spacing
- [ ] **Test**: Surface elevation should be properly implemented (0, 1, 2, 3)
- [ ] **Test**: Components should follow Paper's layout patterns

### 1.5 Paper Typography 시스템
- [ ] **Test**: Text component from Paper should render displayLarge variant
- [ ] **Test**: Text component should render headlineLarge/Medium/Small variants
- [ ] **Test**: Text component should render titleLarge/Medium/Small variants
- [ ] **Test**: Text component should render bodyLarge/Medium/Small variants
- [ ] **Test**: Text component should render labelLarge/Medium/Small variants
- [ ] **Test**: Typography should integrate Open Sans with Material Design 3
- [ ] **Test**: Korean text should render properly with Paper typography

### 1.6 React Native Paper 기본 컴포넌트
- [ ] **Test**: Button from Paper should render contained mode with Mint theme
- [ ] **Test**: Button should render outlined and text modes correctly
- [ ] **Test**: Button should handle loading and disabled states
- [ ] **Test**: TextInput should render outlined mode with Mint theme
- [ ] **Test**: TextInput should integrate properly with Open Sans font
- [ ] **Test**: Surface should render with proper elevation and Mint colors
- [ ] **Test**: Card should follow Material Design 3 patterns with Mint theme

### 1.7 한국어 설정 및 다국어 준비
- [✅] **Test**: Should export Korean translation object with common terms
- [✅] **Test**: Korean translations should include auth terms (로그인, 회원가입, etc.)
- [✅] **Test**: Korean translations should include inventory terms (재고, 추가, 소비, etc.)
- [✅] **Test**: Korean translations should include shopping terms (장보기, 구매, 완료, etc.)
- [✅] **Test**: Should provide helper function to get translated text
- [✅] **Test**: Should fallback to Korean when translation key is missing

### 1.8 네비게이션 구조
- [✅] **Test**: Bottom tab navigation should render three main tabs
- [✅] **Test**: Should navigate to Inventory screen when inventory tab is pressed
- [✅] **Test**: Should navigate to Cooking screen when cooking tab is pressed
- [✅] **Test**: Should navigate to Shopping screen when shopping tab is pressed
- [✅] **Test**: Active tab should be highlighted correctly

## Phase 2: Supabase 설정 및 데이터 레이어

### 2.1 Supabase 클라이언트 설정
- [✅] **Test**: Supabase client should initialize successfully
- [✅] **Test**: Database connection should be established
- [✅] **Test**: Should handle connection errors gracefully

### 2.2 데이터베이스 스키마 테스트
- [✅] **Test**: FoodItem model should have correct TypeScript interface
- [✅] **Test**: ShoppingItem model should have correct TypeScript interface
- [✅] **Test**: Recipe model should have correct TypeScript interface
- [✅] **Test**: Database tables should be created with correct schema

### 2.3 기본 데이터 서비스
- [✅] **Test**: InventoryService should fetch items successfully
- [✅] **Test**: InventoryService should handle fetch errors
- [✅] **Test**: ShoppingService should fetch items successfully
- [✅] **Test**: ShoppingService should handle fetch errors
- [✅] **Test**: Database service should handle offline scenarios

## Phase 3: 재고 관리 기능

**🎨 프로토타입 참조**: `freshInventory/templates/index.html` 레이아웃 필수 확인

### 3.1 재고 목록 표시
- [✅] **Test**: InventoryScreen should display "재고 목록" header
- [✅] **Test**: Should show "재료가 없습니다" when inventory is empty
- [✅] **Test**: Should display list of food items when inventory has data
- [✅] **Test**: Should show loading indicator while fetching data
- [✅] **Test**: Should display error message when fetch fails

### 3.2 재고 아이템 컴포넌트
- [✅] **Test**: FoodItemCard should display item name correctly
- [✅] **Test**: Should display remaining quantity
- [✅] **Test**: Should display days since added
- [✅] **Test**: Should show different status colors based on freshness
- [✅] **Test**: Should handle press events correctly

### 3.3 재료 추가 기능
- [✅] **Test**: AddItemScreen should render add form correctly
- [✅] **Test**: Should validate required fields (name, quantity)
- [✅] **Test**: Should call InventoryService.addItem with correct data
- [✅] **Test**: Should navigate back after successful addition
- [✅] **Test**: Should display error message on failure
- [✅] **Test**: Should clear form after successful submission

### 3.4 재료 수정 및 소비
- [✅] **Test**: Should update remaining quantity when consume button is pressed
- [✅] **Test**: Should move item to consumed list when quantity reaches zero
- [✅] **Test**: Should update item to frozen status when freeze button is pressed
- [✅] **Test**: Should move item to disposed list when dispose button is pressed
- [✅] **Test**: Should calculate consumption period correctly

### 3.5 냉동 보관 탭
- [✅] **Test**: Should display frozen items in separate tab
- [✅] **Test**: Should allow moving items from frozen back to regular inventory
- [✅] **Test**: Should show frozen date for each item

### 3.6 지난 기록 탭
- [✅] **Test**: Should display last 10 consumed items
- [✅] **Test**: Should remove duplicates by name (show latest only)
- [✅] **Test**: Should allow adding items back to shopping list from history

## Phase 4: 장보기 목록 기능

### 4.1 장보기 목록 표시
- [✅] **Test**: ShoppingScreen should display "장보기 목록" header
- [✅] **Test**: Should show "쇼핑 목록이 없습니다" when list is empty
- [✅] **Test**: Should display list of shopping items (todo=true)
- [✅] **Test**: Should show loading indicator while fetching

### 4.2 쇼핑 아이템 관리
- [✅] **Test**: ShoppingItemCard should display item name and memo
- [✅] **Test**: Should show checkbox for completion status
- [✅] **Test**: Should toggle todo status when checkbox is pressed
- [✅] **Test**: Should update item in database when status changes

### 4.3 새 쇼핑 항목 추가
- [✅] **Test**: Should render add shopping item form
- [✅] **Test**: Should prevent adding duplicate items (show warning)
- [✅] **Test**: Should add new shopping item successfully
- [✅] **Test**: Should validate item name is not empty

### 4.4 완료한 쇼핑 섹션
- [✅] **Test**: Should display last 5 completed shopping items
- [✅] **Test**: Should group completed items by date
- [✅] **Test**: Should show completion date for each item

## Phase 5: 사용자 인증 (Supabase Auth)

### 5.1 인증 서비스 설정
- [✅] **Test**: AuthService should initialize Supabase auth correctly
- [✅] **Test**: Should handle auth state changes
- [✅] **Test**: Should store user session securely

### 5.2 로그인 화면
- [✅] **Test**: LoginScreen should render login form
- [✅] **Test**: Should validate email format
- [✅] **Test**: Should call login with correct credentials
- [✅] **Test**: Should navigate to main app after successful login
- [✅] **Test**: Should display error message on login failure

### 5.3 회원가입 화면
- [✅] **Test**: SignUpScreen should render signup form
- [✅] **Test**: Should validate password confirmation
- [✅] **Test**: Should create new user account
- [✅] **Test**: Should handle signup errors

### 5.4 인증 플로우
- [✅] **Test**: Should redirect to login when user is not authenticated
- [✅] **Test**: Should show main app when user is authenticated
- [✅] **Test**: Should handle logout correctly
- [✅] **Test**: Should persist authentication state across app restarts

## Phase 6: 이미지 처리 및 AI 통합

**🎨 프로토타입 참조**: 
- HTML: `freshInventory/templates/index.html` (모달 및 AI 결과 표시)
- JS: `freshInventory/static/js/app.js` (displayAIResults 함수 - 인라인 편집, +/- 버튼 필수)

### 6.1 이미지 업로드 기능
- [✅] **Test**: Should open camera when camera button is pressed
- [✅] **Test**: Should open gallery when gallery button is pressed
- [✅] **Test**: Should display selected image preview
- [✅] **Test**: Should compress image before upload
- [✅] **Test**: Should upload image to Supabase Storage

### 6.2 Google AI 재료 인식
- [✅] **Test**: AIService should initialize Google Generative AI client
- [✅] **Test**: Should analyze image and extract food items
- [ ] **Test**: Should return structured food item data
- [ ] **Test**: Should handle AI service errors gracefully
- [ ] **Test**: Should pre-fill add item form with AI-detected data

### 6.3 이미지 기반 재료 추가
- [✅] **Test**: Should show loading indicator during AI analysis
- [✅] **Test**: Should display detected items for user confirmation
- [✅] **Test**: Should allow editing AI-detected information
- [✅] **Test**: Should save corrected information for learning

## Phase 7: 요리 추천 기능

### 7.1 요리 추천 탭
- [ ] **Test**: CookingScreen should display "요리 추천" header
- [ ] **Test**: Should show current inventory items
- [ ] **Test**: Should display "추천 요리가 없습니다" when no recipes available

### 7.2 AI 요리 추천
- [ ] **Test**: Should generate recipe suggestions based on available ingredients
- [ ] **Test**: Should display recipe cards with name, ingredients, and difficulty
- [ ] **Test**: Should handle case when insufficient ingredients available
- [ ] **Test**: Should refresh recommendations when inventory changes

### 7.3 북마크 기능
- [ ] **Test**: Should display bookmarked recipes in separate tab
- [ ] **Test**: Should add recipe to bookmarks when star is pressed
- [ ] **Test**: Should remove recipe from bookmarks when star is pressed again
- [ ] **Test**: Should persist bookmarks in database

### 7.4 요리 상세 화면
- [ ] **Test**: Should display recipe details (ingredients, instructions)
- [ ] **Test**: Should show which ingredients are available/missing
- [ ] **Test**: Should add missing ingredients to shopping list
- [ ] **Test**: Should mark ingredients as consumed when recipe is cooked

## Phase 8: 고급 기능 및 최적화

### 8.1 실시간 동기화
- [ ] **Test**: Should receive real-time updates when inventory changes
- [ ] **Test**: Should update UI when other users modify shared inventory
- [ ] **Test**: Should handle connection loss gracefully

### 8.2 오프라인 지원
- [ ] **Test**: Should work offline for basic operations
- [ ] **Test**: Should sync changes when connection is restored
- [ ] **Test**: Should show offline status indicator

### 8.3 성능 최적화
- [ ] **Test**: Should load inventory items efficiently with pagination
- [ ] **Test**: Should cache images for faster loading
- [ ] **Test**: Should optimize re-renders with proper memoization

### 8.4 접근성
- [ ] **Test**: Should have proper accessibility labels for screen readers
- [ ] **Test**: Should support dynamic text sizing
- [ ] **Test**: Should work with voice control
- [ ] **Test**: Should have sufficient color contrast

### 8.5 에러 처리 및 로깅
- [ ] **Test**: Should have error boundary for unexpected crashes
- [ ] **Test**: Should log important user actions
- [ ] **Test**: Should provide helpful error messages to users
- [ ] **Test**: Should retry failed operations automatically where appropriate

---

## 개발 진행 방식

1. 각 테스트를 위에서부터 순서대로 구현
2. 테스트가 실패하는 것을 확인 (Red)
3. 최소한의 코드로 테스트를 통과시키기 (Green)
4. 코드 개선 및 리팩토링 (Refactor)
5. 다음 테스트로 이동

## 참고사항

- 각 Phase가 완료되면 해당 기능이 완전히 작동해야 함
- 테스트는 작은 단위로 나누어 빠른 피드백 확보
- UI와 비즈니스 로직을 분리하여 테스트하기 쉽게 구성
- Supabase 실시간 기능은 Phase 8에서 구현
- AI 기능은 복잡하므로 별도 Phase로 분리
- 성능 최적화는 기본 기능 완성 후에 진행