-- Saved Recipes 테이블 difficulty 제약조건 수정
-- 목적: difficulty 제약조건을 더 유연하게 변경

-- Option 1: 제약조건을 더 유연하게 변경 (한글 값도 허용)
-- 하지만 이는 데이터 일관성을 해칠 수 있음

-- Option 2: 기본값을 가진 제약조건으로 변경 (권장)
-- 1. 기존 제약조건 제거
ALTER TABLE saved_recipes
DROP CONSTRAINT IF EXISTS saved_recipes_difficulty_check;

-- 2. 새로운 제약조건 추가 (대소문자 구분 없이)
ALTER TABLE saved_recipes
ADD CONSTRAINT saved_recipes_difficulty_check
CHECK (LOWER(difficulty) IN ('easy', 'medium', 'hard'));

-- 3. 기본값 설정 (NULL일 경우 medium으로)
ALTER TABLE saved_recipes
ALTER COLUMN difficulty SET DEFAULT 'medium';

-- 4. 기존 NULL 값들을 medium으로 업데이트
UPDATE saved_recipes
SET difficulty = 'medium'
WHERE difficulty IS NULL;

-- 5. 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_saved_recipes_user_bookmarked
ON saved_recipes (user_id, bookmarked)
WHERE bookmarked = TRUE;

-- 확인 쿼리
SELECT DISTINCT difficulty, COUNT(*)
FROM saved_recipes
GROUP BY difficulty
ORDER BY difficulty;