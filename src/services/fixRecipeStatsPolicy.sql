-- Fix recipe_stats RLS policies to allow triggers to work properly
-- Run this in Supabase SQL Editor

-- Drop existing policies
DROP POLICY IF EXISTS "Recipe stats are viewable by all authenticated users" ON recipe_stats;

-- Create new policies
-- Allow authenticated users to view recipe stats
CREATE POLICY "Recipe stats are viewable by all authenticated users" ON recipe_stats
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Allow authenticated users to insert recipe stats (for trigger)
CREATE POLICY "Authenticated users can create recipe stats" ON recipe_stats
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Allow authenticated users to update recipe stats (for trigger)
CREATE POLICY "Authenticated users can update recipe stats" ON recipe_stats
  FOR UPDATE
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Verify the policies
SELECT * FROM pg_policies WHERE tablename = 'recipe_stats';