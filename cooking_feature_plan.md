# 요리 추천 기능 개발 계획

## 📌 개요
프로토타입의 cooking.html과 Flask API를 분석하여 React Native 앱으로 이전할 요리 추천 기능 개발 계획

## 🎯 핵심 기능

### 1. 재료 표시 및 우선순위 시스템
- **재료 칩 디스플레이**
  - 재료명만 표시 (수량, 썸네일 제외)
  - 배경색으로 소비기한 상태 표현
  - 소비기한 임박 순서로 정렬
  - 색상 코드 시스템 (4단계 그라데이션)
    - 초록색 (권장소비기간의 70-100%): 신선
    - 노란색 (권장소비기간의 30-69%): 주의
    - 주황색 (권장소비기간의 0-29%): 경고
    - 빨간색 (권장소비기간을 지난 식재료): 위험/만료

- **우선순위 자동 계산**
  - 만료/임박: 소비기한 임박표시 색상이 빨간색, 주황색인 식재료, 우선도 높음
  - 중간 기한: 소비기한 임박표시 색상이 노란색인 식재료, 우선도 보통
  - 충분한 기한: 소비기한 임박표시 색상인 초록색인 식재료, 우선도 낮음
  - 냉동 보관: 우선도 보통 (고정) 

### 2. AI 요리 추천 시스템
- **Gemini AI 통합**
  - 보유 재료 기반 레시피 추천
  - 우선순위 높은 재료 우선 활용
  - 3-5개 요리 제안

- **추천 결과 정보**
  - 요리명
  - 간단한 요리 설명 (1-2문장)
  - 필요 재료 목록
  - 난이도 (쉬움/보통/어려움)
  - 조리 시간
  - YouTube 검색 쿼리

### 3. 북마크 기능
- 추천받은 레시피 저장
- 북마크 목록 관리
- 로컬 저장소 활용

### 4. YouTube 연동
- 레시피별 검색어 자동 생성
- 외부 YouTube 앱으로 연결
- 조리법 영상 검색 지원

## 🗂️ 데이터 구조

### Supabase 테이블 설계

#### 1. cooking_bookmarks
```sql
CREATE TABLE cooking_bookmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  recipe_title TEXT NOT NULL,
  ingredients TEXT[] NOT NULL,
  difficulty VARCHAR(20) NOT NULL,
  cooking_time VARCHAR(50) NOT NULL,
  youtube_query TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 📱 화면 구성

### CookingScreen 구조
```
CookingScreen (Main)
├── Tab: 요리추천
│   ├── IngredientsChipList (재료 칩 목록)
│   │   ├── IngredientChip (각 재료 칩)
│   │   └── EmptyState (재료 없음)
│   ├── RecommendButton (AI 추천 버튼)
│   └── RecommendationModal (추천 결과)
│       ├── RecipeCard (각 레시피)
│       ├── BookmarkButton (북마크)
│       └── YouTubeButton (유튜브 검색)
└── Tab: 북마크
    ├── BookmarksList (저장된 레시피)
    └── EmptyState (북마크 없음)
```

## 🔄 데이터 플로우

### 1. 재료 목록 조회
```typescript
// InventoryService에 추가
async getCookingIngredients(): Promise<CookingIngredient[]> {
  // 과일 제외, 우선순위 계산 포함
  const { data } = await supabase
    .from('food_items')
    .select('*')
    .not('category', 'eq', '과일')
    .gt('remains', 0)
    .order('expiry_date', { ascending: true });
    
  return this.calculatePriority(data);
}
```

### 2. AI 추천 요청
```typescript
// AIService에 추가
interface Recipe {
  title: string;
  description: string;  // 간단한 요리 설명
  ingredients: string[];
  difficulty: '쉬움' | '보통' | '어려움';
  time: string;
  youtube_query: string;
}

async getCookingRecommendations(ingredients: CookingIngredient[]): Promise<Recipe[]> {
  const prompt = this.buildCookingPrompt(ingredients);
  const response = await this.callGeminiAPI(prompt);
  return this.parseRecipes(response);
}
```

### 3. 북마크 관리
```typescript
// BookmarkService 생성
class BookmarkService {
  async saveBookmark(recipe: Recipe): Promise<void>
  async getBookmarks(): Promise<Recipe[]>
  async deleteBookmark(id: string): Promise<void>
}
```

## 🎨 UI/UX 구현

### 1. 재료 칩 컴포넌트
```typescript
interface IngredientChipProps {
  name: string;
  expiryColor: string;
  daysRemaining: number;
}
```

### 2. 추천 결과 모달
- Bottom Sheet 형태
- 스와이프로 닫기
- 각 레시피 카드형 표시

### 3. 애니메이션
- 카드 페이드인 효과
- 추천 로딩 스피너
- 북마크 토글 애니메이션

## 📋 구현 순서

### Phase 1: 기본 구조 (Day 1)
1. [ ] CookingScreen 기본 레이아웃
2. [ ] Tab Navigator 설정
3. [ ] 재료 목록 API 연결
4. [ ] IngredientChip 컴포넌트

### Phase 2: AI 추천 (Day 2)
1. [ ] AIService 구현
2. [ ] Gemini API 통합
3. [ ] 추천 요청 로직
4. [ ] 결과 파싱 및 표시

### Phase 3: 북마크 기능 (Day 3)
1. [ ] Supabase 테이블 생성
2. [ ] BookmarkService 구현
3. [ ] 북마크 UI 구현
4. [ ] 북마크 목록 화면

### Phase 4: 부가 기능 (Day 4)
1. [ ] YouTube 연동
2. [ ] 로딩/에러 처리
3. [ ] 애니메이션 추가
4. [ ] 성능 최적화

## 🔧 기술 스택
- React Native + TypeScript
- React Native Paper (UI)
- Supabase (데이터베이스)
- Google Gemini AI (추천 엔진)
- React Navigation (네비게이션)
- AsyncStorage (로컬 캐싱)

## ⚠️ 주의사항
1. API 키 보안 관리 (환경변수)
2. 오프라인 모드 대응
3. AI 응답 실패 처리
4. 재료명 정규화 (괄호 제거 등)
5. 중복 재료 처리 로직

## 🚀 향후 개선사항
- 레시피 상세 정보 추가
- 사용자 선호도 학습
- 계절별 추천 기능
- 가족 구성원별 추천
- 영양 정보 표시