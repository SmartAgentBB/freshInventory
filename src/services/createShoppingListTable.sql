-- shopping_list 테이블 생성
CREATE TABLE IF NOT EXISTS shopping_list (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  todo BOOLEAN DEFAULT true,
  memo TEXT,
  insert_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  update_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, name, todo)
);

-- RLS (Row Level Security) 활성화
ALTER TABLE shopping_list ENABLE ROW LEVEL SECURITY;

-- 사용자별 접근 정책
CREATE POLICY "Users can view their own shopping list items" ON shopping_list
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own shopping list items" ON shopping_list
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own shopping list items" ON shopping_list
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own shopping list items" ON shopping_list
  FOR DELETE USING (auth.uid() = user_id);

-- 인덱스 생성
CREATE INDEX idx_shopping_list_user_id ON shopping_list(user_id);
CREATE INDEX idx_shopping_list_todo ON shopping_list(todo);
CREATE INDEX idx_shopping_list_update_date ON shopping_list(update_date DESC);