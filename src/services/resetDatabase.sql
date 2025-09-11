-- 기존 테이블과 데이터를 모두 삭제하고 새로 생성하는 스크립트
-- 주의: 이 스크립트는 모든 데이터를 삭제합니다!

-- 1. 기존 테이블 삭제
DROP TABLE IF EXISTS food_items CASCADE;
DROP TABLE IF EXISTS shopping_items CASCADE;

-- 2. food_items 테이블 새로 생성
CREATE TABLE food_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,  -- UUID 타입으로 설정
  name TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit TEXT DEFAULT '개',
  category TEXT DEFAULT 'other',
  status TEXT DEFAULT 'fresh',
  added_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expiry_date TIMESTAMP WITH TIME ZONE,
  memo TEXT,
  original_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. shopping_items 테이블 생성
CREATE TABLE shopping_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,  -- UUID 타입으로 설정
  name TEXT NOT NULL,
  quantity NUMERIC DEFAULT 1,
  unit TEXT DEFAULT '개',
  category TEXT DEFAULT 'other',
  memo TEXT,
  todo BOOLEAN DEFAULT true,  -- todo 상태 추가
  completed BOOLEAN DEFAULT FALSE,
  completed_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 인덱스 생성
CREATE INDEX idx_food_items_user_id ON food_items(user_id);
CREATE INDEX idx_food_items_status ON food_items(status);
CREATE INDEX idx_food_items_category ON food_items(category);
CREATE INDEX idx_shopping_items_user_id ON shopping_items(user_id);
CREATE INDEX idx_shopping_items_todo ON shopping_items(todo);
CREATE INDEX idx_shopping_items_completed ON shopping_items(completed);

-- 5. Row Level Security 활성화
ALTER TABLE food_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_items ENABLE ROW LEVEL SECURITY;

-- 6. RLS 정책 생성 (사용자는 자신의 데이터만 접근 가능)
-- food_items 정책
CREATE POLICY "Users can view their own food items" ON food_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own food items" ON food_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own food items" ON food_items
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own food items" ON food_items
  FOR DELETE USING (auth.uid() = user_id);

-- shopping_items 정책
CREATE POLICY "Users can view their own shopping items" ON shopping_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own shopping items" ON shopping_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own shopping items" ON shopping_items
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own shopping items" ON shopping_items
  FOR DELETE USING (auth.uid() = user_id);

-- 7. 테스트 데이터 삽입 (선택사항 - 현재 로그인한 사용자용)
-- 실제 user_id를 사용해야 합니다. 예: 'eb423dfb-02a3-4a08-85e2-ddbeebd4f09d'
/*
INSERT INTO food_items (user_id, name, quantity, unit, category, status) VALUES
  ('eb423dfb-02a3-4a08-85e2-ddbeebd4f09d', '사과', 5, '개', '과일', 'fresh'),
  ('eb423dfb-02a3-4a08-85e2-ddbeebd4f09d', '우유', 1, 'L', '유제품', 'fresh'),
  ('eb423dfb-02a3-4a08-85e2-ddbeebd4f09d', '당근', 3, '개', '채소', 'fresh');

INSERT INTO shopping_items (user_id, name, quantity, unit, category, todo) VALUES
  ('eb423dfb-02a3-4a08-85e2-ddbeebd4f09d', '계란', 10, '개', '기타', true),
  ('eb423dfb-02a3-4a08-85e2-ddbeebd4f09d', '빵', 1, '개', '곡물', true);
*/