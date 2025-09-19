-- Shopping List 테이블 제약조건 수정
-- 목적: 활성 장보기 항목(todo=TRUE)은 중복 방지하면서,
--      완료된 항목(todo=FALSE)은 무제한으로 기록 보존

-- 1. 기존 제약조건 제거
ALTER TABLE shopping_list
DROP CONSTRAINT IF EXISTS shopping_list_user_id_name_todo_key;

-- 2. 새로운 부분 유니크 인덱스 생성
-- todo=TRUE인 항목만 (user_id, name) 조합이 고유해야 함
CREATE UNIQUE INDEX shopping_list_active_unique
ON shopping_list (user_id, name)
WHERE todo = TRUE;

-- 3. 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_shopping_list_user_todo
ON shopping_list (user_id, todo);

CREATE INDEX IF NOT EXISTS idx_shopping_list_updated
ON shopping_list (update_date DESC);

-- 확인 쿼리
-- 이제 다음과 같은 데이터가 가능합니다:
-- user_id | name | todo    | created_at
-- 1       | 계란  | FALSE   | 2024-01-01  (첫 구매)
-- 1       | 계란  | FALSE   | 2024-01-15  (재구매)
-- 1       | 계란  | TRUE    | 2024-01-20  (현재 장보기)
-- 1       | 계란  | FALSE   | 2024-01-25  (구매 완료 시)