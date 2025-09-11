-- Add missing columns to food_items table if they don't exist
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_food_items_status ON food_items(status);

-- Create shopping_items table if it doesn't exist
CREATE TABLE IF NOT EXISTS shopping_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  quantity NUMERIC DEFAULT 1,
  unit TEXT DEFAULT '개',
  category TEXT DEFAULT 'other',
  memo TEXT,
  completed BOOLEAN DEFAULT FALSE,
  completed_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for shopping_items
CREATE INDEX IF NOT EXISTS idx_shopping_items_user_id ON shopping_items(user_id);
CREATE INDEX IF NOT EXISTS idx_shopping_items_completed ON shopping_items(completed);