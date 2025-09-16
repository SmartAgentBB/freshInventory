-- Create saved_recipes table for storing user's bookmarked recipes
-- Based on the prototype's cookBook table structure

CREATE TABLE IF NOT EXISTS saved_recipes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  ingredients JSONB NOT NULL, -- Store as JSON array
  difficulty TEXT NOT NULL CHECK (difficulty IN ('쉬움', '보통', '어려움')),
  cooking_time INTEGER NOT NULL, -- in minutes
  instructions JSONB NOT NULL, -- Store as JSON array
  youtube_query TEXT, -- For YouTube search
  bookmarked BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure unique recipe per user (based on name)
  UNIQUE(user_id, name)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_saved_recipes_user_id ON saved_recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_recipes_bookmarked ON saved_recipes(bookmarked);
CREATE INDEX IF NOT EXISTS idx_saved_recipes_created_at ON saved_recipes(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE saved_recipes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see their own saved recipes
CREATE POLICY "Users can view their own saved recipes" ON saved_recipes
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own saved recipes
CREATE POLICY "Users can insert their own saved recipes" ON saved_recipes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own saved recipes
CREATE POLICY "Users can update their own saved recipes" ON saved_recipes
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own saved recipes
CREATE POLICY "Users can delete their own saved recipes" ON saved_recipes
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_saved_recipes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_saved_recipes_updated_at_trigger
  BEFORE UPDATE ON saved_recipes
  FOR EACH ROW
  EXECUTE FUNCTION update_saved_recipes_updated_at();

-- Grant necessary permissions
GRANT ALL ON saved_recipes TO authenticated;