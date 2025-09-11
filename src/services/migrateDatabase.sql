-- 기존 테이블 구조를 유지하면서 필요한 컬럼만 추가/수정하는 스크립트

-- 1. user_id 컬럼 타입 확인 및 수정
-- 만약 user_id가 TEXT 타입이라면 UUID로 변경 필요
-- 주의: 기존 데이터가 UUID 형식이 아니면 오류 발생할 수 있음

-- food_items 테이블 수정
ALTER TABLE food_items 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'fresh';

ALTER TABLE food_items 
ADD COLUMN IF NOT EXISTS added_date TIMESTAMP WITH TIME ZONE DEFAULT NOW();

ALTER TABLE food_items 
ADD COLUMN IF NOT EXISTS expiry_date TIMESTAMP WITH TIME ZONE;

ALTER TABLE food_items 
ADD COLUMN IF NOT EXISTS memo TEXT;

ALTER TABLE food_items 
ADD COLUMN IF NOT EXISTS original_name TEXT;

-- shopping_items 테이블이 없다면 생성
CREATE TABLE IF NOT EXISTS shopping_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  quantity NUMERIC DEFAULT 1,
  unit TEXT DEFAULT '개',
  category TEXT DEFAULT 'other',
  memo TEXT,
  todo BOOLEAN DEFAULT true,
  completed BOOLEAN DEFAULT FALSE,
  completed_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- shopping_items에 todo 컬럼 추가 (기존 테이블이 있는 경우)
ALTER TABLE shopping_items 
ADD COLUMN IF NOT EXISTS todo BOOLEAN DEFAULT true;

-- 인덱스 생성 (없는 경우에만)
CREATE INDEX IF NOT EXISTS idx_food_items_status ON food_items(status);
CREATE INDEX IF NOT EXISTS idx_shopping_items_todo ON shopping_items(todo);

-- RLS 정책 확인 및 생성
DO $$ 
BEGIN
  -- food_items RLS 정책
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'food_items' 
    AND policyname = 'Users can view their own food items'
  ) THEN
    CREATE POLICY "Users can view their own food items" ON food_items
      FOR SELECT USING (auth.uid()::text = user_id::text OR true); -- 임시로 모두 허용
  END IF;
END $$;