-- ====================================================
-- Recipe Sharing System Database Schema
-- ====================================================

-- 1. Master Recipes Table (모든 레시피의 마스터 데이터)
CREATE TABLE IF NOT EXISTS recipes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  ingredients JSONB NOT NULL, -- Array of {name, amount, unit}
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  cooking_time INTEGER NOT NULL, -- in minutes
  instructions JSONB NOT NULL, -- Array of step strings
  youtube_query TEXT,
  image_url TEXT, -- 레시피 대표 이미지
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_public BOOLEAN DEFAULT true, -- 공개 여부
  save_count INTEGER DEFAULT 0, -- 총 저장 횟수
  share_count INTEGER DEFAULT 0, -- 공유 횟수
  source_type TEXT DEFAULT 'ai_generated' CHECK (source_type IN ('ai_generated', 'user_created', 'shared')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. User-Recipe Relationship Table (사용자별 저장 관계)
CREATE TABLE IF NOT EXISTS user_saved_recipes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  personal_notes TEXT, -- 개인 메모
  rating INTEGER CHECK (rating >= 1 AND rating <= 5), -- 1-5 평점
  saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, recipe_id) -- 사용자당 레시피 하나만 저장 가능
);

-- 3. Recipe Shares Table (공유 관리)
CREATE TABLE IF NOT EXISTS recipe_shares (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  shared_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  share_code TEXT UNIQUE NOT NULL, -- 고유 공유 코드 (예: RCP-XXXX-XXXX)
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'), -- 30일 후 만료
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Recipe Statistics Table (통계)
CREATE TABLE IF NOT EXISTS recipe_stats (
  recipe_id UUID PRIMARY KEY REFERENCES recipes(id) ON DELETE CASCADE,
  total_saves INTEGER DEFAULT 0,
  weekly_saves INTEGER DEFAULT 0,
  monthly_saves INTEGER DEFAULT 0,
  avg_rating DECIMAL(2,1) DEFAULT 0.0,
  popularity_score DECIMAL(5,2) DEFAULT 0.0,
  last_calculated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ====================================================
-- Indexes for Performance
-- ====================================================

-- Recipes indexes
CREATE INDEX IF NOT EXISTS idx_recipes_created_by ON recipes(created_by);
CREATE INDEX IF NOT EXISTS idx_recipes_is_public ON recipes(is_public);
CREATE INDEX IF NOT EXISTS idx_recipes_save_count ON recipes(save_count DESC);
CREATE INDEX IF NOT EXISTS idx_recipes_created_at ON recipes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recipes_source_type ON recipes(source_type);

-- User saved recipes indexes
CREATE INDEX IF NOT EXISTS idx_user_saved_recipes_user_id ON user_saved_recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_saved_recipes_recipe_id ON user_saved_recipes(recipe_id);
CREATE INDEX IF NOT EXISTS idx_user_saved_recipes_saved_at ON user_saved_recipes(saved_at DESC);

-- Recipe shares indexes
CREATE INDEX IF NOT EXISTS idx_recipe_shares_share_code ON recipe_shares(share_code);
CREATE INDEX IF NOT EXISTS idx_recipe_shares_recipe_id ON recipe_shares(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_shares_expires_at ON recipe_shares(expires_at);

-- Recipe stats indexes
CREATE INDEX IF NOT EXISTS idx_recipe_stats_popularity ON recipe_stats(popularity_score DESC);

-- ====================================================
-- Row Level Security (RLS) Policies
-- ====================================================

-- Enable RLS on all tables
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_saved_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_stats ENABLE ROW LEVEL SECURITY;

-- Recipes policies
CREATE POLICY "Public recipes are viewable by all" ON recipes
  FOR SELECT
  USING (is_public = true OR auth.uid() = created_by);

CREATE POLICY "Users can create recipes" ON recipes
  FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own recipes" ON recipes
  FOR UPDATE
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete their own recipes" ON recipes
  FOR DELETE
  USING (auth.uid() = created_by);

-- User saved recipes policies
CREATE POLICY "Users can view their saved recipes" ON user_saved_recipes
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can save recipes" ON user_saved_recipes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their saved recipes" ON user_saved_recipes
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove saved recipes" ON user_saved_recipes
  FOR DELETE
  USING (auth.uid() = user_id);

-- Recipe shares policies
CREATE POLICY "Users can view shares they created" ON recipe_shares
  FOR SELECT
  USING (auth.uid() = shared_by OR EXISTS (
    SELECT 1 FROM recipes WHERE recipes.id = recipe_shares.recipe_id AND recipes.is_public = true
  ));

CREATE POLICY "Users can create shares for their recipes" ON recipe_shares
  FOR INSERT
  WITH CHECK (
    auth.uid() = shared_by AND
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = recipe_shares.recipe_id
      AND (recipes.created_by = auth.uid() OR recipes.is_public = true)
    )
  );

CREATE POLICY "Users can delete their shares" ON recipe_shares
  FOR DELETE
  USING (auth.uid() = shared_by);

-- Recipe stats policies (read-only for all authenticated users)
CREATE POLICY "Recipe stats are viewable by all authenticated users" ON recipe_stats
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- ====================================================
-- Functions and Triggers
-- ====================================================

-- Function to generate unique share code
CREATE OR REPLACE FUNCTION generate_share_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := 'RCP-';
  i INTEGER;
BEGIN
  FOR i IN 1..4 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  result := result || '-';
  FOR i IN 1..4 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Trigger to set share code on insert
CREATE OR REPLACE FUNCTION set_share_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.share_code IS NULL THEN
    NEW.share_code := generate_share_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER recipe_shares_set_share_code
  BEFORE INSERT ON recipe_shares
  FOR EACH ROW
  EXECUTE FUNCTION set_share_code();

-- Function to update recipe save count
CREATE OR REPLACE FUNCTION update_recipe_save_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE recipes SET save_count = save_count + 1 WHERE id = NEW.recipe_id;
    -- Also update stats
    INSERT INTO recipe_stats (recipe_id, total_saves)
    VALUES (NEW.recipe_id, 1)
    ON CONFLICT (recipe_id)
    DO UPDATE SET total_saves = recipe_stats.total_saves + 1;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE recipes SET save_count = GREATEST(save_count - 1, 0) WHERE id = OLD.recipe_id;
    -- Also update stats
    UPDATE recipe_stats
    SET total_saves = GREATEST(total_saves - 1, 0)
    WHERE recipe_id = OLD.recipe_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_recipe_save_count_trigger
  AFTER INSERT OR DELETE ON user_saved_recipes
  FOR EACH ROW
  EXECUTE FUNCTION update_recipe_save_count();

-- Function to update recipe share count
CREATE OR REPLACE FUNCTION update_recipe_share_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE recipes SET share_count = share_count + 1 WHERE id = NEW.recipe_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE recipes SET share_count = GREATEST(share_count - 1, 0) WHERE id = OLD.recipe_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_recipe_share_count_trigger
  AFTER INSERT OR DELETE ON recipe_shares
  FOR EACH ROW
  EXECUTE FUNCTION update_recipe_share_count();

-- Function to calculate popularity score
CREATE OR REPLACE FUNCTION calculate_popularity_score(
  p_save_count INTEGER,
  p_share_count INTEGER,
  p_avg_rating DECIMAL,
  p_recent_saves INTEGER
)
RETURNS DECIMAL AS $$
BEGIN
  RETURN (
    (p_save_count * 0.4) +
    (p_share_count * 0.3) +
    (p_avg_rating * 20 * 0.2) + -- Convert 5-point scale to 100-point
    (p_recent_saves * 0.1)
  );
END;
$$ LANGUAGE plpgsql;

-- Function to update recipe stats
CREATE OR REPLACE FUNCTION update_recipe_stats()
RETURNS VOID AS $$
BEGIN
  -- Update average ratings
  UPDATE recipe_stats rs
  SET avg_rating = (
    SELECT COALESCE(AVG(rating), 0)
    FROM user_saved_recipes
    WHERE recipe_id = rs.recipe_id AND rating IS NOT NULL
  );

  -- Update weekly saves (last 7 days)
  UPDATE recipe_stats rs
  SET weekly_saves = (
    SELECT COUNT(*)
    FROM user_saved_recipes
    WHERE recipe_id = rs.recipe_id
    AND saved_at >= NOW() - INTERVAL '7 days'
  );

  -- Update monthly saves (last 30 days)
  UPDATE recipe_stats rs
  SET monthly_saves = (
    SELECT COUNT(*)
    FROM user_saved_recipes
    WHERE recipe_id = rs.recipe_id
    AND saved_at >= NOW() - INTERVAL '30 days'
  );

  -- Update popularity score
  UPDATE recipe_stats rs
  SET popularity_score = calculate_popularity_score(
    rs.total_saves,
    (SELECT share_count FROM recipes WHERE id = rs.recipe_id),
    rs.avg_rating,
    rs.weekly_saves
  ),
  last_calculated = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_recipes_updated_at BEFORE UPDATE ON recipes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ====================================================
-- Grant Permissions
-- ====================================================

GRANT ALL ON recipes TO authenticated;
GRANT ALL ON user_saved_recipes TO authenticated;
GRANT ALL ON recipe_shares TO authenticated;
GRANT ALL ON recipe_stats TO authenticated;

-- Allow using sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;