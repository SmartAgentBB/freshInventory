-- Create simple history table for tracking food item usage
-- This is the minimal structure needed for the current React Native app

CREATE TABLE IF NOT EXISTS history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  food_item_id UUID NOT NULL REFERENCES food_items(id) ON DELETE CASCADE,
  remain_before DECIMAL(3,2) DEFAULT 1.0,
  remain_after DECIMAL(3,2) DEFAULT 0.0,
  waste BOOLEAN DEFAULT false,
  frozen BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_history_food_item_id ON history(food_item_id);
CREATE INDEX IF NOT EXISTS idx_history_updated_at ON history(updated_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for history table
-- Users can only see history for their own food items
CREATE POLICY "Users can view their own food item history" ON history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM food_items 
      WHERE food_items.id = history.food_item_id 
      AND food_items.user_id = auth.uid()
    )
  );

-- Users can insert history for their own food items
CREATE POLICY "Users can insert history for their own food items" ON history
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM food_items 
      WHERE food_items.id = history.food_item_id 
      AND food_items.user_id = auth.uid()
    )
  );

-- Grant necessary permissions
GRANT ALL ON history TO authenticated;



"지난기록"을 "소비완료"로 변경하고, 
소비완료 탭 화면의 상단에는 

최근에 소비한 재료를 확인하세요. 
재구매가 필요한 재료를 장보기 목록에 쉽게 추가하세요.


