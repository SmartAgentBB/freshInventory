-- Saved Recipes 테이블 difficulty 문제 해결
-- 단계별로 실행해주세요!

-- ==========================================
-- STEP 1: 현재 상태 확인
-- ==========================================
SELECT difficulty, COUNT(*) as count
FROM saved_recipes
GROUP BY difficulty
ORDER BY difficulty;

-- ==========================================
-- STEP 2: 제약조건 먼저 제거 (중요!)
-- ==========================================
ALTER TABLE saved_recipes
DROP CONSTRAINT IF EXISTS saved_recipes_difficulty_check;

-- ==========================================
-- STEP 3: 이제 데이터를 안전하게 수정
-- ==========================================
-- 한글 값들을 영어로 변환
UPDATE saved_recipes
SET difficulty = CASE
    WHEN difficulty IN ('쉬움', '매우쉬움', '매우 쉬움') THEN 'easy'
    WHEN difficulty IN ('보통', '중간') THEN 'medium'
    WHEN difficulty IN ('어려움', '매우어려움', '매우 어려움') THEN 'hard'
    WHEN difficulty IN ('easy', 'Easy', 'EASY') THEN 'easy'
    WHEN difficulty IN ('medium', 'Medium', 'MEDIUM') THEN 'medium'
    WHEN difficulty IN ('hard', 'Hard', 'HARD') THEN 'hard'
    ELSE 'medium'  -- 알 수 없는 값은 medium으로
END;

-- NULL 값들도 medium으로 업데이트
UPDATE saved_recipes
SET difficulty = 'medium'
WHERE difficulty IS NULL;

-- ==========================================
-- STEP 4: 데이터 정리 결과 확인
-- ==========================================
SELECT difficulty, COUNT(*) as count
FROM saved_recipes
GROUP BY difficulty
ORDER BY difficulty;

-- 결과가 easy, medium, hard만 있는지 확인!

-- ==========================================
-- STEP 5: 새로운 제약조건 추가
-- ==========================================
ALTER TABLE saved_recipes
ADD CONSTRAINT saved_recipes_difficulty_check
CHECK (difficulty IN ('easy', 'medium', 'hard'));

-- ==========================================
-- STEP 6: 기본값 설정
-- ==========================================
ALTER TABLE saved_recipes
ALTER COLUMN difficulty SET DEFAULT 'medium';

-- ==========================================
-- STEP 7: 인덱스 추가 (성능 최적화)
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_saved_recipes_user_bookmarked
ON saved_recipes (user_id, bookmarked)
WHERE bookmarked = TRUE;

-- ==========================================
-- STEP 8: 최종 확인
-- ==========================================
SELECT
    'Total recipes' as category,
    COUNT(*) as count
FROM saved_recipes
UNION ALL
SELECT
    'Difficulty: ' || difficulty as category,
    COUNT(*) as count
FROM saved_recipes
GROUP BY difficulty
ORDER BY category;