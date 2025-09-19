-- Saved Recipes 테이블 difficulty 제약조건 안전하게 수정
-- 목적: 기존 데이터를 정리한 후 제약조건 변경

-- 1. 먼저 현재 difficulty 값들을 확인
SELECT difficulty, COUNT(*) as count
FROM saved_recipes
GROUP BY difficulty
ORDER BY difficulty;

-- 2. 잘못된 difficulty 값들을 먼저 수정
-- 한글 값들을 영어로 변환
UPDATE saved_recipes
SET difficulty = CASE
    WHEN LOWER(difficulty) IN ('쉬움', '매우쉬움', '매우 쉬움') THEN 'easy'
    WHEN LOWER(difficulty) IN ('보통', '중간') THEN 'medium'
    WHEN LOWER(difficulty) IN ('어려움', '매우어려움', '매우 어려움') THEN 'hard'
    WHEN LOWER(difficulty) IN ('easy', 'medium', 'hard') THEN LOWER(difficulty)
    ELSE 'medium'  -- 알 수 없는 값은 medium으로
END
WHERE difficulty IS NOT NULL;

-- NULL 값들도 medium으로 업데이트
UPDATE saved_recipes
SET difficulty = 'medium'
WHERE difficulty IS NULL;

-- 3. 다시 확인
SELECT difficulty, COUNT(*) as count
FROM saved_recipes
GROUP BY difficulty
ORDER BY difficulty;

-- 4. 이제 모든 값이 정리되었으므로 기존 제약조건 제거
ALTER TABLE saved_recipes
DROP CONSTRAINT IF EXISTS saved_recipes_difficulty_check;

-- 5. 새로운 제약조건 추가 (대소문자 구분 없이)
ALTER TABLE saved_recipes
ADD CONSTRAINT saved_recipes_difficulty_check
CHECK (LOWER(difficulty) IN ('easy', 'medium', 'hard'));

-- 6. 기본값 설정
ALTER TABLE saved_recipes
ALTER COLUMN difficulty SET DEFAULT 'medium';

-- 7. NOT NULL 제약조건 추가 (선택사항)
ALTER TABLE saved_recipes
ALTER COLUMN difficulty SET NOT NULL;

-- 8. 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_saved_recipes_user_bookmarked
ON saved_recipes (user_id, bookmarked)
WHERE bookmarked = TRUE;

-- 최종 확인
SELECT difficulty, COUNT(*) as count
FROM saved_recipes
GROUP BY difficulty
ORDER BY difficulty;