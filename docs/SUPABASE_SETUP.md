# Supabase 설정 가이드

## 현재 상황
앱이 기존 `saved_recipes` 테이블을 사용하도록 임시 수정되었습니다.
새로운 레시피 공유 시스템을 사용하려면 아래 단계를 따르세요.

## Option 1: 기존 데이터 유지하며 새 시스템 적용 (권장)

Supabase SQL Editor에서 다음 스크립트를 순서대로 실행하세요:

### Step 1: 새 테이블 생성
```sql
-- 1. 새 테이블 생성 (src/services/createRecipeSharingTables.sql 내용 실행)
-- Supabase SQL Editor에서 createRecipeSharingTables.sql 파일 내용 복사하여 실행
```

### Step 2: 데이터 마이그레이션
```sql
-- 2. 기존 데이터 마이그레이션 (src/services/migrateRecipeData.sql 내용 실행)
-- Supabase SQL Editor에서 migrateRecipeData.sql 파일 내용 복사하여 실행
```

### Step 3: RecipeService 원복
RecipeService.ts에서 다음 부분을 수정:
- `getUserSavedRecipes` 메서드: 새 테이블 구조 사용
- `saveRecipe` 메서드: 새 테이블 구조 사용

## Option 2: 기존 데이터 삭제 후 새로 시작 (간단)

Supabase SQL Editor에서 실행:

```sql
-- 1. 기존 테이블 삭제 (주의: 모든 레시피 데이터 삭제됨)
DROP TABLE IF EXISTS saved_recipes CASCADE;

-- 2. 새 테이블 생성
-- src/services/createRecipeSharingTables.sql 내용 실행
```

## 테스트 확인사항
1. 요리책 화면 정상 로드
2. 새 레시피 저장 기능
3. 레시피 삭제 기능
4. 북마크 토글 기능

## 문제 해결
- 에러 발생 시 브라우저 개발자 도구에서 네트워크 탭 확인
- Supabase 대시보드에서 테이블 구조 확인
- RLS 정책이 올바르게 설정되었는지 확인