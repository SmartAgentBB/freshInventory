# 프롬프트 템플릿 시스템 구축 완료 📝

## ✅ 완료된 작업

### 1. DB 스키마 생성
- `prompt_templates` 테이블: 프롬프트 저장
- `prompt_history` 테이블: 변경 히스토리
- RLS 정책 및 자동 트리거
- 📁 `supabase/migrations/002_create_prompt_templates.sql`

### 2. 프롬프트 템플릿 추가 ⭐️ **핵심 개선**
**요리 스타일 입력 여부에 따라 다른 프롬프트 사용**

#### 요리 스타일 있을 때:
- `recipe_recommendation_ko`: 한국어 (요리 스타일 강조)
- `recipe_recommendation_en`: 영어 (요리 스타일 강조)
- 🎯 요리 스타일을 **최우선**으로 고려
- 스타일별 가이드라인 제공 (간편한, 빠른, 건강한, 매운 등)

#### 요리 스타일 없을 때:
- `recipe_recommendation_ko_no_style`: 한국어 (다양성 강조)
- `recipe_recommendation_en_no_style`: 영어 (다양성 강조)
- 🌟 다양한 조리법 추천 (찌개, 볶음, 조림, 무침)
- 난이도 다양화 (쉬운 것부터 중급까지)

#### 기타 프롬프트:
- `ingredient_analysis_ko/en`: 식재료 이미지 분석
- `expired_detection_ko`: 상한 식재료 감지
- `categorization_ko`: 식재료 카테고리 분류

**총 8개 프롬프트 템플릿**
📁 `supabase/migrations/003_insert_default_prompts.sql`

### 3. PromptTemplateService 구현
- **3단계 캐싱**: 메모리 → AsyncStorage → Supabase
- **자동 동기화**: 로그인 시 + 일 1회 백그라운드
- **Fallback 지원**: 네트워크 장애 시에도 작동
- **변수 치환**: `{{변수}}` 형식 지원
- 📁 `src/services/PromptTemplateService.ts`

### 4. AIService 통합
- 요리 스타일 유무 감지 로직 추가
- 조건에 따라 적절한 프롬프트 자동 선택:
  ```typescript
  // 요리 스타일이 있을 때
  if (hasCookingStyle) {
    → recipe_recommendation_ko 사용
  } else {
    → recipe_recommendation_ko_no_style 사용
  }
  ```
- 모든 프롬프트가 DB에서 로드
- 📁 `src/services/AIService.ts`

### 5. 로그인 시 동기화
- `SIGNED_IN` 이벤트 시 프롬프트 동기화
- 초기 세션 시 백그라운드 동기화
- 로그아웃 시 메모리 캐시 초기화
- 📁 `src/hooks/useAuth.ts`

### 6. 사용 가이드 작성
- 설치 및 설정 가이드
- 프롬프트 관리 방법
- 문제 해결 가이드
- 📁 `docs/PROMPT_TEMPLATE_GUIDE.md`

---

## 🚀 사용 방법

### 1. DB 마이그레이션 실행

**Supabase 대시보드에서:**

```sql
-- Step 1: 테이블 생성
-- supabase/migrations/002_create_prompt_templates.sql 실행

-- Step 2: 프롬프트 삽입
-- supabase/migrations/003_insert_default_prompts.sql 실행

-- Step 3: 확인
SELECT template_key, version, description
FROM prompt_templates
WHERE is_active = true;
```

**예상 결과: 8개 프롬프트**

### 2. 앱 실행 및 테스트

```bash
npx expo start
```

**로그인 시 자동 동기화:**
```
[Auth] User signed in, syncing prompt templates...
[PromptTemplate] Starting sync...
[PromptTemplate] Sync completed: 8 templates
```

### 3. 프롬프트 동작 확인

#### 시나리오 1: 요리 스타일 입력 O
```
요리 화면 → "간편한" 입력 → 추천받기
→ recipe_recommendation_ko 사용
→ 간편한 스타일의 요리 위주로 추천
```

#### 시나리오 2: 요리 스타일 입력 X
```
요리 화면 → 입력 없이 추천받기
→ recipe_recommendation_ko_no_style 사용
→ 다양한 조리법의 요리 추천
```

---

## 🔧 프롬프트 수정 방법

### 방법 1: 간단한 수정 (Supabase 대시보드)

```sql
-- 요리 스타일 강조 프롬프트 수정
UPDATE prompt_templates
SET
  template_content = '수정된 프롬프트 내용...',
  version = version + 1
WHERE template_key = 'recipe_recommendation_ko';
```

### 방법 2: 히스토리와 함께 수정 (권장)

```sql
SELECT update_prompt_with_history(
  'recipe_recommendation_ko',
  '수정된 프롬프트 내용...',
  '이모지 추가 및 가독성 개선'
);
```

### 적용 방법
1. Supabase에서 프롬프트 수정
2. 앱에서 로그아웃
3. 다시 로그인 (자동 동기화)
4. 요리 추천 테스트

---

## 📊 개선 효과

### Before (하드코딩)
- ❌ 프롬프트 수정 시 앱 재배포 필요
- ❌ A/B 테스트 불가능
- ❌ 요리 스타일 반영 부족
- ❌ 버전 관리 어려움

### After (동적 관리)
- ✅ DB만 수정하면 즉시 적용
- ✅ A/B 테스트 가능 (추후 확장)
- ✅ 요리 스타일 명확히 반영
- ✅ 히스토리 자동 저장

### 비용
- **Supabase 읽기**: 사용자당 월 30-60회
- **예상 비용**: 거의 무료 (Free tier 충분)

---

## 💡 프롬프트 개선 가이드

### 요리 스타일이 잘 반영되지 않을 때

**개선 포인트:**
1. 이모지로 시각적 강조 (🎯)
2. "최우선으로 고려" 문구 추가
3. 스타일별 구체적 가이드라인 제공
4. 원칙 순서 조정 (스타일을 1번으로)

**예시:**
```sql
UPDATE prompt_templates
SET template_content = '당신은 30년차 한식 요리 연구가입니다.

보유한 식재료:
{{ingredients}}

🎯 **사용자가 원하는 요리 스타일: {{cookingStyle}}**

**중요: 위에 명시된 요리 스타일을 최우선으로 고려하여 레시피를 추천해주세요!**

요리 스타일별 가이드라인:
- "간편한": 조리시간 15분 이하, 조리 단계 5개 이하
- "빠른": 조리시간 10분 이하
- "건강한": 저칼로리, 영양 균형
- "매운": 고추, 고춧가루 필수 사용
...'
WHERE template_key = 'recipe_recommendation_ko';
```

---

## 🐛 문제 해결

### Q: 프롬프트가 반영되지 않아요
**A:**
1. DB 확인: `SELECT * FROM prompt_templates WHERE template_key = '키';`
2. `is_active = true` 확인
3. 앱 로그아웃 → 로그인
4. 24시간 대기 (자동 동기화)

### Q: 로그인 시 동기화 실패
**A:**
- 네트워크 확인
- Supabase RLS 정책 확인
- 로컬 캐시가 자동으로 사용됨 (걱정 안 해도 됨)

### Q: 프롬프트를 실수로 삭제했어요
**A:**
```sql
-- 히스토리에서 복구
SELECT * FROM prompt_history
WHERE template_id = (
  SELECT id FROM prompt_templates
  WHERE template_key = 'recipe_recommendation_ko'
)
ORDER BY changed_at DESC;

-- 이전 버전으로 복구
UPDATE prompt_templates
SET template_content = (
  SELECT template_content FROM prompt_history
  WHERE template_id = prompt_templates.id
  ORDER BY changed_at DESC
  LIMIT 1
)
WHERE template_key = 'recipe_recommendation_ko';
```

---

## 📝 참고 문서

- **상세 가이드**: `docs/PROMPT_TEMPLATE_GUIDE.md`
- **DB 스키마**: `supabase/migrations/002_create_prompt_templates.sql`
- **초기 데이터**: `supabase/migrations/003_insert_default_prompts.sql`
- **서비스 코드**: `src/services/PromptTemplateService.ts`

---

## 🎯 다음 단계 (선택사항)

1. **관리자 UI 개발**
   - 프로필 화면에 "프롬프트 관리" 메뉴 추가
   - 프롬프트 편집 화면
   - 히스토리 조회 및 롤백

2. **A/B 테스트 기능**
   - 사용자 그룹별 다른 프롬프트 제공
   - 효과 측정 및 분석

3. **다국어 확장**
   - 일본어, 중국어 프롬프트 추가
   - 자동 언어 감지 및 선택

4. **프롬프트 버전 UI**
   - 버전 비교 기능
   - 성능 지표 시각화

---

**구축 완료일**: 2025-10-27
**구축자**: Claude Code
**버전**: 1.0.0

모든 준비가 완료되었습니다! 🎉
