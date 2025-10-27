# 프롬프트 템플릿 동적 관리 시스템

## 📋 개요

앱 재배포 없이 AI 프롬프트를 실시간으로 수정할 수 있는 동적 관리 시스템입니다.

### 주요 기능
- ✅ **DB 기반 프롬프트 관리**: Supabase에 프롬프트 저장
- ✅ **3단계 캐싱**: 메모리 → AsyncStorage → Supabase
- ✅ **자동 동기화**: 로그인 시 + 일 1회 백그라운드 동기화
- ✅ **Fallback 지원**: DB 장애 시에도 앱 정상 작동
- ✅ **버전 관리**: 프롬프트 변경 히스토리 추적

---

## 🏗️ 시스템 아키텍처

```
┌─────────────────┐
│   AIService     │
│  (프롬프트 사용) │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────┐
│  PromptTemplateService      │
│  (3단계 폴백)                │
│                             │
│  1. Memory Cache            │
│  2. AsyncStorage (로컬)     │
│  3. Supabase DB (원본)      │
└─────────────────────────────┘
```

---

## 🚀 설치 및 설정

### 1. DB 마이그레이션 실행

Supabase 대시보드에서 다음 SQL 파일들을 순서대로 실행:

#### Step 1: 테이블 생성
```bash
# 파일: supabase/migrations/002_create_prompt_templates.sql
```

이 파일은 다음을 생성합니다:
- `prompt_templates` 테이블
- `prompt_history` 테이블 (변경 히스토리)
- RLS(Row Level Security) 정책
- 자동 업데이트 트리거

**Supabase 실행 방법:**
1. Supabase 대시보드 접속
2. SQL Editor 메뉴 선택
3. `002_create_prompt_templates.sql` 파일 내용 복사
4. "Run" 버튼 클릭

#### Step 2: 기본 프롬프트 삽입
```bash
# 파일: supabase/migrations/003_insert_default_prompts.sql
```

이 파일은 다음 프롬프트를 삽입합니다:
- `recipe_recommendation_ko`: 한국어 요리 추천 (요리 스타일 있을 때)
- `recipe_recommendation_en`: 영어 요리 추천 (요리 스타일 있을 때)
- `recipe_recommendation_ko_no_style`: 한국어 요리 추천 (요리 스타일 없을 때)
- `recipe_recommendation_en_no_style`: 영어 요리 추천 (요리 스타일 없을 때)
- `ingredient_analysis_ko`: 한국어 식재료 분석
- `ingredient_analysis_en`: 영어 식재료 분석
- `expired_detection_ko`: 상한 식재료 감지
- `categorization_ko`: 식재료 분류

**Supabase 실행 방법:**
1. SQL Editor에서 새 쿼리 생성
2. `003_insert_default_prompts.sql` 파일 내용 복사
3. "Run" 버튼 클릭
4. 결과 확인: `SELECT * FROM prompt_templates;`

### 2. 앱 동기화 확인

앱을 실행하면 자동으로:
1. **로그인 시**: DB에서 최신 프롬프트 다운로드
2. **백그라운드**: 24시간마다 자동 동기화
3. **오프라인**: 로컬 캐시 사용

---

## 📝 프롬프트 관리

### 프롬프트 조회

```sql
-- 모든 활성 프롬프트 조회
SELECT
  template_key,
  version,
  LEFT(template_content, 100) as preview,
  updated_at
FROM prompt_templates
WHERE is_active = true;
```

### 프롬프트 수정

#### 방법 1: 직접 UPDATE (간단)
```sql
-- 요리 추천 프롬프트 수정
UPDATE prompt_templates
SET
  template_content = '수정된 프롬프트 내용...',
  version = version + 1
WHERE template_key = 'recipe_recommendation_ko';
```

#### 방법 2: 히스토리 저장 함수 사용 (권장)
```sql
-- 히스토리와 함께 업데이트
SELECT update_prompt_with_history(
  'recipe_recommendation_ko',
  '수정된 프롬프트 내용...',
  '요리 스타일 강조 개선'
);
```

### 프롬프트 변경 히스토리 조회

```sql
-- 특정 프롬프트의 변경 히스토리
SELECT
  h.version,
  h.changed_at,
  LEFT(h.template_content, 100) as old_content,
  h.change_reason
FROM prompt_history h
JOIN prompt_templates pt ON h.template_id = pt.id
WHERE pt.template_key = 'recipe_recommendation_ko'
ORDER BY h.changed_at DESC;
```

### 프롬프트 롤백

```sql
-- 이전 버전으로 복구
UPDATE prompt_templates pt
SET
  template_content = h.template_content,
  version = version + 1
FROM prompt_history h
WHERE
  pt.template_key = 'recipe_recommendation_ko'
  AND h.template_id = pt.id
  AND h.version = 2; -- 복구할 버전
```

---

## 🔧 프롬프트 템플릿 작성

### 변수 치환

프롬프트에 `{{변수명}}` 형식으로 동적 값 삽입:

```javascript
// 템플릿 예시
`당신은 요리 전문가입니다.

보유 식재료: {{ingredients}}
요리 스타일: {{cookingStyle}}

위 재료로 {{cookingStyle}} 스타일의 요리를 추천해주세요.`

// 실제 사용 시
await promptTemplateService.getPromptWithVariables(
  'recipe_recommendation_ko',
  {
    ingredients: '김치, 돼지고기, 두부',
    cookingStyle: '간편한'
  }
);

// 결과
`당신은 요리 전문가입니다.

보유 식재료: 김치, 돼지고기, 두부
요리 스타일: 간편한

위 재료로 간편한 스타일의 요리를 추천해주세요.`
```

### 지원 변수

#### recipe_recommendation_ko/en (요리 스타일 있을 때)
- `{{ingredients}}`: 식재료 목록
- `{{cookingStyle}}`: 요리 스타일

#### recipe_recommendation_ko_no_style/en_no_style (요리 스타일 없을 때)
- `{{ingredients}}`: 식재료 목록

#### ingredient_analysis_ko/en
- (변수 없음, 이미지와 함께 사용)

#### expired_detection_ko
- (변수 없음, 이미지와 함께 사용)

#### categorization_ko
- `{{foodName}}`: 식재료 이름

---

## 💡 프롬프트 자동 선택

AIService는 요리 스타일 입력 여부에 따라 자동으로 적절한 프롬프트를 선택합니다:

```typescript
// 요리 스타일이 있을 때
generateRecipeSuggestions(ingredients, "간편한", "ko")
→ recipe_recommendation_ko 사용
  (요리 스타일 강조 프롬프트)

// 요리 스타일이 없을 때
generateRecipeSuggestions(ingredients, "", "ko")
→ recipe_recommendation_ko_no_style 사용
  (다양한 조리법 추천 프롬프트)
```

---

## 🎯 프롬프트 개선 예시

### 문제: 요리 스타일이 잘 반영되지 않음

**기존 프롬프트 (version 1):**
```
사용자 요청사항: {{cookingStyle}}
이 요청사항을 최대한 반영하여 추천해주세요.
```

**개선된 프롬프트 (version 2):**
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

추가 원칙:
1. **요리 스타일을 레시피 선정의 최우선 기준으로 삼으세요**
2. 실제로 존재하는 대중적인 한국 요리만 추천
3. 각 요리마다 다른 주재료 활용
...',
  version = version + 1
WHERE template_key = 'recipe_recommendation_ko';
```

---

## 🔍 디버깅 및 모니터링

### 앱 로그 확인

```javascript
// 프롬프트 동기화 로그
[PromptTemplate] Starting sync...
[PromptTemplate] Sync completed: 6 templates

// 프롬프트 사용 로그
[PromptTemplate] Using memory cache for recipe_recommendation_ko
[PromptTemplate] Using AsyncStorage cache for ingredient_analysis_ko
[PromptTemplate] Fetching from DB for expired_detection_ko
```

### 캐시 상태 확인

```typescript
// 개발자 도구에서 실행
import { promptTemplateService } from './src/services/PromptTemplateService';

// 캐시된 템플릿 조회
const cached = await promptTemplateService.getCachedTemplates();
console.log(cached);

// 마지막 동기화 시간
const lastSync = await promptTemplateService.getLastSyncTime();
console.log('Last sync:', lastSync);
```

### 수동 동기화

```typescript
// 프로필 화면 등에 "프롬프트 새로고침" 버튼 추가
const handleSyncPrompts = async () => {
  const success = await promptTemplateService.syncPrompts();
  if (success) {
    Alert.alert('성공', '최신 프롬프트를 가져왔습니다.');
  } else {
    Alert.alert('실패', '프롬프트 동기화에 실패했습니다.');
  }
};
```

---

## ⚠️ 주의사항

### 1. 프롬프트 테스트
프로덕션 적용 전 반드시 테스트:
```sql
-- 테스트용 프롬프트 생성
INSERT INTO prompt_templates (template_key, template_content, is_active)
VALUES ('recipe_recommendation_ko_test', '테스트 프롬프트...', false);

-- 테스트 완료 후 활성화
UPDATE prompt_templates
SET is_active = true
WHERE template_key = 'recipe_recommendation_ko_test';
```

### 2. 변수명 오타
템플릿에서 `{{cookingStyle}}` 변수명 오타 시 빈 문자열로 치환됨

### 3. JSON 이스케이프
프롬프트에 특수문자(`'`, `"`) 사용 시 이스케이프 필요:
```sql
-- 잘못된 예
'User's preference: "healthy"' -- 에러 발생

-- 올바른 예
'User''s preference: "healthy"' -- 작은따옴표 두 번
```

### 4. 캐시 무효화
프롬프트 수정 후 즉시 반영되지 않을 수 있음:
- 로그아웃 → 로그인 (강제 동기화)
- 24시간 후 자동 동기화
- 앱 재시작

---

## 📊 성능 및 비용

### Supabase 읽기 요청
- 로그인 시: 1회
- 일 1회 자동 동기화: 1회
- **월간 예상**: 사용자당 30-60회 읽기 → **거의 무료**

### 캐시 히트율
- 메모리 캐시: ~95% (앱 실행 중)
- AsyncStorage: ~99% (오프라인 포함)
- DB 접근: ~1% (초기 로드, 동기화)

---

## 🛠️ 고급 기능

### A/B 테스트

```sql
-- 사용자 그룹별 다른 프롬프트
-- (추후 구현 가능)
SELECT * FROM prompt_templates
WHERE template_key = 'recipe_recommendation_ko'
  AND user_group = 'experiment_group';
```

### 다국어 프롬프트 관리

```sql
-- 언어별 프롬프트 자동 선택
SELECT * FROM prompt_templates
WHERE template_key LIKE 'recipe_recommendation_%'
  AND template_key LIKE '%_' || :language;
```

---

## 📞 문제 해결

### Q: 프롬프트 수정이 반영되지 않아요
**A:**
1. DB에서 `is_active = true` 확인
2. 앱 로그에서 동기화 성공 확인
3. 캐시 초기화: 로그아웃 → 로그인

### Q: DB 접속 실패 시 앱이 동작하나요?
**A:** 네! Fallback 시스템으로 로컬 캐시 사용

### Q: 프롬프트 변경 히스토리를 삭제해도 되나요?
**A:** 가능하지만, 롤백이 불가능해집니다. 1년 이상 된 히스토리만 삭제 권장

### Q: 프롬프트를 실수로 망가뜨렸어요
**A:** 히스토리에서 복구:
```sql
SELECT * FROM prompt_history
WHERE template_id = (
  SELECT id FROM prompt_templates
  WHERE template_key = 'recipe_recommendation_ko'
)
ORDER BY changed_at DESC;
```

---

## 🎓 참고 자료

- **구현 파일**:
  - `src/services/PromptTemplateService.ts`
  - `src/services/AIService.ts`
  - `src/hooks/useAuth.ts`
- **DB 스키마**: `supabase/migrations/002_create_prompt_templates.sql`
- **초기 데이터**: `supabase/migrations/003_insert_default_prompts.sql`

---

**업데이트**: 2025-10-27
**버전**: 1.0.0
